using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/members")]
public class MembersController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    public MembersController(AppDbContext db, FICCPlatform.Services.StorageService storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? chamberId) {
        var q = _db.Members.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(m => m.FullName.Contains(search) || (m.ChamberName != null && m.ChamberName.Contains(search)) || (m.Title != null && m.Title.Contains(search)));
        if (!string.IsNullOrEmpty(chamberId) && int.TryParse(chamberId, out int cid))
            q = q.Where(m => m.ChamberId == cid);
        return Ok(await q.OrderBy(m => m.SortOrder).ThenBy(m => m.Id).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var item = await _db.Members.FirstOrDefaultAsync(m => m.Id == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Member item) {
        _db.Members.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Member updated) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return NotFound();
        item.FullName    = !string.IsNullOrEmpty(updated.FullName) ? updated.FullName : item.FullName;
        item.Title       = updated.Title       ?? item.Title;
        item.ChamberName = updated.ChamberName ?? item.ChamberName;
        item.ChamberId   = updated.ChamberId   ?? item.ChamberId;
        item.Bio         = updated.Bio         ?? item.Bio;
        item.Phone       = updated.Phone       ?? item.Phone;
        item.Email       = updated.Email       ?? item.Email;
        item.Facebook    = updated.Facebook    ?? item.Facebook;
        item.Twitter     = updated.Twitter     ?? item.Twitter;
        item.SortOrder   = updated.SortOrder;
        item.Status      = updated.Status      ?? item.Status;
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("{id}/upload-photo")]
    public async Task<IActionResult> UploadPhoto(int id, [FromForm] IFormFile photo) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return NotFound();
        if (photo == null || photo.Length == 0) return BadRequest("No file");
        var dir = _storage.GetFolder("members");
        Directory.CreateDirectory(dir);
        var ts   = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var name = $"member_{id}_{ts}.jpg";
        var fullPath = Path.Combine(dir, name);
        // Save original then resize using ImageMagick if available
        await using (var stream = System.IO.File.Create(fullPath)) {
            await photo.CopyToAsync(stream);
        }
        // Resize to max 500x500 for OG compatibility (WhatsApp/Telegram require <300KB)
        try {
            var resized = Path.Combine(dir, $"member_{id}_{ts}_r.jpg");
            var proc = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo {
                FileName = "convert",
                Arguments = $"\"{fullPath}\" -resize 500x500^ -gravity center -extent 500x500 -quality 82 \"{resized}\"",
                RedirectStandardError = true, UseShellExecute = false
            });
            proc?.WaitForExit(5000);
            if (System.IO.File.Exists(resized) && new System.IO.FileInfo(resized).Length > 0) {
                System.IO.File.Delete(fullPath);
                System.IO.File.Move(resized, fullPath);
            }
        } catch { /* keep original if resize fails */ }
        item.PhotoUrl = $"/uploads/members/{name}";
        await _db.SaveChangesAsync();
        return Ok(new { photoUrl = item.PhotoUrl });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return NotFound();
        // Clear phone/email before delete so they can be reused
        item.Phone = null;
        item.Email = null;
        await _db.SaveChangesAsync();
        _db.Members.Remove(item);
        await _db.SaveChangesAsync();
        return Ok();
    }
    [HttpPatch("{id}/clear-contact")]
    public async Task<IActionResult> ClearContact(int id, [FromBody] ClearContactDto dto) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return NotFound();
        if (dto.Field == "phone" || dto.Field == "mobile") {
            item.Phone = null;
            
        } else if (dto.Field == "email") {
            item.Email = null;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم المسح" });
    }

}
