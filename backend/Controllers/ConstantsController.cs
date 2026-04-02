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
        // منع التكرار — نفس القيمة بنفس التصنيف
        var exists = await _db.SystemConstants.AnyAsync(c =>
            c.Category == dto.Category &&
            c.Value.Trim().ToLower() == dto.Value.Trim().ToLower());
        if (exists)
            return BadRequest(new { message = $"❌ القيمة \"{dto.Value}\" موجودة مسبقاً في هذا التصنيف" });

        dto.Value = dto.Value.Trim();
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

        // منع التكرار عند التعديل (تجاهل السجل الحالي نفسه)
        var exists = await _db.SystemConstants.AnyAsync(x =>
            x.Id != id &&
            x.Category == c.Category &&
            x.Value.Trim().ToLower() == dto.Value.Trim().ToLower());
        if (exists)
            return BadRequest(new { message = $"❌ القيمة \"{dto.Value}\" موجودة مسبقاً في هذا التصنيف" });

        c.Value = dto.Value.Trim(); c.Label = dto.Label;
        c.SortOrder = dto.SortOrder; c.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.SystemConstants.FindAsync(id);
        if (c == null) return NotFound();

        // تحقق: هل القيمة مستخدمة في البيانات الفعلية؟
        int usageCount = 0;
        if (c.Category.StartsWith("trader")) {
            usageCount += await _db.TraderDirectory.CountAsync(t =>
                t.BusinessType == c.Value || t.TradeCategory == c.Value);
            usageCount += await _db.Submissions.CountAsync(s =>
                s.FormData != null && s.FormData.Contains(c.Value) && s.EntityType == "trader");
        } else if (c.Category.StartsWith("news")) {
            usageCount += await _db.News.CountAsync(n => n.Category == c.Value);
        }

        if (usageCount > 0)
            return BadRequest(new {
                message = $"❌ لا يمكن حذف \"{c.Value}\" — مستخدمة في {usageCount} سجل. يمكنك إيقاف تفعيلها بدلاً من الحذف.",
                usageCount
            });

        _db.SystemConstants.Remove(c);
        await _db.SaveChangesAsync();
        return Ok();
    }
}
