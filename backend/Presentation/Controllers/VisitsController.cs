using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisitsController : ControllerBase {
    private readonly AppDbContext _db;
    public VisitsController(AppDbContext db) { _db = db; }

    // Increment and return count
    [HttpPost("track")]
    public async Task<IActionResult> Track() {
        var record = await _db.SiteVisits.FirstOrDefaultAsync();
        if (record == null) {
            record = new FICCPlatform.Models.SiteVisit { Count = 1 };
            _db.SiteVisits.Add(record);
        } else {
            record.Count++;
            record.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { count = record.Count });
    }

    // Get count only (no increment)
    [HttpGet("count")]
    public async Task<IActionResult> GetCount() {
        var record = await _db.SiteVisits.FirstOrDefaultAsync();
        return Ok(new { count = record?.Count ?? 0 });
    }
}
