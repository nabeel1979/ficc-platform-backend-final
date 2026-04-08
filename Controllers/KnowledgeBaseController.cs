using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

[ApiController]
[Route("api/knowledge")]
public class KnowledgeBaseController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;

    public KnowledgeBaseController(AppDbContext db, FICCPlatform.Services.StorageService storage) {
        _db = db; _storage = storage;
    }

    // GET /api/knowledge — قائمة (أدمن)
    [HttpGet, Authorize]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? category = null) {
        var q = _db.KnowledgeBase.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(k => k.Title.Contains(search) || k.Keywords.Contains(search));
        if (!string.IsNullOrEmpty(category))
            q = q.Where(k => k.Category == category);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(k => k.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    // POST /api/knowledge — إضافة
    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] KnowledgeBase item) {
        item.CreatedAt = DateTime.UtcNow;
        _db.KnowledgeBase.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    // PUT /api/knowledge/{id} — تعديل
    [HttpPut("{id}"), Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] KnowledgeBase dto) {
        var item = await _db.KnowledgeBase.FindAsync(id);
        if (item == null) return NotFound();
        item.Title = dto.Title; item.Keywords = dto.Keywords;
        item.Type = dto.Type; item.Answer = dto.Answer;
        item.FilePath = dto.FilePath; item.LinkUrl = dto.LinkUrl;
        item.Category = dto.Category; item.IsActive = dto.IsActive;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    // DELETE /api/knowledge/{id}
    [HttpDelete("{id}"), Authorize]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.KnowledgeBase.FindAsync(id);
        if (item == null) return NotFound();
        _db.KnowledgeBase.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم الحذف" });
    }

    // POST /api/knowledge/upload-file — رفع ملف
    [HttpPost("upload-file"), Authorize]
    public async Task<IActionResult> UploadFile(IFormFile file) {
        if (file == null || file.Length == 0) return BadRequest(new { message = "الملف مطلوب" });
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx" };
        if (!allowed.Contains(ext)) return BadRequest(new { message = "نوع الملف غير مدعوم" });
        var folder = _storage.GetFolder("knowledge");
        Directory.CreateDirectory(folder);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var r2Path = await _storage.SaveFileAsync(file, "knowledge", fileName);
        return Ok(new { path = r2Path, name = file.FileName });
    }

    // POST /api/knowledge/import-excel — استيراد Excel
    [HttpPost("import-excel"), Authorize]
    public async Task<IActionResult> ImportExcel(IFormFile file) {
        if (file == null || file.Length == 0) return BadRequest(new { message = "الملف مطلوب" });
        // قراءة CSV (Excel يُصدَّر كـ CSV)
        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var lines = new List<string>();
        while (!reader.EndOfStream) lines.Add(await reader.ReadLineAsync() ?? "");

        int imported = 0;
        foreach (var line in lines.Skip(1)) { // تخطي الهيدر
            var parts = line.Split(',');
            if (parts.Length < 3) continue;
            var item = new KnowledgeBase {
                Title = parts[0].Trim('"'),
                Keywords = parts.Length > 1 ? parts[1].Trim('"') : "",
                Type = parts.Length > 2 ? parts[2].Trim('"') : "text",
                Answer = parts.Length > 3 ? parts[3].Trim('"') : null,
                Category = parts.Length > 4 ? parts[4].Trim('"') : null,
                CreatedAt = DateTime.UtcNow
            };
            _db.KnowledgeBase.Add(item);
            imported++;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = $"تم استيراد {imported} سجل" });
    }

    // POST /api/knowledge/search — البحث (للمحادثة)
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] SearchDto dto) {
        if (string.IsNullOrEmpty(dto.Query)) return Ok(new List<object>());
        var query = dto.Query.ToLower();
        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var items = await _db.KnowledgeBase.Where(k => k.IsActive).ToListAsync();

        var results = items
            .Select(k => {
                var kw = k.Keywords.ToLower();
                var title = k.Title.ToLower();
                int score = 0;
                foreach (var w in words) {
                    if (title.Contains(w)) score += 3;
                    if (kw.Contains(w)) score += 2;
                    if (k.Answer != null && k.Answer.ToLower().Contains(w)) score += 1;
                }
                return new { item = k, score };
            })
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .Take(3)
            .Select(x => x.item)
            .ToList();

        return Ok(results);
    }
}

public record SearchDto(string Query);
