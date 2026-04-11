using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomsAgentsController : ControllerBase {
    private readonly AppDbContext _db;
    public CustomsAgentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? governorate,
        [FromQuery] string? port,
        [FromQuery] bool? verifiedOnly,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20) {
        var q = _db.CustomsAgents.Where(a => a.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(a => a.AgentName.Contains(search) || a.CompanyName!.Contains(search));
        if (!string.IsNullOrEmpty(governorate))
            q = q.Where(a => a.Governorate == governorate);
        if (!string.IsNullOrEmpty(port))
            q = q.Where(a => a.CustomsPorts!.Contains(port));
        if (verifiedOnly == true)
            q = q.Where(a => a.IsVerified);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(a => a.Rating).Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var a = await _db.CustomsAgents.FindAsync(id);
        return a == null ? NotFound() : Ok(a);
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> AddReview(int id, [FromBody] ReviewDto dto) {
        _db.DirectoryReviews.Add(new DirectoryReview {
            EntityType = "CustomsAgent", EntityId = id,
            ReviewerName = dto.Name, ReviewerPhone = dto.Phone,
            Rating = dto.Rating, Comment = dto.Comment
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال التقييم، سيظهر بعد المراجعة" });
    }

    [HttpGet("ports")]
    public IActionResult GetPorts() => Ok(new[] {
        "ام قصر", "خور الزبير", "المنذرية", "الشلامجة", "طريبيل",
        "إبراهيم الخليل", "المنفذ السوري", "بغداد الجوي", "البصرة الجوي"
    });
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.CustomsAgents.FindAsync(id);
        if (item == null) return NotFound();
        _db.CustomsAgents.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

}

