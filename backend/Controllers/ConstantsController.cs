using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

[ApiController][Route("api/constants")]
public class ConstantsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ConstantsController(AppDbContext db) { _db = db; }

    // Public - للـ dropdowns
    [HttpGet("{category}")]
    public async Task<IActionResult> GetByCategory(string category) =>
        Ok(await _db.SystemConstants
            .Where(c => c.Category == category && c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Value)
            .Select(c => new { c.Id, c.Value, c.Label })
            .ToListAsync());

    // Admin - إدارة كاملة (لا يحتاج auth للقراءة)
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.SystemConstants.OrderBy(c => c.Category).ThenBy(c => c.SortOrder).ToListAsync());

    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] SystemConstant dto)
    {
        dto.CreatedAt = DateTime.UtcNow;
        _db.SystemConstants.Add(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }

    [HttpPut("{id}"), Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] SystemConstant dto)
    {
        var c = await _db.SystemConstants.FindAsync(id);
        if (c == null) return NotFound();
        c.Value = dto.Value; c.Label = dto.Label;
        c.SortOrder = dto.SortOrder; c.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.SystemConstants.FindAsync(id);
        if (c == null) return NotFound();
        _db.SystemConstants.Remove(c);
        await _db.SaveChangesAsync();
        return Ok();
    }
}
