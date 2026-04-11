using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConferencesController : ControllerBase {
    private readonly AppDbContext _db;
    public ConferencesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) {
        var q = _db.Conferences.Include(c => c.OrganizerChamber).AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);
        return Ok(await q.OrderByDescending(c => c.Date).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var c = await _db.Conferences
            .Include(x => x.OrganizerChamber)
            .Include(x => x.Sessions)
            .Include(x => x.Attendees).ThenInclude(a => a.Member)
            .FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Conference conference) {
        _db.Conferences.Add(conference);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = conference.Id }, conference);
    }

    [HttpPost("{id}/register")]
    public async Task<IActionResult> Register(int id, [FromBody] int memberId) {
        var exists = await _db.ConferenceAttendees.AnyAsync(a => a.ConferenceId == id && a.MemberId == memberId);
        if (exists) return BadRequest("مسجل مسبقاً");
        _db.ConferenceAttendees.Add(new ConferenceAttendee { ConferenceId = id, MemberId = memberId });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم التسجيل في المؤتمر بنجاح" });
    }

    [HttpGet("{id}/sessions")]
    public async Task<IActionResult> GetSessions(int id) {
        var sessions = await _db.ConferenceSessions
            .Where(s => s.ConferenceId == id)
            .OrderBy(s => s.StartTime)
            .ToListAsync();
        return Ok(sessions);
    }
}
