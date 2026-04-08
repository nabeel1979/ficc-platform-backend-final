using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using Microsoft.AspNetCore.Authorization;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase {
    private readonly AppDbContext _db;
    public CoursesController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) {
        var q = _db.EntrepreneurCourses.Where(c => c.IsActive);
        if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);
        var items = await q.OrderBy(c => c.StartDate).ToListAsync();
        // تحديث الحالة تلقائياً بحسب التاريخ
        var now = DateTime.UtcNow;
        foreach (var c in items) {
            if (c.EndDate < now && c.Status != "completed") c.Status = "completed";
            else if (c.StartDate <= now && c.EndDate >= now && c.Status != "ongoing") c.Status = "ongoing";
        }
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var c = await _db.EntrepreneurCourses.FindAsync(id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] EntrepreneurCourse course) {
        course.CreatedAt = DateTime.UtcNow;
        course.Status = GetStatus(course.StartDate, course.EndDate);
        _db.EntrepreneurCourses.Add(course);
        await _db.SaveChangesAsync();
        return Ok(course);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] EntrepreneurCourse dto) {
        var c = await _db.EntrepreneurCourses.FindAsync(id);
        if (c == null) return NotFound();
        c.Title = dto.Title; c.Description = dto.Description;
        c.Speaker = dto.Speaker; c.SpeakerTitle = dto.SpeakerTitle;
        c.Location = dto.Location; c.StartDate = dto.StartDate; c.EndDate = dto.EndDate;
        c.MaxParticipants = dto.MaxParticipants; c.IsFree = dto.IsFree;
        c.Price = dto.Price; c.Category = dto.Category; c.Tags = dto.Tags;
        c.ImageUrl = dto.ImageUrl; c.IsActive = dto.IsActive;
        c.Status = dto.Status ?? GetStatus(dto.StartDate, dto.EndDate);
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(int id) {
        var c = await _db.EntrepreneurCourses.FindAsync(id);
        if (c == null) return NotFound();
        c.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // التقديم على الدورة
    [HttpPost("{id}/apply")]
    public async Task<IActionResult> Apply(int id, [FromBody] CourseApplicationDto dto) {
        var course = await _db.EntrepreneurCourses.FindAsync(id);
        if (course == null) return NotFound(new { message = "الدورة غير موجودة" });
        if (course.Status != "upcoming") return BadRequest(new { message = "التقديم متاح فقط للدورات القادمة" });
        if (course.CurrentParticipants >= course.MaxParticipants)
            return BadRequest(new { message = "عذراً، اكتمل عدد المشاركين" });

        // تحقق من التقديم المسبق
        var existing = await _db.CourseApplications.AnyAsync(a => a.CourseId == id && a.Phone == dto.Phone);
        if (existing) return BadRequest(new { message = "لقد قدّمت طلباً مسبقاً لهذه الدورة" });

        var app = new CourseApplication {
            CourseId = id, FullName = dto.FullName, Phone = dto.Phone,
            Email = dto.Email, Company = dto.Company, Motivation = dto.Motivation,
            Status = "pending", CreatedAt = DateTime.UtcNow
        };
        _db.CourseApplications.Add(app);
        course.CurrentParticipants++;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تسجيل طلبك بنجاح! سيتم التواصل معك قريباً", id = app.Id });
    }

    [HttpGet("{id}/applications")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetApplications(int id) {
        var apps = await _db.CourseApplications.Where(a => a.CourseId == id).OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(apps);
    }

    private string GetStatus(DateTime start, DateTime end) {
        var now = DateTime.UtcNow;
        if (end < now) return "completed";
        if (start <= now) return "ongoing";
        return "upcoming";
    }
}

public class CourseApplicationDto {
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Motivation { get; set; }
}
