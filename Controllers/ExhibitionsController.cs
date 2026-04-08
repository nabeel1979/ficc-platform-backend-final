using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExhibitionsController : ControllerBase {
    private readonly AppDbContext _db;
    public ExhibitionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) {
        var q = _db.Exhibitions.Include(e => e.OrganizerChamber).AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(e => e.Status == status);
        return Ok(await q.OrderByDescending(e => e.StartDate).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var e = await _db.Exhibitions
            .Include(x => x.OrganizerChamber)
            .Include(x => x.Participants).ThenInclude(p => p.Member)
            .FirstOrDefaultAsync(x => x.Id == id);
        return e == null ? NotFound() : Ok(e);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Exhibition exhibition) {
        _db.Exhibitions.Add(exhibition);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = exhibition.Id }, exhibition);
    }

    [HttpPost("{id}/register")]
    public async Task<IActionResult> Register(int id, [FromBody] int memberId) {
        var exists = await _db.ExhibitionParticipants.AnyAsync(p => p.ExhibitionId == id && p.MemberId == memberId);
        if (exists) return BadRequest("مسجل مسبقاً");
        _db.ExhibitionParticipants.Add(new ExhibitionParticipant { ExhibitionId = id, MemberId = memberId });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم التسجيل بنجاح" });
    }
}
