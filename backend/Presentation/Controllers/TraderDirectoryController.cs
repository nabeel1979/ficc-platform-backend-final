using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TraderDirectoryController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    public TraderDirectoryController(AppDbContext db, FICCPlatform.Services.StorageService storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? businessType,
        [FromQuery] string? governorate,
        [FromQuery] bool? verifiedOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) {
        var q = _db.TraderDirectory.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(t => t.CompanyName.Contains(search) || t.OwnerName!.Contains(search) || t.TradeCategory!.Contains(search));
        if (!string.IsNullOrEmpty(category))
            q = q.Where(t => t.TradeCategory == category);
        if (!string.IsNullOrEmpty(businessType))
            q = q.Where(t => t.BusinessType == businessType);
        if (!string.IsNullOrEmpty(governorate))
            q = q.Where(t => t.Governorate == governorate);
        if (verifiedOnly == true)
            q = q.Where(t => t.IsVerified);

        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var t = await _db.TraderDirectory.FindAsync(id);
        return t == null ? NotFound() : Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> Create(TraderDirectory trader) {
        _db.TraderDirectory.Add(trader);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = trader.Id }, trader);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TraderDirectory updated) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return NotFound();
        item.CompanyName    = updated.CompanyName    ?? item.CompanyName;
        item.TradeName      = updated.TradeName      ?? item.TradeName;
        item.BusinessType   = updated.BusinessType   ?? item.BusinessType;
        item.OwnerName      = updated.OwnerName      ?? item.OwnerName;
        item.TradeCategory  = updated.TradeCategory  ?? item.TradeCategory;
        item.SubCategory    = updated.SubCategory    ?? item.SubCategory;
        item.Governorate    = updated.Governorate    ?? item.Governorate;
        item.City           = updated.City           ?? item.City;
        item.Area           = updated.Area           ?? item.Area;
        item.Address        = updated.Address        ?? item.Address;
        item.Description    = updated.Description    ?? item.Description;
        item.Phone          = updated.Phone          ?? item.Phone;
        item.Mobile         = updated.Mobile         ?? item.Mobile;
        item.Email          = updated.Email          ?? item.Email;
        item.Website        = updated.Website        ?? item.Website;
        item.LicenseNo      = updated.LicenseNo      ?? item.LicenseNo;
        item.IsVerified     = updated.IsVerified;
        if (updated.RegisteredYear.HasValue) item.RegisteredYear = updated.RegisteredYear;
        // Social
        item.Facebook  = updated.Facebook  ?? item.Facebook;
        item.Twitter   = updated.Twitter   ?? item.Twitter;
        item.Instagram = updated.Instagram ?? item.Instagram;
        item.WhatsApp  = updated.WhatsApp  ?? item.WhatsApp;
        item.Telegram  = updated.Telegram  ?? item.Telegram;
        item.YouTube   = updated.YouTube   ?? item.YouTube;
        // NOTE: LogoUrl is only updated via upload-logo endpoint
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories() {
        var cats = await _db.TraderDirectory
            .Where(t => t.TradeCategory != null)
            .Select(t => t.TradeCategory)
            .Distinct()
            .ToListAsync();
        return Ok(cats);
    }
    [HttpPost("{id}/upload-logo")]
    public async Task<IActionResult> UploadLogo(int id, [FromForm] IFormFile logo) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return NotFound();
        if (logo == null || logo.Length == 0) return BadRequest("No file");
        var ext = Path.GetExtension(logo.FileName).ToLowerInvariant();
        var name = $"trader_{id}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{ext}";
        item.LogoUrl = await _storage.SaveFileAsync(logo, "traders", name);
        await _db.SaveChangesAsync();
        return Ok(new { logoUrl = item.LogoUrl });
    }

    [HttpPost("{id}/upload-photo")]
    public async Task<IActionResult> UploadPhoto(int id, [FromForm] IFormFile photo) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return NotFound();
        if (photo == null || photo.Length == 0) return BadRequest("No file");
        var ext = Path.GetExtension(photo.FileName).ToLowerInvariant();
        var name = $"trader_photo_{id}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{ext}";
        item.PhotoUrl = await _storage.SaveFileAsync(photo, "traders", name);
        await _db.SaveChangesAsync();
        return Ok(new { photoUrl = item.PhotoUrl });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return NotFound();
        item.Phone = null; item.Mobile = null; item.Email = null;
        _db.TraderDirectory.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/clear-contact")]
    public async Task<IActionResult> ClearContact(int id, [FromBody] ClearContactDto dto) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return NotFound();
        if (dto.Field == "phone" || dto.Field == "mobile") {
            item.Phone = null;
            try { var mp = item.GetType().GetProperty("Mobile"); if (mp != null) mp.SetValue(item, null); } catch {}
        } else if (dto.Field == "email") {
            item.Email = null;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم المسح" });
    }

}
