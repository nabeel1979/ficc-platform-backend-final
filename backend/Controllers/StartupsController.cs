using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/startups")]
public class StartupsController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;

    public StartupsController(AppDbContext db, FICCPlatform.Services.StorageService storage) {
        _db = db; _storage = storage;
    }

    // ─── قائمة المشاريع (عام) ───
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? sector) {
        var q = _db.Startups.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        else q = q.Where(s => s.Status == "approved"); // عام: الموافق عليها فقط
        if (!string.IsNullOrEmpty(sector)) q = q.Where(s => s.Sector == sector);
        var result = await q.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return Ok(result);
    }

    // ─── تفاصيل مشروع ───
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var s = await _db.Startups
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();
        return Ok(s);
    }

    // ─── تقديم مشروع جديد ───
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] StartupDto dto) {
        var s = new Startup {
            Name = dto.Name,
            Description = dto.Description,
            OwnerName = dto.OwnerName,
            OwnerEmail = dto.OwnerEmail,
            OwnerPhone = dto.OwnerPhone,
            Sector = dto.Sector,
            FundingNeeded = dto.FundingNeeded,
            Stage = dto.Stage ?? "فكرة",
            ChamberId = dto.ChamberId,
            OwnerBirthdate = dto.OwnerBirthdate,
            OwnerGender = dto.OwnerGender,
            Status = "pending"
        };
        _db.Startups.Add(s);
        await _db.SaveChangesAsync();
        return Ok(new { id = s.Id, message = "تم تقديم طلبك بنجاح — سيتم مراجعته قريباً" });
    }

    // ─── رفع ملف للمشروع ───
    [HttpPost("{id}/attach")]
    public async Task<IActionResult> Attach(int id, IFormFile file) {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "الملف مطلوب" });

        var startup = await _db.Startups.FindAsync(id);
        if (startup == null) return NotFound();

        var uploadsPath = _storage.GetFolder("startups");
        Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{id}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var attachment = new StartupAttachment {
            StartupId = id,
            FileName = file.FileName,
            FilePath = $"/uploads/startups/{fileName}",
            FileSize = file.Length
        };
        _db.StartupAttachments.Add(attachment);
        await _db.SaveChangesAsync();

        return Ok(new { filePath = attachment.FilePath, fileName = file.FileName });
    }

    // ─── Admin: كل الطلبات ───
    [HttpGet("admin/all")]
    [Authorize]
    public async Task<IActionResult> AdminGetAll([FromQuery] string? status) {
        var q = _db.Startups.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        var result = await q.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return Ok(result);
    }

    // ─── Admin: تغيير الحالة ───
    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto) {
        var s = await _db.Startups.FindAsync(id);
        if (s == null) return NotFound();
        s.Status = dto.Status;
        s.AdminNotes = dto.Notes;
        s.ReviewedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث الحالة" });
    }
}

public record StartupDto(
    string Name, string? Description,
    string OwnerName, string? OwnerEmail, string? OwnerPhone,
    string Sector, string? FundingNeeded, string? Stage, int? ChamberId,
    string? OwnerBirthdate, string? OwnerGender
);

public record UpdateStatusDto(string Status, string? Notes);
