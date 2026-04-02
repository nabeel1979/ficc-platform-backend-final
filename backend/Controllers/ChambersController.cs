using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChambersController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    public ChambersController(AppDbContext db, FICCPlatform.Services.StorageService storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? governorate) {
        var q = _db.Chambers.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(c => c.Name.Contains(search) || c.City.Contains(search));
        if (!string.IsNullOrEmpty(governorate))
            q = q.Where(c => c.Governorate == governorate);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var c = await _db.Chambers.Include(x => x.Members).FirstOrDefaultAsync(x => x.Id == id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Chamber chamber) {
        _db.Chambers.Add(chamber);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = chamber.Id }, chamber);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Chamber updated) {
        var item = await _db.Chambers.FindAsync(id);
        if (item == null) return NotFound();
        item.Name           = updated.Name           ?? item.Name;
        item.City           = updated.City           ?? item.City;
        item.Governorate    = updated.Governorate    ?? item.Governorate;
        item.Phone          = updated.Phone          ?? item.Phone;
        item.Email          = updated.Email          ?? item.Email;
        item.InternalEmail  = updated.InternalEmail  ?? item.InternalEmail;
        item.Website        = updated.Website        ?? item.Website;
        item.Address        = updated.Address        ?? item.Address;
        item.Description    = updated.Description    ?? item.Description;
        item.EstablishedYear = updated.EstablishedYear ?? item.EstablishedYear;
        item.MemberCount    = updated.MemberCount > 0 ? updated.MemberCount : item.MemberCount;
        item.Facebook       = updated.Facebook       ?? item.Facebook;
        item.Twitter        = updated.Twitter        ?? item.Twitter;
        item.Instagram      = updated.Instagram      ?? item.Instagram;
        item.LinkedIn       = updated.LinkedIn       ?? item.LinkedIn;
        item.WhatsApp       = updated.WhatsApp       ?? item.WhatsApp;
        item.Telegram       = updated.Telegram       ?? item.Telegram;
        item.YouTube        = updated.YouTube        ?? item.YouTube;
        // Ensure URLs have https://
        static string FixUrl(string? url) => string.IsNullOrEmpty(url) ? null : (!url.StartsWith("http") ? "https://" + url : url);
        item.Website  = FixUrl(item.Website);
        item.Facebook = FixUrl(item.Facebook);
        item.Twitter  = FixUrl(item.Twitter);
        item.Instagram = FixUrl(item.Instagram);
        item.LinkedIn  = FixUrl(item.LinkedIn);
        item.Telegram  = FixUrl(item.Telegram);
        item.YouTube   = FixUrl(item.YouTube);
        if (updated.BoardMembersCount.HasValue) item.BoardMembersCount = updated.BoardMembersCount;
        if (updated.GeneralAssemblyCount.HasValue) { item.GeneralAssemblyCount = updated.GeneralAssemblyCount; item.MemberCount = updated.GeneralAssemblyCount.Value; }
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var c = await _db.Chambers.FindAsync(id);
        if (c == null) return NotFound();
        // Nullify all foreign key references before deleting
        var members = await _db.Members.Where(m => m.ChamberId == id).ToListAsync();
        members.ForEach(m => m.ChamberId = null);
        var exhibitions = await _db.Exhibitions.Where(e => e.OrganizerChamberId == id).ToListAsync();
        exhibitions.ForEach(e => e.OrganizerChamberId = null);
        var conferences = await _db.Conferences.Where(c2 => c2.OrganizerChamberId == id).ToListAsync();
        conferences.ForEach(c2 => c2.OrganizerChamberId = null);
        c.Phone = null; c.Email = null;
        _db.Chambers.Remove(c);

        // Revert related submission back to pending
        var sub = await _db.Submissions
            .Where(s => s.EntityType == "chamber" && s.Status == "approved")
            .OrderByDescending(s => s.Id)
            .FirstOrDefaultAsync(s => s.FormData.Contains(c.Name));
        if (sub != null) {
            sub.Status = "pending";
            sub.ReviewNote = "تم حذف السجل — إعادة للانتظار";
            sub.ReviewedAt = null;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
    [HttpPost("{id}/upload-logo")]
    public async Task<IActionResult> UploadLogo(int id, [FromForm] IFormFile logo) {
        var item = await _db.Chambers.FindAsync(id);
        if (item == null) return NotFound();
        var uploadsDir = _storage.GetFolder("chambers");
        Directory.CreateDirectory(uploadsDir);
        var ext  = Path.GetExtension(logo.FileName).ToLower();
        var name = $"chamber_{id}{ext}";
        var path = Path.Combine(uploadsDir, name);
        using var stream = System.IO.File.Create(path);
        await logo.CopyToAsync(stream);
        item.LogoUrl = $"/uploads/chambers/{name}";
        await _db.SaveChangesAsync();
        return Ok(new { logoUrl = item.LogoUrl });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats() {
        var chamberCount = await _db.Chambers.CountAsync();
        var totalAssembly = await _db.Chambers.SumAsync(c => (int?)c.GeneralAssemblyCount) ?? 0;
        var totalMembers  = await _db.Chambers.SumAsync(c => (int?)c.MemberCount) ?? 0;
        return Ok(new { chamberCount, totalAssembly, totalMembers });
    }

    [HttpPatch("{id}/clear-contact")]
    public async Task<IActionResult> ClearContact(int id, [FromBody] ClearContactDto dto) {
        var item = await _db.Chambers.FindAsync(id);
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

