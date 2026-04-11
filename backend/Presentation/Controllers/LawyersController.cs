using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LawyersController : ControllerBase {
    private readonly AppDbContext _db;
    public LawyersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? governorate,
        [FromQuery] string? specialization,
        [FromQuery] bool? onlineOnly,
        [FromQuery] bool? verifiedOnly,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20) {
        var q = _db.Lawyers.Where(l => l.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(l => l.FullName.Contains(search));
        if (!string.IsNullOrEmpty(governorate))
            q = q.Where(l => l.Governorate == governorate);
        if (!string.IsNullOrEmpty(specialization))
            q = q.Where(l => l.Specializations!.Contains(specialization));
        if (onlineOnly == true)
            q = q.Where(l => l.AcceptsOnlineConsultation);
        if (verifiedOnly == true)
            q = q.Where(l => l.IsVerified);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(l => l.Rating).Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var l = await _db.Lawyers.FindAsync(id);
        return l == null ? NotFound() : Ok(l);
    }

    [HttpPost("{id}/consultation")]
    public async Task<IActionResult> RequestConsultation(int id, [FromBody] ConsultationDto dto) {
        _db.ConsultationRequests.Add(new ConsultationRequest {
            LawyerId = id,
            RequesterName = dto.Name,
            RequesterPhone = dto.Phone,
            RequesterEmail = dto.Email,
            Subject = dto.Subject,
            Description = dto.Description,
            PreferredDate = dto.PreferredDate
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال طلب الاستشارة، سيتواصل معك المحامي قريباً" });
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> AddReview(int id, [FromBody] ReviewDto dto) {
        _db.DirectoryReviews.Add(new DirectoryReview {
            EntityType = "Lawyer", EntityId = id,
            ReviewerName = dto.Name, ReviewerPhone = dto.Phone,
            Rating = dto.Rating, Comment = dto.Comment
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال التقييم" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Lawyer item) {
        item.CreatedAt = DateTime.UtcNow;
        _db.Lawyers.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Lawyer updated) {
        var item = await _db.Lawyers.FindAsync(id);
        if (item == null) return NotFound();
        updated.Id = id;
        _db.Entry(item).CurrentValues.SetValues(updated);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.Lawyers.FindAsync(id);
        if (item == null) return NotFound();
        // Remove related records first
        var reviews = _db.DirectoryReviews.Where(r => r.EntityType == "Lawyer" && r.EntityId == id);
        _db.DirectoryReviews.RemoveRange(reviews);
        var consultations = _db.ConsultationRequests.Where(c => c.LawyerId == id);
        _db.ConsultationRequests.RemoveRange(consultations);
        _db.Lawyers.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("specializations")]
    public IActionResult GetSpecializations() => Ok(new[] {
        "تجاري", "شركات", "عقاري", "جمركي", "عمالي",
        "استثمار", "شحن بحري", "تجاري دولي", "ملكية فكرية"
    });
}

public record ReviewDto(string? Name, string? Phone, int Rating, string? Comment);
public record ConsultationDto(string Name, string Phone, string? Email, string? Subject, string? Description, DateTime? PreferredDate);
