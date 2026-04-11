using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using Microsoft.AspNetCore.Authorization;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/sectors")]
public class SectorsController : ControllerBase {
    private readonly AppDbContext _db;
    public SectorsController(AppDbContext db) { _db = db; }

    // GET /api/sectors — جلب كل الأقسام النشطة
    [HttpGet]
    public async Task<IActionResult> GetAll() {
        var sectors = await _db.Sectors
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new { s.Id, s.Name, s.Slug, s.Icon, s.Description })
            .ToListAsync();
        return Ok(sectors);
    }

    // GET /api/sectors/all — للادمن (شامل غير النشط)
    [HttpGet("all")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAllAdmin() {
        var sectors = await _db.Sectors.OrderBy(s => s.DisplayOrder).ToListAsync();
        return Ok(sectors);
    }

    // POST /api/sectors
    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] Sector dto) {
        _db.Sectors.Add(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }

    // PUT /api/sectors/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] Sector dto) {
        var s = await _db.Sectors.FindAsync(id);
        if (s == null) return NotFound();
        s.Name = dto.Name;
        s.Slug = dto.Slug;
        s.Icon = dto.Icon;
        s.Description = dto.Description;
        s.DisplayOrder = dto.DisplayOrder;
        s.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    // GET /api/sectors/{id}/subscribers — جلب المتابعين لقسم معين (بـ SystemConstant ID)
    [HttpGet("{id}/subscribers")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetSubscribers(int id) {
        // البحث في Interests (JSON array of IDs)
        var all = await _db.Subscribers
            .Where(s => s.IsActive && s.Interests != null)
            .Select(s => new {
                s.Id, s.FullName, s.Phone, s.WhatsApp, s.Email,
                s.ProfileImage, s.Interests, s.CreatedAt
            })
            .ToListAsync();

        // Filter: check if id is in JSON array
        var result = all.Where(s => {
            try {
                var ids = System.Text.Json.JsonSerializer.Deserialize<List<int>>(s.Interests!);
                return ids != null && ids.Contains(id);
            } catch { return false; }
        }).Select(s => new { s.Id, s.FullName, s.Phone, s.WhatsApp, s.Email, s.ProfileImage, s.CreatedAt })
        .ToList();

        return Ok(result);
    }
}
