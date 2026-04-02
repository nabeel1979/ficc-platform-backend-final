using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    public NewsController(AppDbContext db, FICCPlatform.Services.StorageService storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) {
        var q = _db.News.AsQueryable();
        if (!string.IsNullOrEmpty(search))   q = q.Where(n => n.Title.Contains(search) || n.Body.Contains(search));
        if (!string.IsNullOrEmpty(category)) q = q.Where(n => n.Category == category);
        return Ok(await q.OrderByDescending(n => n.PublishedAt).Skip((page-1)*pageSize).Take(pageSize).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        item.ViewCount++; await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] News item) {
        item.PublishedAt = DateTime.UtcNow;
        _db.News.Add(item); await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] News updated) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        item.Title = updated.Title; item.Body = updated.Body;
        item.Category = updated.Category; item.Author = updated.Author;
        item.IsFeatured = updated.IsFeatured;
        if (updated.Images != null) item.Images = updated.Images;
        if (updated.VideoUrl != null) item.VideoUrl = updated.VideoUrl;
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        _db.News.Remove(item); await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/upload-images")]
    public async Task<IActionResult> UploadImages(int id, [FromForm] List<IFormFile> images) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        if (images.Count > 5) return BadRequest(new { message = "الحد الأقصى 5 صور" });

        var uploadsDir = _storage.GetFolder("news");
        Directory.CreateDirectory(uploadsDir);

        // Load existing images
        var existingUrls = new List<string>();
        if (!string.IsNullOrEmpty(item.Images)) {
            try { existingUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Images) ?? new(); } catch {}
        }

        var newUrls = new List<string>();
        foreach (var file in images) {
            if (file.Length > 5_000_000) continue;
            var ext  = Path.GetExtension(file.FileName).ToLower();
            var name = $"{id}_{Guid.NewGuid():N}{ext}";
            var path = Path.Combine(uploadsDir, name);
            using var stream = System.IO.File.Create(path);
            await file.CopyToAsync(stream);
            newUrls.Add($"/uploads/news/{name}");
        }

        // Merge: existing + new (max 5 total)
        var allUrls = existingUrls.Concat(newUrls).Distinct().Take(5).ToList();
        item.Images = System.Text.Json.JsonSerializer.Serialize(allUrls);
        if (allUrls.Count > 0 && string.IsNullOrEmpty(item.ImageUrl)) item.ImageUrl = allUrls[0];
        await _db.SaveChangesAsync();
        return Ok(new { urls = allUrls });
    }
    [HttpPatch("{id}/set-main-image")]
    public async Task<IActionResult> SetMainImage(int id, [FromBody] SetMainImageDto dto) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        item.ImageUrl = dto.ImageUrl;
        // Reorder images array to put main first
        if (!string.IsNullOrEmpty(item.Images)) {
            try {
                var imgs = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Images) ?? new();
                if (imgs.Contains(dto.ImageUrl)) {
                    imgs.Remove(dto.ImageUrl);
                    imgs.Insert(0, dto.ImageUrl);
                    item.Images = System.Text.Json.JsonSerializer.Serialize(imgs);
                }
            } catch {}
        }
        await _db.SaveChangesAsync();
        return Ok(new { item.ImageUrl });
    }
    [HttpPost("{id}/delete-images")]
    public async Task<IActionResult> DeleteImages(int id, [FromBody] DeleteImagesDto dto) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return NotFound();
        if (!string.IsNullOrEmpty(item.Images)) {
            try {
                var imgs = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Images) ?? new();
                foreach (var url in dto.Urls) {
                    imgs.Remove(url);
                    // Delete physical file
                    var filePath = Path.Combine(_storage.UploadsRoot, url.TrimStart('/').Replace("uploads/", "").Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
                }
                item.Images = System.Text.Json.JsonSerializer.Serialize(imgs);
                if (dto.Urls.Contains(item.ImageUrl)) item.ImageUrl = imgs.FirstOrDefault();
            } catch {}
        }
        await _db.SaveChangesAsync();
        return Ok();
    }

}

public record SetMainImageDto(string ImageUrl);
public record DeleteImagesDto(List<string> Urls);
