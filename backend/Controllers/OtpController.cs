using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using FICCPlatform.Services;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/otp")]
public class OtpController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly NotificationService _notify;
    private readonly OtpSecurityService _security;

    public OtpController(AppDbContext db, NotificationService notify, OtpSecurityService security) {
        _db = db; _notify = notify; _security = security;
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendOtpDto dto) {
        var users = await _db.Users.Where(u => u.Username == dto.Username || (u.Email != null && u.Email == dto.Username)).ToListAsync();
        var user = users.FirstOrDefault(u => u.Username == dto.Username || (u.Email != null && u.Email == dto.Username));
        if (user == null) return NotFound(new { message = "المستخدم غير موجود" });

        var channel = dto.Channel ?? "email";
        bool sent = false;
        string dest = "";
        bool isSuperAdmin = user.Role == "SuperAdmin";

        if (channel == "sms") {
            if (string.IsNullOrEmpty(user.Phone))
                return BadRequest(new { message = "لا يوجد رقم هاتف مسجل" });

            // ⚠️ تعطيل WhatsApp مؤقتاً (UltraMsg معطل)
            return BadRequest(new { message = "خدمة الواتساب معطّلة مؤقتاً. استخدم البريد الإلكتروني بدلاً منها 📧", disabled = true });
            
            // SuperAdmin مستثنى من جميع القيود
            if (!isSuperAdmin) {
                // فحص تعطيل SMS كلياً
                if (await _security.IsChannelDisabledAsync("sms"))
                    return BadRequest(new { message = "خدمة الرسائل النصية معطّلة مؤقتاً. تواصل مع الاتحاد: 5366", disabled = true });

                // فحص صحة الرقم
                if (!_security.IsValidPhone(user.Phone))
                    return BadRequest(new { message = "رقم الهاتف غير صحيح" });

                // فحص الحجب
                if (await _security.IsBlockedAsync(user.Phone, "sms"))
                    return BadRequest(new { message = _security.GetBlockedMessage("sms"), blocked = true });
            }
            var phone = NormalizePhone(user.Phone);
            dest = phone.Length > 8 ? phone[..4] + "****" + phone[^2..] : "****";

            // Generate local OTP and send via direct SMS
            var oldSms = _db.OtpCodes.Where(o => o.UserId == user.Id && o.Type == dto.Type && o.UsedAt == null);
            await oldSms.ForEachAsync(o => o.UsedAt = DateTime.UtcNow);
            var smsCode = _notify.GenerateOtp();
            _db.OtpCodes.Add(new OtpCode {
                UserId = user.Id, Code = smsCode, Type = dto.Type,
                Channel = "sms", ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            });
            await _db.SaveChangesAsync();

            sent = await _notify.SendWhatsAppOtp(phone, smsCode);
            return Ok(new { sent, message = sent ? "تم إرسال رمز التحقق عبر الواتساب 💬" : "فشل الإرسال", channel, dest, twilioVerify = false });
        } else {
            if (string.IsNullOrEmpty(user.Email))
                return BadRequest(new { message = "لا يوجد بريد إلكتروني مسجل" });

            // SuperAdmin مستثنى من جميع القيود
            if (!isSuperAdmin) {
                // فحص تعطيل Email كلياً
                if (await _security.IsChannelDisabledAsync("email"))
                    return BadRequest(new { message = "خدمة البريد الإلكتروني معطّلة مؤقتاً. تواصل مع الاتحاد: 5366", disabled = true });

                // فحص صحة الإيميل
                if (!_security.IsValidEmail(user.Email))
                    return BadRequest(new { message = "البريد الإلكتروني غير صحيح" });

                // فحص الحجب
                if (await _security.IsBlockedAsync(user.Email, "email"))
                    return BadRequest(new { message = _security.GetBlockedMessage("email"), blocked = true });
            }
            var ep = user.Email.Split('@');
            var el = ep[0]; var ed = ep.Length > 1 ? "@" + ep[1] : "";
            dest = el.Length > 4 ? el[..3] + "***" + el[^1..] + ed : el[..1] + "***" + ed;

            // Generate & store local OTP for email
            var old = _db.OtpCodes.Where(o => o.UserId == user.Id && o.Type == dto.Type && o.UsedAt == null);
            await old.ForEachAsync(o => o.UsedAt = DateTime.UtcNow);
            var code = _notify.GenerateOtp();
            _db.OtpCodes.Add(new OtpCode {
                UserId = user.Id, Code = code, Type = dto.Type,
                Channel = "email", ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            });
            await _db.SaveChangesAsync();

            var purpose = dto.Type == "reset_password" ? "إعادة تعيين كلمة المرور" : dto.Type == "login" ? "تسجيل الدخول" : "تأكيد البريد الإلكتروني";
            sent = await _notify.SendEmail(user.Email, $"رمز التحقق — {purpose}", _notify.OtpEmailHtml(code, purpose));
            if (!sent) return Ok(new { sent = false, message = $"الإيميل غير مهيأ — الرمز للتجربة: {code}", channel, dest });
            return Ok(new { sent, message = "تم إرسال رمز التحقق عبر البريد الإلكتروني", channel, dest });
        }
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyOtpDto dto) {
        var users = await _db.Users.Where(u => u.Username == dto.Username || (u.Email != null && u.Email == dto.Username)).ToListAsync();
        var user = users.FirstOrDefault(u => u.Username == dto.Username || (u.Email != null && u.Email == dto.Username));
        if (user == null) return NotFound(new { message = "المستخدم غير موجود" });

        bool verified = false;

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (dto.Channel == "sms") {
            var otpSms = await _db.OtpCodes.FirstOrDefaultAsync(o =>
                o.UserId == user.Id && o.Code == dto.Code && o.Type == dto.Type &&
                o.Channel == "sms" && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
            if (otpSms == null) {
                await _security.RecordAttemptAsync(user.Phone ?? dto.Username, "sms", false, ip);
                return BadRequest(new { message = "الرمز غير صحيح أو منتهي الصلاحية" });
            }
            otpSms.UsedAt = DateTime.UtcNow;
            await _security.RecordAttemptAsync(user.Phone ?? dto.Username, "sms", true, ip);
            verified = true;
        } else {
            var otp = await _db.OtpCodes.FirstOrDefaultAsync(o =>
                o.UserId == user.Id && o.Code == dto.Code && o.Type == dto.Type &&
                o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
            if (otp == null) {
                await _security.RecordAttemptAsync(user.Email ?? dto.Username, "email", false, ip);
                return BadRequest(new { message = "الرمز غير صحيح أو منتهي الصلاحية" });
            }
            otp.UsedAt = DateTime.UtcNow;
            await _security.RecordAttemptAsync(user.Email ?? dto.Username, "email", true, ip);
            verified = true;
        }

        if (dto.Type == "email_verify") user.IsEmailVerified = true;
        if (dto.Type == "reset_password" && !string.IsNullOrEmpty(dto.NewPassword)) {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.IsFirstLogin = false;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم التحقق بنجاح", verified = true });
    }

    // Quick test endpoint
    [HttpPost("test-sms")]
    public async Task<IActionResult> TestSms([FromBody] TestSmsDto dto) {
        var sent = await _notify.SendTwilioVerify(NormalizePhone(dto.Phone));
        return Ok(new { sent, phone = dto.Phone });
    }


    [HttpGet("contact-info")]
    public async Task<IActionResult> ContactInfo([FromQuery] string username, [FromQuery] string channel) {
        var userList = await _db.Users.Where(u => u.Username == username || (u.Email != null && u.Email == username)).ToListAsync();
        var user = userList.FirstOrDefault(u => u.Username == username || (u.Email != null && u.Email == username));
        if (user == null) return NotFound(new { message = "المستخدم غير موجود" });

        string? dest = channel == "sms" ? user.Phone : user.Email;
        if (string.IsNullOrEmpty(dest))
            return Ok(new { found = false, message = channel == "sms" ? "لا يوجد رقم هاتف مسجل" : "لا يوجد بريد إلكتروني مسجل" });

        // Mask: show first 3 + *** + last 2
        string masked;
        if (channel == "sms") {
            var p = NormalizePhone(dest);
            masked = p.Length > 6 ? p[..4] + "****" + p[^2..] : "****";
        } else {
            var parts = dest.Split('@');
            var local = parts[0];
            var domain = parts.Length > 1 ? "@" + parts[1] : "";
            // Show first 3 letters + *** + last letter + @domain
            masked = local.Length > 4 
                ? local[..3] + "***" + local[^1..] + domain 
                : local[..1] + "***" + domain;
        }
        return Ok(new { found = true, masked });
    }

    private static string NormalizePhone(string p) {
        p = p.Trim().Replace(" ","").Replace("-","");
        if (p.StartsWith("07")) return "+964" + p[1..];
        if (p.StartsWith("009647")) return "+" + p[2..];
        if (!p.StartsWith("+")) return "+" + p;
        return p;
    }

    // Verify a contact (email/phone) via OTP - used when admin adds new user
    // OTP بدون فحص التكرار (لريادة الأعمال والتحقق العام)
    [HttpPost("send-simple")]
    public async Task<IActionResult> SendSimple([FromBody] VerifyContactDto dto) {
        try {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            // ─── فحص صحة الجهة ───
            if (dto.Channel == "sms" && !_security.IsValidPhone(dto.Value))
                return BadRequest(new { message = "رقم الهاتف غير صحيح" });
            if (dto.Channel == "email" && !_security.IsValidEmail(dto.Value))
                return BadRequest(new { message = "البريد الإلكتروني غير صحيح" });

            // ─── فحص الحجب ───
            if (await _security.IsBlockedAsync(dto.Value, dto.Channel))
                return BadRequest(new { message = _security.GetBlockedMessage(dto.Channel), blocked = true });

            var otp = _notify.GenerateOtp();
            _db.OtpCodes.Add(new OtpCode {
                UserId = 0, Code = otp, Type = "contact_verify",
                Channel = dto.Channel, ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IpAddress = ip
            });
            await _db.SaveChangesAsync();

            bool sent = false;
            if (dto.Channel == "sms") {
                var phone = dto.Value.StartsWith("07") ? "+964" + dto.Value[1..] : dto.Value;
                sent = await _notify.SendWhatsAppOtp(phone, otp);
            } else {
                var purpose = "التحقق من البريد الإلكتروني";
                sent = await _notify.SendEmail(dto.Value, $"رمز التحقق — {purpose}", _notify.OtpEmailHtml(otp, purpose));
            }
            return Ok(new { sent, message = sent ? "تم إرسال الرمز" : "فشل الإرسال" });
        } catch (Exception ex) {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("verify-contact")]
    public async Task<IActionResult> VerifyContact([FromBody] VerifyContactDto dto) {
        try {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            // ─── فحص صحة الجهة ───
            if (dto.Channel == "sms" && !_security.IsValidPhone(dto.Value))
                return BadRequest(new { message = "رقم الهاتف غير صحيح" });
            if (dto.Channel == "email" && !_security.IsValidEmail(dto.Value))
                return BadRequest(new { message = "البريد الإلكتروني غير صحيح" });

            // ─── فحص الحجب ───
            if (await _security.IsBlockedAsync(dto.Value, dto.Channel))
                return BadRequest(new { message = _security.GetBlockedMessage(dto.Channel), blocked = true });

            // Check for duplicates BEFORE sending OTP
            if (dto.Channel == "sms") {
                // Normalize phone for comparison
                // Normalize to both formats for comparison
                var raw = dto.Value;
                string normalized, local;
                if (raw.StartsWith("+9647")) {
                    normalized = raw; local = "0" + raw[4..]; // +9647xxx → 07xxx
                } else if (raw.StartsWith("009647")) {
                    normalized = "+" + raw[2..]; local = "0" + raw[5..];
                } else if (raw.StartsWith("07")) {
                    normalized = "+964" + raw[1..]; local = raw;
                } else {
                    normalized = raw; local = raw;
                }
                // Check pending submissions too
                bool phoneInSubmissions = await _db.Submissions.AnyAsync(s => s.Status == "pending" &&
                    (s.FormData.Contains("\"" + raw + "\"") || s.FormData.Contains("\"" + normalized + "\"") || s.FormData.Contains("\"" + local + "\"")));
                var exists = phoneInSubmissions
                          || await _db.Users.AnyAsync(u => u.Phone == raw || u.Phone == normalized || u.Phone == local)
                          || await _db.Chambers.AnyAsync(c => c.Phone == raw || c.Phone == normalized || c.Phone == local)
                          || await _db.Members.AnyAsync(m => m.Phone == raw || m.Phone == normalized || m.Phone == local)
                          || await _db.TraderDirectory.AnyAsync(t => t.Phone == raw || t.Phone == normalized || t.Phone == local || t.Mobile == raw || t.Mobile == normalized || t.Mobile == local)
                          || await _db.ShippingCompanies.AnyAsync(s => s.Phone == raw || s.Phone == normalized || s.Phone == local || s.Mobile == raw || s.Mobile == normalized || s.Mobile == local);
                if (exists)
                    return BadRequest(new { message = "رقم الهاتف مسجل مسبقاً في قاعدة البيانات", duplicate = true });
            } else {
                var email = dto.Value.ToLower().Trim();
                // Check pending submissions too
                bool emailInSubmissions = await _db.Submissions.AnyAsync(s => s.Status == "pending" && s.FormData.Contains("\"" + email + "\""));
                var exists = emailInSubmissions
                          || await _db.Users.AnyAsync(u => u.Email != null && u.Email.ToLower() == email)
                          || await _db.Chambers.AnyAsync(c => c.Email != null && c.Email.ToLower() == email)
                          || await _db.Members.AnyAsync(m => m.Email != null && m.Email.ToLower() == email)
                          || await _db.TraderDirectory.AnyAsync(t => t.Email != null && t.Email.ToLower() == email)
                          || await _db.ShippingCompanies.AnyAsync(s => s.Email != null && s.Email.ToLower() == email);
                if (exists)
                    return BadRequest(new { message = "البريد الإلكتروني مسجل مسبقاً في قاعدة البيانات", duplicate = true });
            }

            var otp = _notify.GenerateOtp();
            _db.OtpCodes.Add(new OtpCode {
                UserId = 0, Code = otp, Type = "contact_verify",
                Channel = dto.Channel, ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            });
            await _db.SaveChangesAsync();
            bool sent = false;
            if (dto.Channel == "sms") {
                var phone = dto.Value.StartsWith("07") ? "+964" + dto.Value[1..] : dto.Value;
                sent = await _notify.SendWhatsAppOtp(phone, otp);
            } else {
                var purpose = "التحقق من البريد الإلكتروني";
                sent = await _notify.SendEmail(dto.Value, $"رمز التحقق — {purpose}", _notify.OtpEmailHtml(otp, purpose));
            }
            return Ok(new { sent, message = sent ? "تم إرسال الرمز" : "فشل الإرسال" });
        } catch (Exception ex) {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("verify-contact-check")]
    public async Task<IActionResult> VerifyContactCheck([FromBody] VerifyContactCheckDto dto) {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        // ─── فحص الحجب ───
        if (await _security.IsBlockedAsync(dto.Value, dto.Channel))
            return BadRequest(new { message = _security.GetBlockedMessage(dto.Channel), blocked = true });

        var otpRecord = await _db.OtpCodes.Where(o =>
            o.UserId == 0 && o.Code == dto.Code && o.Type == "contact_verify" &&
            o.Channel == dto.Channel && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.Id).FirstOrDefaultAsync();

        if (otpRecord == null) {
            // ─── تسجيل فشل ───
            await _security.RecordAttemptAsync(dto.Value, dto.Channel, false, ip);
            return BadRequest(new { message = "الرمز غير صحيح أو منتهي الصلاحية" });
        }

        otpRecord.UsedAt = DateTime.UtcNow;
        // ─── تسجيل نجاح ───
        await _security.RecordAttemptAsync(dto.Value, dto.Channel, true, ip);
        await _db.SaveChangesAsync();
        return Ok(new { verified = true, message = "تم التحقق بنجاح" });
    }
}

public record SendOtpDto(string Username, string Type, string? Channel);

public record VerifyOtpDto(string Username, string Code, string Type, string? Channel, string? NewPassword);
public record TestSmsDto(string Phone);
public record VerifyContactDto(string Value, string Channel);
public record VerifyContactCheckDto(string Value, string Channel, string Code);
