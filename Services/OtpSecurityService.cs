using FICCPlatform.Data;
using FICCPlatform.Models;
using Microsoft.EntityFrameworkCore;

namespace FICCPlatform.Services;

public class OtpSecurityService {
    private readonly AppDbContext _db;
    private readonly NotificationService _notify;
    private readonly ILogger<OtpSecurityService> _log;
    private const int MAX_ATTEMPTS = 5;
    private const int ATTEMPT_WINDOW_MINUTES = 30;

    public OtpSecurityService(AppDbContext db, NotificationService notify, ILogger<OtpSecurityService> log) {
        _db = db; _notify = notify; _log = log;
    }

    // فحص هل الـ Channel معطّل كلياً
    public async Task<bool> IsChannelDisabledAsync(string channel) {
        var key = channel == "sms" ? "otp_sms_disabled" : "otp_email_disabled";
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
        return setting?.SettingValue == "true";
    }

    // تفعيل/تعطيل Channel
    public async Task SetChannelStatusAsync(string channel, bool disabled) {
        var key = channel == "sms" ? "otp_sms_disabled" : "otp_email_disabled";
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.SettingKey == key);
        if (setting == null) {
            _db.Settings.Add(new Setting { 
                SettingKey = key, 
                SettingValue = disabled ? "true" : "false",
                UpdatedAt = DateTime.UtcNow
            });
        } else {
            setting.SettingValue = disabled ? "true" : "false";
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        _log.LogWarning("OTP {Channel} {Status}", channel, disabled ? "DISABLED 🔴" : "ENABLED ✅");
    }

    // جلب حالة الـ Channels
    public async Task<(bool smsDisabled, bool emailDisabled)> GetChannelStatusAsync() {
        var settings = await _db.Settings
            .Where(s => s.SettingKey == "otp_sms_disabled" || s.SettingKey == "otp_email_disabled")
            .ToListAsync();
        var smsDisabled = settings.FirstOrDefault(s => s.SettingKey == "otp_sms_disabled")?.SettingValue == "true";
        var emailDisabled = settings.FirstOrDefault(s => s.SettingKey == "otp_email_disabled")?.SettingValue == "true";
        return (smsDisabled, emailDisabled);
    }

    // فحص هل الجهة محجوبة
    public async Task<bool> IsBlockedAsync(string contact, string channel) {
        var normalized = NormalizeContact(contact, channel);
        return await _db.BlockedContacts.AnyAsync(b =>
            b.Contact == normalized && b.Channel == channel && b.IsActive);
    }

    // فحص عدد المحاولات الفاشلة
    public async Task<int> GetFailedAttemptsAsync(string contact, string channel) {
        var normalized = NormalizeContact(contact, channel);
        var since = DateTime.UtcNow.AddMinutes(-ATTEMPT_WINDOW_MINUTES);
        return await _db.OtpAttempts.CountAsync(a =>
            a.Contact == normalized && a.Channel == channel &&
            !a.Success && a.CreatedAt >= since);
    }

    // تسجيل محاولة
    public async Task RecordAttemptAsync(string contact, string channel, bool success, string? ip = null) {
        var normalized = NormalizeContact(contact, channel);
        _db.OtpAttempts.Add(new OtpAttempt {
            Contact = normalized, Channel = channel,
            Success = success, IpAddress = ip, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        // إذا فشل → تحقق من العدد
        if (!success) {
            var failed = await GetFailedAttemptsAsync(normalized, channel);
            _log.LogWarning("OTP failed attempt {Count}/{Max} for {Contact}", failed, MAX_ATTEMPTS, normalized);

            if (failed >= MAX_ATTEMPTS) {
                await BlockContactAsync(normalized, channel, ip);
            }
        }
    }

    // حجب جهة الاتصال
    public async Task BlockContactAsync(string contact, string channel, string? ip = null) {
        var normalized = NormalizeContact(contact, channel);

        // تحقق مو محجوب قبل
        var existing = await _db.BlockedContacts.FirstOrDefaultAsync(b =>
            b.Contact == normalized && b.Channel == channel && b.IsActive);
        if (existing != null) return;

        _db.BlockedContacts.Add(new BlockedContact {
            Contact = normalized, Channel = channel,
            Reason = "too_many_attempts", IpAddress = ip,
            BlockedAt = DateTime.UtcNow, IsActive = true
        });
        await _db.SaveChangesAsync();

        _log.LogWarning("🚨 BLOCKED: {Contact} ({Channel}) after {Max} failed OTP attempts", normalized, channel, MAX_ATTEMPTS);

        // إرسال إشعار للـ Admin
        await NotifyAdminAsync(normalized, channel, ip);

        // إرسال إشعار لصاحب الحساب
        await NotifyOwnerAsync(normalized, channel);
    }

    // رسالة الحجب للمستخدم
    public string GetBlockedMessage(string channel) {
        var type = channel == "sms" ? "رقم هاتفك" : "بريدك الإلكتروني";
        return $"عزيزي العميل،\n\nتم حجب {type} بسبب الاستخدام الخاطئ لرمز التحقق.\n\nللاستفسار وإلغاء الحجب يرجى التواصل مع اتحاد الغرف التجارية العراقية:\n📞 5366\n✉️ info@ficc.iq";
    }

    // فك الحجب
    public async Task UnblockContactAsync(string contact, string channel, string adminUsername) {
        var normalized = NormalizeContact(contact, channel);
        var blocked = await _db.BlockedContacts.FirstOrDefaultAsync(b =>
            b.Contact == normalized && b.Channel == channel && b.IsActive);
        if (blocked == null) return;

        blocked.IsActive = false;
        blocked.UnblockedAt = DateTime.UtcNow;
        blocked.UnblockedBy = adminUsername;

        // مسح المحاولات الفاشلة
        var attempts = _db.OtpAttempts.Where(a => a.Contact == normalized && a.Channel == channel);
        _db.OtpAttempts.RemoveRange(attempts);

        await _db.SaveChangesAsync();
        _log.LogInformation("✅ UNBLOCKED: {Contact} by {Admin}", normalized, adminUsername);
    }

    // إشعار Admin
    private async Task NotifyAdminAsync(string contact, string channel, string? ip) {
        var type = channel == "sms" ? "رقم هاتف" : "بريد إلكتروني";
        var msgText = $"🚨 تنبيه أمني — تم حجب جهة اتصال\n\n" +
                      $"النوع: {type}\n" +
                      $"الجهة: {contact}\n" +
                      $"IP: {ip ?? "غير معروف"}\n" +
                      $"السبب: {MAX_ATTEMPTS} محاولات فاشلة خلال {ATTEMPT_WINDOW_MINUTES} دقيقة\n" +
                      $"الوقت: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC\n\n" +
                      $"يمكن فك الحجب من:\nhttps://ficc.iq/admin/security";

        var htmlMsg = $@"
<div dir='rtl' style='font-family:Cairo,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #fecaca;border-radius:12px;overflow:hidden;'>
  <div style='background:#dc2626;padding:20px;text-align:center;'>
    <h2 style='color:white;margin:0;'>🚨 تنبيه أمني</h2>
    <p style='color:rgba(255,255,255,0.8);margin:6px 0 0;'>اتحاد الغرف التجارية العراقية</p>
  </div>
  <div style='padding:24px;background:#FEF2F2;'>
    <p style='font-size:16px;font-weight:700;color:#7f1d1d;'>تم حجب جهة اتصال تلقائياً</p>
    <table style='width:100%;border-collapse:collapse;margin:16px 0;'>
      <tr style='border-bottom:1px solid #fecaca;'><td style='padding:8px;color:#888;'>النوع</td><td style='padding:8px;font-weight:700;'>{type}</td></tr>
      <tr style='border-bottom:1px solid #fecaca;'><td style='padding:8px;color:#888;'>الجهة</td><td style='padding:8px;font-weight:700;direction:ltr;'>{contact}</td></tr>
      <tr style='border-bottom:1px solid #fecaca;'><td style='padding:8px;color:#888;'>عنوان IP</td><td style='padding:8px;font-weight:700;direction:ltr;'>{ip ?? "غير معروف"}</td></tr>
      <tr style='border-bottom:1px solid #fecaca;'><td style='padding:8px;color:#888;'>السبب</td><td style='padding:8px;font-weight:700;'>{MAX_ATTEMPTS} محاولات فاشلة خلال {ATTEMPT_WINDOW_MINUTES} دقيقة</td></tr>
      <tr><td style='padding:8px;color:#888;'>الوقت</td><td style='padding:8px;font-weight:700;direction:ltr;'>{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</td></tr>
    </table>
    <div style='text-align:center;margin-top:20px;'>
      <a href='https://ficc.iq/admin/security' style='background:#dc2626;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;'>
        🔓 فك الحجب من لوحة التحكم
      </a>
    </div>
  </div>
</div>";

        // SMS للـ Admin
        await _notify.SendTwilioSms("+9647713609673", msgText);

        // Email للـ Admin (نظام) + المهندس نبيل
        var subject = "🚨 تنبيه أمني — حجب جهة اتصال | FICC Platform";
        await _notify.SendEmail("noreply@ficc.iq", subject, htmlMsg);
        await _notify.SendEmail("engnabeelalmulla@gmail.com", subject, htmlMsg);
    }

    // إشعار صاحب الحساب
    private async Task NotifyOwnerAsync(string contact, string channel) {
        var type = channel == "sms" ? "رقم هاتفك" : "بريدك الإلكتروني";
        var msg = $"عزيزي العميل،\n\nتم حجب {type} بسبب الاستخدام الخاطئ لرمز التحقق.\n\nللاستفسار وإلغاء الحجب يرجى التواصل مع اتحاد الغرف التجارية العراقية:\n📞 5366\n✉️ info@ficc.iq";

        var htmlMsg = $@"
<!DOCTYPE html>
<html lang='ar' dir='rtl'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f4f6fb;font-family:Cairo,Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6fb;padding:30px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;width:100%;'>

        <!-- Header -->
        <tr>
          <td style='background:linear-gradient(135deg,#2C3E6B,#1a2a4a);padding:32px 40px;text-align:center;'>
            <div style='font-size:42px;margin-bottom:8px;'>🏛️</div>
            <h1 style='color:white;margin:0;font-size:20px;font-weight:700;'>اتحاد الغرف التجارية العراقية</h1>
            <p style='color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;'>Federation of Iraqi Chambers of Commerce</p>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style='background:#FEF2F2;border-bottom:3px solid #dc2626;padding:16px 40px;text-align:center;'>
            <span style='font-size:28px;'>⛔</span>
            <span style='font-size:15px;font-weight:700;color:#dc2626;margin-right:8px;'>تنبيه: تعليق مؤقت لرموز التحقق</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style='padding:36px 40px;'>
            <p style='font-size:16px;color:#1f2937;margin:0 0 16px;font-weight:600;'>عزيزي العميل،</p>
            <p style='font-size:14px;color:#4b5563;line-height:1.9;margin:0 0 24px;'>
              تم حجب <strong style='color:#dc2626;'>{type}</strong> بسبب الاستخدام الخاطئ لرمز التحقق.<br/>
              لحماية حسابك، قمنا بتعليق إرسال الرموز مؤقتاً.
            </p>

            <!-- Info Box -->
            <div style='background:#FFF7ED;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:28px;'>
              <p style='margin:0 0 6px;font-size:13px;color:#92400e;font-weight:700;'>📋 تفاصيل الحجب:</p>
              <p style='margin:0;font-size:13px;color:#78350f;line-height:1.8;'>
                • السبب: محاولات متعددة فاشلة للتحقق<br/>
                • الإجراء: تعليق مؤقت لإرسال الرموز<br/>
                • الحل: التواصل مع الاتحاد لإلغاء الحجب
              </p>
            </div>

            <p style='font-size:14px;color:#4b5563;margin:0 0 20px;font-weight:600;'>
              للاستفسار وإلغاء الحجب يرجى التواصل مع اتحاد الغرف التجارية العراقية:
            </p>

            <!-- Contact Buttons -->
            <table width='100%' cellpadding='0' cellspacing='0'>
              <tr>
                <td width='48%' style='padding-left:4px;'>
                  <a href='tel:5366' style='display:block;background:#2C3E6B;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;'>
                    📞 5366
                  </a>
                </td>
                <td width='4%'></td>
                <td width='48%' style='padding-right:4px;'>
                  <a href='mailto:info@ficc.iq' style='display:block;background:#059669;color:white;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;'>
                    ✉️ info@ficc.iq
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style='background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;'>
            <p style='margin:0;font-size:12px;color:#94a3b8;'>
              هذا البريد أُرسل تلقائياً من منصة اتحاد الغرف التجارية العراقية<br/>
              <a href='https://ficc.iq' style='color:#2C3E6B;text-decoration:none;'>ficc.iq</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";

        if (channel == "sms") {
            await _notify.SendTwilioSms(contact, msg);
        } else if (channel == "email") {
            await _notify.SendEmail(contact, "تنبيه: تعليق مؤقت لرموز التحقق", htmlMsg);
        }
    }

    // فحص صحة الإيميل
    public bool IsValidEmail(string email) {
        if (string.IsNullOrWhiteSpace(email)) return false;
        try {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email.Trim().ToLower();
        } catch { return false; }
    }

    // فحص صحة رقم الهاتف
    // مسبوقات الأرقام العراقية المعتمدة
    private static readonly string[] IraqPrefixes = {
        "078", "079",  // Zain
        "077",         // Asiacell
        "075",         // Korek
    };

    public bool IsValidPhone(string phone) {
        if (string.IsNullOrWhiteSpace(phone)) return false;
        var p = phone.Replace(" ", "").Replace("-", "");

        // ✅ كندا / أمريكا (+1)
        if (p.StartsWith("+1") && p.Length == 12) return true;
        if (p.StartsWith("001") && p.Length == 13) return true;

        // ✅ العراق
        string local;
        if (p.StartsWith("+9647"))      local = "0" + p[4..];
        else if (p.StartsWith("009647")) local = "0" + p[5..];
        else if (p.StartsWith("07"))     local = p;
        else return false;

        // طول الرقم المحلي = 11 رقم
        if (local.Length != 11) return false;

        // فحص المسبوقة العراقية
        return IraqPrefixes.Any(prefix => local.StartsWith(prefix));
    }

    // تطبيع جهة الاتصال
    public string NormalizeContact(string contact, string channel) {
        if (channel == "sms") {
            var p = contact.Replace(" ", "").Replace("-", "");
            if (p.StartsWith("07")) return "+964" + p[1..];
            if (p.StartsWith("009647")) return "+" + p[2..];
            return p;
        }
        return contact.Trim().ToLower();
    }

    // جلب المحجوبين (للـ Admin)
    public async Task<List<BlockedContact>> GetBlockedListAsync(bool activeOnly = true) {
        var q = _db.BlockedContacts.AsQueryable();
        if (activeOnly) q = q.Where(b => b.IsActive);
        return await q.OrderByDescending(b => b.BlockedAt).ToListAsync();
    }
}
