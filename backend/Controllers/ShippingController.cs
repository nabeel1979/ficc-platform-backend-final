using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/shipping")]
public class ShippingController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    public ShippingController(AppDbContext db, FICCPlatform.Services.StorageService storage) { _db = db; _storage = storage; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? governorate, [FromQuery] string? type) {
        var q = _db.ShippingCompanies.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(s => s.CompanyName.Contains(search) || (s.Description != null && s.Description.Contains(search)));
        if (!string.IsNullOrEmpty(governorate))
            q = q.Where(s => s.Governorate == governorate);
        if (!string.IsNullOrEmpty(type))
            q = q.Where(s => s.ShippingType != null && s.ShippingType.Contains(type));
        return Ok(await q.OrderBy(s => s.CompanyName).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var item = await _db.ShippingCompanies.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ShippingCompany item) {
        _db.ShippingCompanies.Add(item); await _db.SaveChangesAsync(); return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ShippingCompany u) {
        var item = await _db.ShippingCompanies.FindAsync(id);
        if (item == null) return NotFound();
        item.CompanyName  = !string.IsNullOrEmpty(u.CompanyName) ? u.CompanyName : item.CompanyName;
        item.ShippingType = u.ShippingType  ?? item.ShippingType;
        item.Governorate  = u.Governorate   ?? item.Governorate;
        item.Address      = u.Address       ?? item.Address;
        item.Phone        = u.Phone         ?? item.Phone;
        item.Mobile       = u.Mobile        ?? item.Mobile;
        item.Email        = u.Email         ?? item.Email;
        item.Website      = u.Website       ?? item.Website;
        item.Description  = u.Description   ?? item.Description;
        item.Facebook     = u.Facebook      ?? item.Facebook;
        item.Instagram    = u.Instagram     ?? item.Instagram;
        item.WhatsApp     = u.WhatsApp      ?? item.WhatsApp;
        item.Telegram     = u.Telegram      ?? item.Telegram;
        item.YouTube      = u.YouTube       ?? item.YouTube;
        item.IsVerified   = u.IsVerified;
        item.Country      = u.Country       ?? item.Country;
        item.Status       = u.Status        ?? item.Status;
        await _db.SaveChangesAsync(); return Ok(item);
    }

    [HttpPost("{id}/upload-logo")]
    public async Task<IActionResult> UploadLogo(int id, [FromForm] IFormFile logo) {
        var item = await _db.ShippingCompanies.FindAsync(id);
        if (item == null) return NotFound();
        if (logo == null || logo.Length == 0) return BadRequest("No file");
        var dir = _storage.GetFolder("shipping");
        Directory.CreateDirectory(dir);
        var ext  = Path.GetExtension(logo.FileName).ToLowerInvariant();
        var ts   = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var name = $"shipping_{id}_{ts}{ext}";
        await using var stream = System.IO.File.Create(Path.Combine(dir, name));
        await logo.CopyToAsync(stream);
        item.LogoUrl = $"/uploads/shipping/{name}";
        await _db.SaveChangesAsync();
        return Ok(new { logoUrl = item.LogoUrl });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var item = await _db.ShippingCompanies.FindAsync(id);
        if (item == null) return NotFound();
        item.Phone = null; item.Mobile = null; item.Email = null;
        _db.ShippingCompanies.Remove(item); await _db.SaveChangesAsync(); return Ok();
    }
    [HttpPatch("{id}/clear-contact")]
    public async Task<IActionResult> ClearContact(int id, [FromBody] ClearContactDto dto) {
        var item = await _db.ShippingCompanies.FindAsync(id);
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
