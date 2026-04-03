using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using FICCPlatform.Services;
using System.Security.Claims;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/security")]
[Authorize]
public class SecurityController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly OtpSecurityService _security;

    public SecurityController(AppDbContext db, OtpSecurityService security) {
        _db = db; _security = security;
    }

    // قائمة المحجوبين
    [HttpGet("blocked")]
    public async Task<IActionResult> GetBlocked([FromQuery] bool activeOnly = true) {
        var list = await _security.GetBlockedListAsync(activeOnly);
        return Ok(list);
    }

    // فك الحجب
    [HttpPost("unblock/{id}")]
    public async Task<IActionResult> Unblock(int id) {
        var b = await _db.BlockedContacts.FindAsync(id);
        if (b == null) return NotFound();
        var admin = User.FindFirst(ClaimTypes.Name)?.Value ?? "admin";
        await _security.UnblockContactAsync(b.Contact, b.Channel, admin);
        return Ok(new { message = "تم فك الحجب بنجاح" });
    }

    // حجب يدوي — يحدد الـ channel تلقائياً حسب نوع الـ contact
    [HttpPost("block")]
    public async Task<IActionResult> Block([FromBody] BlockDto dto) {
        if (string.IsNullOrWhiteSpace(dto.Contact))
            return BadRequest(new { message = "يرجى إدخال إيميل أو رقم هاتف" });

        // تحديد النوع تلقائياً: إذا يحتوي @ فهو إيميل، وإلا رقم هاتف
        var isEmail = dto.Contact.Contains('@');
        var detectedChannel = isEmail ? "email" : "sms";

        // التحقق من التطابق مع اختيار المستخدم
        if (!string.IsNullOrEmpty(dto.Channel) && dto.Channel != detectedChannel) {
            var expected = isEmail ? "إيميل" : "رقم هاتف";
            var chosen   = dto.Channel == "email" ? "إيميل" : "SMS";
            return BadRequest(new { message = $"خطأ: المدخل هو {expected} لكن اخترت {chosen}. يرجى المطابقة." });
        }

        await _security.BlockContactAsync(dto.Contact, detectedChannel, "manual");
        return Ok(new { message = $"تم حجب {(isEmail ? "الإيميل" : "رقم الهاتف")} بنجاح", channel = detectedChannel });
    }

    // إحصائيات المحاولات
    [HttpGet("attempts")]
    public async Task<IActionResult> GetAttempts([FromQuery] string? contact, [FromQuery] int hours = 24) {
        var since = DateTime.UtcNow.AddHours(-hours);
        var q = _db.OtpAttempts.Where(a => a.CreatedAt >= since);
        if (!string.IsNullOrEmpty(contact)) q = q.Where(a => a.Contact.Contains(contact));
        var result = await q.OrderByDescending(a => a.CreatedAt).Take(100).ToListAsync();
        return Ok(result);
    }

    // حالة الـ Channels
    [HttpGet("channels")]
    public async Task<IActionResult> GetChannels() {
        var (smsDisabled, emailDisabled) = await _security.GetChannelStatusAsync();
        return Ok(new { smsDisabled, emailDisabled });
    }

    // تفعيل/تعطيل Channel
    [HttpPost("channels/{channel}/{op}")]
    public async Task<IActionResult> SetChannel(string channel, string op) {
        if (channel != "sms" && channel != "email") return BadRequest();
        var disabled = op == "disable";
        await _security.SetChannelStatusAsync(channel, disabled);
        var ch = channel == "sms" ? "SMS" : "الإيميل";
        var status = disabled ? "🔴 معطّل" : "✅ مفعّل";
        return Ok(new { message = $"{ch} {status} الآن", disabled });
    }

    // إحصائيات عامة
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() {
        var now = DateTime.UtcNow;
        var last24h = now.AddHours(-24);
        var last1h = now.AddHours(-1);

        return Ok(new {
            totalBlocked     = await _db.BlockedContacts.CountAsync(b => b.IsActive),
            blockedToday     = await _db.BlockedContacts.CountAsync(b => b.BlockedAt >= now.Date),
            failedLast24h    = await _db.OtpAttempts.CountAsync(a => !a.Success && a.CreatedAt >= last24h),
            failedLastHour   = await _db.OtpAttempts.CountAsync(a => !a.Success && a.CreatedAt >= last1h),
            successLast24h   = await _db.OtpAttempts.CountAsync(a => a.Success && a.CreatedAt >= last24h),
        });
    }

    // GET /api/security/ratelimits — محاولات المتابعين المحجوبة
    [HttpGet("ratelimits"), Authorize]
    public async Task<IActionResult> GetRateLimits([FromQuery] bool blockedOnly = true, [FromQuery] string? keyType = null) {
        var q = _db.RateLimitBlocks.AsQueryable();
        if (blockedOnly) q = q.Where(r => r.BlockedUntil != null && r.BlockedUntil > DateTime.UtcNow);
        if (!string.IsNullOrEmpty(keyType)) q = q.Where(r => r.KeyType == keyType);
        var items = await q.OrderByDescending(r => r.UpdatedAt).Take(200).ToListAsync();
        return Ok(items);
    }

    // POST /api/security/ratelimits/unblock/{id}
    [HttpPost("ratelimits/unblock/{id}"), Authorize]
    public async Task<IActionResult> UnblockRateLimit(int id) {
        var r = await _db.RateLimitBlocks.FindAsync(id);
        if (r == null) return NotFound();
        r.Attempts = 0; r.BlockedUntil = null; r.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم فك الحظر" });
    }

    // DELETE /api/security/ratelimits/{id}
    [HttpDelete("ratelimits/{id}"), Authorize]
    public async Task<IActionResult> DeleteRateLimit(int id) {
        var r = await _db.RateLimitBlocks.FindAsync(id);
        if (r == null) return NotFound();
        _db.RateLimitBlocks.Remove(r);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم الحذف" });
    }
}

public record BlockDto(string Contact, string Channel);
