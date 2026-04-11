using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using FICCPlatform.Services;

[ApiController]
[Route("api/subscribers")]
public class SubscribersController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly OtpSecurityService _otp;
    private readonly NotificationService _notify;

    public SubscribersController(AppDbContext db, OtpSecurityService otp, NotificationService notify) {
        _db = db; _otp = otp; _notify = notify;
    }

    // POST /api/subscribers — تسجيل جديد
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] SubscriberDto dto) {
        if (string.IsNullOrEmpty(dto.Phone)) return BadRequest(new { message = "رقم الهاتف مطلوب" });

        var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == dto.Phone);
        if (existing != null) return BadRequest(new { message = "هذا الرقم مسجّل مسبقاً" });

        // توليد كود فريد
        string GenerateCode() {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var rng = new Random();
            return new string(Enumerable.Repeat(chars, 8).Select(s => s[rng.Next(s.Length)]).ToArray());
        }
        string code;
        do { code = GenerateCode(); } while (await _db.Subscribers.AnyAsync(s => s.SubscriberCode == code));

        var sub = new Subscriber {
            FullName       = dto.FullName,
            Phone          = dto.Phone,
            WhatsApp       = dto.WhatsApp ?? dto.Phone,
            Email          = dto.Email,
            Sectors        = dto.Sectors,
            NotifyBy       = dto.NotifyBy,
            IsActive       = true,
            SubscriberCode = code,
            CreatedAt      = DateTime.UtcNow
        };
        _db.Subscribers.Add(sub);
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    // دالة مشتركة للتحقق من Rate Limit (5 محاولات خلال 30 دقيقة)
    private async Task<(bool blocked, string message)> CheckRateLimit(string key, string keyType) {
        const int MAX_ATTEMPTS = 5;
        const int WINDOW_MINUTES = 30;  // نافذة 30 دقيقة
        const int BLOCK_HOURS = 1;

        var record = await _db.RateLimitBlocks.FirstOrDefaultAsync(r => r.Key == key && r.KeyType == keyType);
        if (record != null) {
            // إذا محظور ولسه ما انتهى الحظر
            if (record.BlockedUntil.HasValue && record.BlockedUntil > DateTime.UtcNow) {
                var remaining = (int)(record.BlockedUntil.Value - DateTime.UtcNow).TotalMinutes + 1;
                return (true, $"⛔ تم حظر هذا الرقم مؤقتاً. حاول مرة أخرى بعد {remaining} دقيقة");
            }
            // إذا انتهت نافذة 30 دقيقة — أعد التهيئة
            if ((DateTime.UtcNow - record.FirstAttemptAt).TotalMinutes >= WINDOW_MINUTES) {
                record.Attempts = 0;
                record.BlockedUntil = null;
                record.FirstAttemptAt = DateTime.UtcNow;
            }
            // إذا انتهى الحظر — أعد التهيئة
            if (record.BlockedUntil.HasValue && record.BlockedUntil <= DateTime.UtcNow) {
                record.Attempts = 0;
                record.BlockedUntil = null;
                record.FirstAttemptAt = DateTime.UtcNow;
            }
            record.Attempts++;
            record.UpdatedAt = DateTime.UtcNow;
            if (record.Attempts >= MAX_ATTEMPTS) {
                record.BlockedUntil = DateTime.UtcNow.AddHours(BLOCK_HOURS);
                await _db.SaveChangesAsync();
                // إشعار الأدمن بالإيميل
                _ = Task.Run(async () => {
                    var html = $"<div dir='rtl' style='font-family:Cairo,sans-serif;padding:20px;'><h2 style='color:#dc2626;'>🚨 حجب تلقائي — منصة FICC</h2><p><b>الجهة:</b> {key}</p><p><b>النوع:</b> {keyType}</p><p><b>المحاولات:</b> {MAX_ATTEMPTS}</p><p><b>الوقت:</b> {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p><p><b>محجوب حتى:</b> {DateTime.UtcNow.AddHours(BLOCK_HOURS):yyyy-MM-dd HH:mm} UTC</p><a href='https://ficc.iq/admin/security' style='background:#2C3E6B;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;'>فك الحجب من لوحة التحكم</a></div>";
                    await _notify.SendEmail("engnabeelalmulla@gmail.com", "🚨 حجب تلقائي — FICC Platform", html);
                    await _notify.NotifyClientBlock(key);
                });
                return (true, $"⛔ تجاوزت الحد المسموح ({MAX_ATTEMPTS} محاولات خلال {WINDOW_MINUTES} دقيقة). تم حظر الوصول لمدة ساعة");
            }
            await _db.SaveChangesAsync();
            int remaining2 = MAX_ATTEMPTS - record.Attempts;
            return (false, $"تبقى لك {remaining2} محاولة خلال {(int)(WINDOW_MINUTES - (DateTime.UtcNow - record.FirstAttemptAt).TotalMinutes)} دقيقة");
        } else {
            _db.RateLimitBlocks.Add(new RateLimitBlock { Key = key, KeyType = keyType, Attempts = 1 });
            await _db.SaveChangesAsync();
            return (false, $"تبقى لك {MAX_ATTEMPTS - 1} محاولات خلال {WINDOW_MINUTES} دقيقة");
        }
    }

    // POST /api/subscribers/send-field-otp — إرسال OTP لحقل معين (phone/whatsapp/email)
    [HttpPost("send-field-otp")]
    public async Task<IActionResult> SendFieldOtp([FromBody] FieldOtpDto dto) {
        if (string.IsNullOrEmpty(dto.Value)) return BadRequest(new { message = "القيمة مطلوبة" });

        // التحقق من أن الرقم غير مسجل مسبقاً (فقط لحقل phone)
        if (dto.Field == "phone") {
            var phone07 = dto.Value.StartsWith("+964") ? "0" + dto.Value[4..] : dto.Value;
            var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == phone07 || s.Phone == dto.Value);
            if (existing != null) return BadRequest(new { message = "⚠️ هذا الرقم مسجّل مسبقاً — يمكنك تسجيل الدخول مباشرة" });
        }

        // التحقق من Rate Limit
        var (blocked, blockMsg) = await CheckRateLimit(dto.Value, dto.Field);
        if (blocked) return StatusCode(429, new { message = blockMsg });
        // أضف رسالة المحاولات للـ response
        var attemptsInfo = blockMsg; // "تبقى لك X محاولة"
        var otp = new string(System.Linq.Enumerable.Repeat("0123456789", 6)
            .Select(s => s[new Random().Next(s.Length)]).ToArray());
        var typeKey = $"sub-{dto.Field}";
        var old = await _db.OtpCodes.FirstOrDefaultAsync(o => o.UserId == 0 && o.Type == typeKey && o.IpAddress == dto.Value && o.UsedAt == null);
        if (old != null) _db.OtpCodes.Remove(old);
        _db.OtpCodes.Add(new OtpCode {
            UserId = 0, Code = otp, Channel = dto.Field == "email" ? "email" : "sms",
            Type = typeKey, IpAddress = dto.Value,
            CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await _db.SaveChangesAsync();
        if (dto.Field == "email")
            await _notify.SendEmail(dto.Value, "رمز التحقق | اتحاد الغرف التجارية العراقية", $"<div dir='rtl' style='font-family:Cairo,sans-serif;font-size:16px'><p>رمز التحقق الخاص بك:</p><h1 style='letter-spacing:8px;color:#2C3E6B'>{otp}</h1><p>صالح لمدة 10 دقائق</p></div>");
        else if (dto.Field == "whatsapp")
            await _notify.SendWhatsAppOtp(dto.Value, otp); // واتساب فقط
        else
            await _notify.SendWhatsAppOtp(dto.Value, otp);  // واتساب بدل SMS (توفير تكلفة Twilio)
        return Ok(new { message = "تم إرسال رمز التأكيد", attemptsInfo });
    }

    // POST /api/subscribers/verify-field-otp — تحقق OTP لحقل معين
    [HttpPost("verify-field-otp")]
    public async Task<IActionResult> VerifyFieldOtp([FromBody] FieldVerifyDto dto) {
        var typeKey = $"sub-{dto.Field}";
        var otpRecord = await _db.OtpCodes.FirstOrDefaultAsync(o =>
            o.UserId == 0 && o.Code == dto.Code && o.Type == typeKey &&
            o.IpAddress == dto.Value && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
        if (otpRecord == null) return BadRequest(new { message = "رمز غير صحيح أو منتهي الصلاحية" });
        otpRecord.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم التحقق بنجاح" });
    }

    // POST /api/subscribers/send-otp-new — إرسال OTP للتسجيل الجديد (phone فقط عبر واتساب)
    [HttpPost("send-otp-new")]
    public async Task<IActionResult> SendOtpNew([FromBody] PhoneDto dto) {
        if (string.IsNullOrEmpty(dto.Phone)) return BadRequest(new { message = "رقم الهاتف مطلوب" });
        var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == dto.Phone);
        if (existing != null) return BadRequest(new { message = "هذا الرقم مسجّل مسبقاً" });
        return await SendFieldOtp(new FieldOtpDto("whatsapp", dto.Phone)); // واتساب فقط للتسجيل
    }

    // POST /api/subscribers/verify-otp-new — تحقق OTP للتسجيل الجديد
    [HttpPost("verify-otp-new")]
    public async Task<IActionResult> VerifyOtpNew([FromBody] VerifyOtpDto dto) {
        return await VerifyFieldOtp(new FieldVerifyDto("phone", dto.Phone, dto.Code));
    }

    // POST /api/subscribers/send-otp — إرسال OTP (بالهاتف أو الإيميل)
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpLoginDto dto) {
        // البحث بالهاتف أو الإيميل
        Subscriber? sub = null;
        if (!string.IsNullOrEmpty(dto.Email)) {
            var emailLower = dto.Email.Trim().ToLower();
            var (blocked, blockMsg) = await CheckRateLimit(emailLower, "email-login");
            if (blocked) return StatusCode(429, new { message = blockMsg });
            sub = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == emailLower);
            if (sub == null) return NotFound(new { message = "هذا البريد الإلكتروني غير مسجّل" });
        } else {
            var phone = dto.Phone ?? "";
            var (blocked, blockMsg) = await CheckRateLimit(phone, "phone-login");
            if (blocked) return StatusCode(429, new { message = blockMsg });
            // نحوّل الرقم لصيغتين ونبحث بهما
            var phone07 = phone.StartsWith("+964") ? "0" + phone[4..] : phone.StartsWith("964") ? "0" + phone[3..] : phone;
            var phone964 = phone.StartsWith("0") ? "+964" + phone[1..] : phone;
            sub = await _db.Subscribers.FirstOrDefaultAsync(s =>
                s.Phone == phone || s.Phone == phone07 || s.Phone == phone964 ||
                s.WhatsApp == phone || s.WhatsApp == phone07 || s.WhatsApp == phone964);
            if (sub == null) return NotFound(new { message = "هذا الرقم غير مسجّل" });
        }
        var otp = new string(System.Linq.Enumerable.Repeat("0123456789", 6)
            .Select(s => s[new Random().Next(s.Length)]).ToArray());

        var existing = await _db.OtpCodes.FirstOrDefaultAsync(o => o.UserId == sub.Id && o.Type == "subscriber" && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
        if (existing != null) _db.OtpCodes.Remove(existing);

        _db.OtpCodes.Add(new OtpCode {
            UserId = sub.Id, Code = otp, Channel = !string.IsNullOrEmpty(dto.Email) ? "email" : "sms",
            Type = "subscriber", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await _db.SaveChangesAsync();

        // إرسال OTP حسب الطريقة المختارة
        if (!string.IsNullOrEmpty(dto.Email)) {
            // طلب دخول بالإيميل → أرسل OTP للإيميل مباشرة
            await _notify.SendEmail(sub.Email!, "رمز الدخول | اتحاد الغرف التجارية العراقية",
                $"<div dir='rtl' style='font-family:Cairo,sans-serif;text-align:center;padding:20px'>" +
                $"<h2 style='color:#2C3E6B'>رمز تأكيد الدخول</h2>" +
                $"<h1 style='letter-spacing:10px;color:#2C3E6B;font-size:40px'>{otp}</h1>" +
                $"<p style='color:#64748b'>الرمز صالح لمدة 10 دقائق</p></div>");
            return Ok(new { message = $"تم إرسال رمز التأكيد على البريد: {EmailHelper.Mask(sub.Email!)}" });
        } else {
            // طلب دخول بالهاتف → أرسل OTP للواتساب
            var waNum = sub.WhatsApp ?? sub.Phone;
            await _notify.SendWhatsAppOtp(waNum, otp);
            return Ok(new { message = $"تم إرسال رمز التأكيد على الواتساب" });
        }
    }

    // POST /api/subscribers/verify-otp — تحقق OTP (بالهاتف أو الإيميل)
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpLoginDto dto) {
        Subscriber? sub = null;
        if (!string.IsNullOrEmpty(dto.Email)) {
            var emailLower = dto.Email.Trim().ToLower();
            sub = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == emailLower);
        } else {
            var phone = dto.Phone ?? "";
            var phone07 = phone.StartsWith("+964") ? "0" + phone[4..] : phone.StartsWith("964") ? "0" + phone[3..] : phone;
            var phone964 = phone.StartsWith("0") ? "+964" + phone[1..] : phone;
            sub = await _db.Subscribers.FirstOrDefaultAsync(s =>
                s.Phone == phone || s.Phone == phone07 || s.Phone == phone964 ||
                s.WhatsApp == phone || s.WhatsApp == phone07 || s.WhatsApp == phone964);
        }
        if (sub == null) return NotFound(new { message = "غير مسجّل" });

        var otpRecord = await _db.OtpCodes.FirstOrDefaultAsync(o =>
            o.UserId == sub.Id && o.Code == dto.Code && o.Type == "subscriber" &&
            o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);

        if (otpRecord == null) return BadRequest(new { message = "رمز غير صحيح أو منتهي الصلاحية" });

        otpRecord.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    // PUT /api/subscribers/{id} — تعديل البيانات
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SubscriberUpdateDto dto) {
        var sub = await _db.Subscribers.FindAsync(id);
        if (sub == null) return NotFound();
        sub.FullName  = dto.FullName ?? sub.FullName;
        sub.WhatsApp  = dto.WhatsApp ?? sub.WhatsApp;
        sub.Email     = dto.Email ?? sub.Email;
        sub.Sectors   = dto.Sectors ?? sub.Sectors;
        sub.NotifyBy  = dto.NotifyBy ?? sub.NotifyBy;
        if (dto.IsActive.HasValue) sub.IsActive = dto.IsActive.Value;
        sub.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    // GET /api/subscribers — للأدمن
    [HttpGet, Authorize]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null) {
        var q = _db.Subscribers.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(s => s.FullName.Contains(search) || s.Phone.Contains(search) || (s.WhatsApp != null && s.WhatsApp.Contains(search)));
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(s => s.CreatedAt)
            .Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }
    // PUT /api/subscribers/{id}/profile — تحديث الملف الشخصي (وثائق + تواصل + أقسام)
    [HttpPut("{id}/profile")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] SubscriberProfileDto dto) {
        var sub = await _db.Subscribers.FindAsync(id);
        if (sub == null) return NotFound();

        // وثائق
        if (dto.ProfileImage != null) sub.ProfileImage = dto.ProfileImage;
        if (dto.NationalIdFront != null) sub.NationalIdFront = dto.NationalIdFront;
        if (dto.NationalIdBack != null) sub.NationalIdBack = dto.NationalIdBack;
        if (dto.Passport != null) sub.Passport = dto.Passport;
        if (dto.TradeIdFront != null) sub.TradeIdFront = dto.TradeIdFront;
        if (dto.TradeIdBack != null) sub.TradeIdBack = dto.TradeIdBack;
        if (dto.CV != null) sub.CV = dto.CV;

        // أوراق الشركة
        if (dto.CompanyReg != null) sub.CompanyReg = dto.CompanyReg;
        if (dto.ChamberCert != null) sub.ChamberCert = dto.ChamberCert;
        if (dto.TaxCert != null) sub.TaxCert = dto.TaxCert;
        if (dto.CompanyStamp != null) sub.CompanyStamp = dto.CompanyStamp;
        if (dto.OtherDoc != null) sub.OtherDoc = dto.OtherDoc;

        // تواصل اجتماعي
        if (dto.Facebook != null) sub.Facebook = dto.Facebook;
        if (dto.Instagram != null) sub.Instagram = dto.Instagram;
        if (dto.Twitter != null) sub.Twitter = dto.Twitter;
        if (dto.LinkedIn != null) sub.LinkedIn = dto.LinkedIn;
        if (dto.TikTok != null) sub.TikTok = dto.TikTok;

        // الأقسام (IDs)
        if (dto.Interests != null)
            sub.Interests = System.Text.Json.JsonSerializer.Serialize(dto.Interests);
        // القطاعات
        if (dto.TraderSectors != null)
            sub.TraderSectors = System.Text.Json.JsonSerializer.Serialize(dto.TraderSectors);

        sub.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    // POST /api/subscribers/broadcast — إرسال تعميم للمتابعين
    [HttpPost("broadcast")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto) {
        if (dto.SubscriberIds == null || dto.SubscriberIds.Count == 0)
            return BadRequest(new { message = "لا يوجد متابعون محددون" });

        var subscribers = await _db.Subscribers
            .Where(s => dto.SubscriberIds.Contains(s.Id) && s.IsActive)
            .ToListAsync();

        int sent = 0;
        using var http = new System.Net.Http.HttpClient();
        foreach (var sub in subscribers) {
            bool sentThis = false;

            // إرسال واتساب
            if (dto.Channel == "whatsapp" || dto.Channel == "both") {
                var waRaw = sub.WhatsApp ?? sub.Phone ?? "";
                if (!string.IsNullOrEmpty(waRaw)) {
                    try {
                        var wa = waRaw.Replace("+", "").Replace(" ", "");
                        var to = wa.StartsWith("964") ? $"+{wa}" : wa.StartsWith("0") ? $"+964{wa[1..]}" : $"+{wa}";
                        if (!string.IsNullOrEmpty(dto.ImageUrl)) {
                            await http.PostAsync("https://api.ultramsg.com/instance167281/messages/image",
                                new System.Net.Http.FormUrlEncodedContent(new[] {
                                    new System.Collections.Generic.KeyValuePair<string,string>("token", "4sfgtwxi8b4l46yq"),
                                    new System.Collections.Generic.KeyValuePair<string,string>("to", to),
                                    new System.Collections.Generic.KeyValuePair<string,string>("image", dto.ImageUrl),
                                    new System.Collections.Generic.KeyValuePair<string,string>("caption", dto.Message)
                                }));
                        } else {
                            await http.PostAsync("https://api.ultramsg.com/instance167281/messages/chat",
                                new System.Net.Http.FormUrlEncodedContent(new[] {
                                    new System.Collections.Generic.KeyValuePair<string,string>("token", "4sfgtwxi8b4l46yq"),
                                    new System.Collections.Generic.KeyValuePair<string,string>("to", to),
                                    new System.Collections.Generic.KeyValuePair<string,string>("body", dto.Message)
                                }));
                        }
                        sentThis = true;
                    } catch { }
                }
            }

            // إرسال إيميل
            if (dto.Channel == "email" || dto.Channel == "both") {
                if (!string.IsNullOrEmpty(sub.Email)) {
                    try {
                        // استخرج عنوان الرسالة (السطر الأول)
                        var lines = dto.Message.Split('\n');
                        var title = lines.Length > 0 ? lines[0] : dto.Message;
                        var itemLink = string.IsNullOrEmpty(dto.ItemUrl) ? "https://ficc.iq" : dto.ItemUrl;

                        // بناء سطور التفاصيل (بدون رابط — الرابط في الزر فقط)
                        var detailRows = "";
                        for (int li = 1; li < lines.Length; li++) {
                            var line = lines[li].Trim();
                            if (string.IsNullOrEmpty(line)) continue;
                            if (line.StartsWith("http")) continue; // تجاهل الروابط من النص
                            detailRows += $"<div style='font-size:14px;color:#374151;padding:6px 0;border-bottom:1px solid #f1f5f9'>{System.Web.HttpUtility.HtmlEncode(line)}</div>";
                        }

                        var imageTag = string.IsNullOrEmpty(dto.ImageUrl) ? "" :
                            $"<img src='{dto.ImageUrl}' style='width:100%;border-radius:12px;margin-bottom:16px;display:block' />";

                        var htmlBody = $@"
<!DOCTYPE html>
<html dir='rtl'>
<body style='margin:0;padding:0;background:#f0f4f8;font-family:Cairo,Arial,sans-serif'>
<div style='max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)'>

  <!-- Header -->
  <div style='background:linear-gradient(135deg,#1a2a5e,#2C3E6B,#4A6FA5);padding:28px 24px;text-align:center'>
    <img src='https://ficc.iq/ficc-logo.jpg' alt='FICC' style='height:60px;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;border-radius:8px' />
    <h1 style='color:#fff;margin:0;font-size:20px;font-weight:800;line-height:1.5'>{System.Web.HttpUtility.HtmlEncode(title)}</h1>
    <p style='color:#FFC72C;margin:8px 0 0;font-size:13px;font-weight:600'>اتحاد الغرف التجارية العراقية</p>
  </div>

  <!-- صورة الدورة -->
  {(string.IsNullOrEmpty(dto.ImageUrl) ? "" : $"<img src='{dto.ImageUrl}' alt='' style='width:100%;display:block;max-height:280px;object-fit:cover' />")}

  <!-- التفاصيل -->
  {(detailRows.Length > 0 ? $"<div style='padding:20px 24px;border-bottom:1px solid #f1f5f9'>{detailRows}</div>" : "")}

  <!-- زر عرض التفاصيل -->
  <div style='padding:20px 24px;text-align:center'>
    <a href='{itemLink}' style='display:inline-block;background:linear-gradient(135deg,#2C3E6B,#4A6FA5);color:#fff;padding:13px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:0.5px'>
      عرض التفاصيل ←
    </a>
  </div>

  <!-- Footer -->
  <div style='background:#f8fafc;padding:14px 24px;text-align:center;border-top:1px solid #e5e7eb'>
    <p style='color:#94a3b8;font-size:11px;margin:0'>
      <a href='https://ficc.iq' style='color:#4A6FA5;text-decoration:none;font-weight:700'>ficc.iq</a>
      &nbsp;—&nbsp;اتحاد الغرف التجارية العراقية
    </p>
  </div>

</div>
</body>
</html>";
                        await _notify.SendEmail(sub.Email, $"📢 {title} | اتحاد الغرف التجارية العراقية", htmlBody);
                        sentThis = true;
                    } catch { }
                }
            }

            if (sentThis) {
                sent++;
                // سجّل التعميم
                if (dto.CourseId.HasValue) {
                    _db.BroadcastLogs.Add(new BroadcastLog {
                        CourseId = dto.CourseId.Value,
                        SubscriberId = sub.Id,
                        Channel = dto.Channel,
                        SentAt = DateTime.UtcNow
                    });
                }
            }
        }

        if (dto.CourseId.HasValue) await _db.SaveChangesAsync();

        return Ok(new { message = $"تم الإرسال لـ {sent} متابع", sent, total = subscribers.Count });
    }

    // GET /api/subscribers/broadcast-log/{courseId} — من أُرسل إليهم
    [HttpGet("broadcast-log/{courseId}"), Authorize]
    public async Task<IActionResult> GetBroadcastLog(int courseId) {
        var ids = await _db.BroadcastLogs
            .Where(l => l.CourseId == courseId)
            .Select(l => l.SubscriberId)
            .Distinct()
            .ToListAsync();
        return Ok(ids);
    }

    // DELETE /api/subscribers/{id}
    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id) {
        var sub = await _db.Subscribers.FindAsync(id);
        if (sub == null) return NotFound();
        _db.Subscribers.Remove(sub);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم الحذف" });
    }
}

public record SubscriberDto(string FullName, string Phone, string? WhatsApp, string? Email, string? Sectors, string? NotifyBy);
public record SubscriberUpdateDto(string? FullName, string? Phone, string? WhatsApp, string? Email, string? Sectors, string? NotifyBy, bool? IsActive,
    string? ProfileImage, string? NationalIdFront, string? NationalIdBack, string? Passport,
    string? TradeIdFront, string? TradeIdBack, string? CV,
    string? CompanyReg, string? ChamberCert, string? TaxCert, string? CompanyStamp, string? OtherDoc,
    string? Facebook, string? Instagram, string? Twitter, string? LinkedIn, string? TikTok,
    List<int>? Interests, List<int>? TraderSectors);
public record PhoneDto(string Phone);
public class SendOtpLoginDto { public string? Phone { get; set; } public string? Email { get; set; } }
public class VerifyOtpLoginDto { public string? Phone { get; set; } public string? Email { get; set; } public string Code { get; set; } = ""; }
public record VerifyOtpDto(string Phone, string Code);
public record FieldOtpDto(string Field, string Value);
public record FieldVerifyDto(string Field, string Value, string Code);

public static class EmailHelper {
    public static string Mask(string email) {
        if (string.IsNullOrEmpty(email)) return "";
        var parts = email.Split('@');
        if (parts.Length < 2) return email;
        var name = parts[0];
        var masked = name.Length <= 2 ? "**" : name[..2] + new string('*', name.Length - 2);
        return $"{masked}@{parts[1]}";
    }
}

public class BroadcastDto {
    public List<int> SubscriberIds { get; set; } = new();
    public string Message { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string? ItemUrl { get; set; }
    public int? CourseId { get; set; } // لتتبع التعميم
    public string Channel { get; set; } = "whatsapp";
}

public class SubscriberProfileDto {
    // وثائق
    public string? ProfileImage { get; set; }
    public string? NationalIdFront { get; set; }
    public string? NationalIdBack { get; set; }
    public string? Passport { get; set; }
    public string? TradeIdFront { get; set; }
    public string? TradeIdBack { get; set; }
    public string? CV { get; set; }
    // أوراق الشركة
    public string? CompanyReg { get; set; }
    public string? ChamberCert { get; set; }
    public string? TaxCert { get; set; }
    public string? CompanyStamp { get; set; }
    public string? OtherDoc { get; set; }
    // تواصل اجتماعي
    public string? Facebook { get; set; }
    public string? Instagram { get; set; }
    public string? Twitter { get; set; }
    public string? LinkedIn { get; set; }
    public string? TikTok { get; set; }
    // الأقسام (الريادة/العلاقات/المنظمات)
    public List<int>? Interests { get; set; }
    // القطاعات (من ثوابت النظام)
    public List<int>? TraderSectors { get; set; }
}
