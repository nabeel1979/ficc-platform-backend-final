using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using Microsoft.AspNetCore.Authorization;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/courses/{courseId}/media")]
public class CourseMediaController : ControllerBase {
    private readonly AppDbContext _db;
    public CourseMediaController(AppDbContext db) { _db = db; }

    // GET /api/courses/{id}/media
    [HttpGet]
    public async Task<IActionResult> GetAll(int courseId) {
        var items = await _db.CourseMedia
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.DisplayOrder).ThenBy(m => m.CreatedAt)
            .Select(m => new {
                m.Id, m.CourseId, m.Type, m.Url,
                m.Title, m.Description, m.DisplayOrder, m.CreatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    // POST /api/courses/{id}/media
    [HttpPost]
    public async Task<IActionResult> Add(int courseId, [FromBody] CourseMediaDto dto) {
        Console.WriteLine($"DEBUG: courseId={courseId}, dto.Type={dto?.Type}, dto.Url={dto?.Url}");
        
        if (dto == null)
            return BadRequest(new { message = "البيانات فارغة" });
            
        var course = await _db.EntrepreneurCourses.FindAsync(courseId);
        if (course == null) return NotFound(new { message = $"الدورة {courseId} غير موجودة" });

        // تحقق من صحة YouTube URL
        if (dto.Type == "video" && !string.IsNullOrEmpty(dto.Url)) {
            if (!dto.Url.Contains("youtube.com") && !dto.Url.Contains("youtu.be"))
                return BadRequest(new { message = "رابط YouTube غير صحيح" });
        }

        var media = new CourseMedia {
            CourseId = courseId,
            Type = dto.Type,
            Url = dto.Url,
            Title = dto.Title,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow
        };
        _db.CourseMedia.Add(media);
        await _db.SaveChangesAsync();
        return Ok(new { media.Id, media.CourseId, media.Type, media.Url, media.Title, media.Description, media.DisplayOrder, media.CreatedAt });
    }

    // PUT /api/courses/{courseId}/media/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int courseId, int id, [FromBody] CourseMediaDto dto) {
        var media = await _db.CourseMedia.FirstOrDefaultAsync(m => m.Id == id && m.CourseId == courseId);
        if (media == null) return NotFound();
        media.Title = dto.Title;
        media.Description = dto.Description;
        media.Url = dto.Url;
        media.DisplayOrder = dto.DisplayOrder;
        await _db.SaveChangesAsync();
        return Ok(new { media.Id, media.CourseId, media.Type, media.Url, media.Title, media.Description, media.DisplayOrder, media.CreatedAt });
    }

    // DELETE /api/courses/{courseId}/media/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int courseId, int id) {
        var media = await _db.CourseMedia.FirstOrDefaultAsync(m => m.Id == id && m.CourseId == courseId);
        if (media == null) return NotFound();
        _db.CourseMedia.Remove(media);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CourseMediaDto {
    public string Type { get; set; } = "image";
    public string Url { get; set; } = "";
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
}
