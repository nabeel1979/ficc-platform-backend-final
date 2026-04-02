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

        var sub = new Subscriber {
            FullName  = dto.FullName,
            Phone     = dto.Phone,
            WhatsApp  = dto.WhatsApp ?? dto.Phone,
            Email     = dto.Email,
            Sectors   = dto.Sectors,
            NotifyBy  = dto.NotifyBy,
            IsActive  = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Subscribers.Add(sub);
        await _db.SaveChangesAsync();
        return Ok(new { id = sub.Id, message = "تم التسجيل بنجاح!" });
    }

    // POST /api/subscribers/send-field-otp — إرسال OTP لحقل معين (phone/whatsapp/email)
    [HttpPost("send-field-otp")]
    public async Task<IActionResult> SendFieldOtp([FromBody] FieldOtpDto dto) {
        if (string.IsNullOrEmpty(dto.Value)) return BadRequest(new { message = "القيمة مطلوبة" });
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
        else {
            // أرسل WhatsApp أولاً (يعمل مع كل الشبكات العراقية) + SMS كـ fallback
            var waSent = await _notify.SendWhatsAppOtp(dto.Value, otp);
            await _notify.SendTwilioSms(dto.Value, otp); // SMS معاً للتأكيد
        }
        return Ok(new { message = "تم إرسال رمز التأكيد عبر واتساب ورسالة نصية" });
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

    // POST /api/subscribers/send-otp-new — إرسال OTP للتسجيل الجديد (phone فقط)
    [HttpPost("send-otp-new")]
    public async Task<IActionResult> SendOtpNew([FromBody] PhoneDto dto) {
        if (string.IsNullOrEmpty(dto.Phone)) return BadRequest(new { message = "رقم الهاتف مطلوب" });
        var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == dto.Phone);
        if (existing != null) return BadRequest(new { message = "هذا الرقم مسجّل مسبقاً" });
        return await SendFieldOtp(new FieldOtpDto("phone", dto.Phone));
    }

    // POST /api/subscribers/verify-otp-new — تحقق OTP للتسجيل الجديد
    [HttpPost("verify-otp-new")]
    public async Task<IActionResult> VerifyOtpNew([FromBody] VerifyOtpDto dto) {
        return await VerifyFieldOtp(new FieldVerifyDto("phone", dto.Phone, dto.Code));
    }

    // POST /api/subscribers/send-otp — إرسال OTP للمتابع المسجّل سابقاً
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] PhoneDto dto) {
        var sub = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == dto.Phone);
        if (sub == null) return NotFound(new { message = "هذا الرقم غير مسجّل" });

        var otp = new string(System.Linq.Enumerable.Repeat("0123456789", 6)
            .Select(s => s[new Random().Next(s.Length)]).ToArray());

        var existing = await _db.OtpCodes.FirstOrDefaultAsync(o => o.UserId == sub.Id && o.Type == "subscriber" && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
        if (existing != null) _db.OtpCodes.Remove(existing);

        _db.OtpCodes.Add(new OtpCode {
            UserId = sub.Id, Code = otp, Channel = "sms",
            Type = "subscriber", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await _db.SaveChangesAsync();

        var msg = $"اتحاد الغرف التجارية العراقية\nرمز تأكيد الدخول: {otp}\nصالح 10 دقائق";
        await _notify.SendTwilioSms(dto.Phone, otp);
        return Ok(new { message = "تم إرسال رمز التأكيد" });
    }

    // POST /api/subscribers/verify-otp — تحقق OTP وإرجاع بيانات المتابع
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto) {
        var sub = await _db.Subscribers.FirstOrDefaultAsync(s => s.Phone == dto.Phone);
        if (sub == null) return NotFound(new { message = "الرقم غير مسجّل" });

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
    public async Task<IActionResult> Update(int id, [FromBody] SubscriberDto dto) {
        var sub = await _db.Subscribers.FindAsync(id);
        if (sub == null) return NotFound();
        sub.FullName  = dto.FullName;
        sub.WhatsApp  = dto.WhatsApp;
        sub.Email     = dto.Email;
        sub.Sectors   = dto.Sectors;
        sub.NotifyBy  = dto.NotifyBy;
        sub.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    // GET /api/subscribers — للأدمن
    [HttpGet, Authorize]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20) {
        var total = await _db.Subscribers.CountAsync();
        var items = await _db.Subscribers.OrderByDescending(s => s.CreatedAt)
            .Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }
}

public record SubscriberDto(string FullName, string Phone, string? WhatsApp, string? Email, string? Sectors, string? NotifyBy);
public record PhoneDto(string Phone);
public record VerifyOtpDto(string Phone, string Code);
public record FieldOtpDto(string Field, string Value);
public record FieldVerifyDto(string Field, string Value, string Code);
