using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase {
    private readonly AppDbContext _db;
    public SettingsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() {
        var list = await _db.Settings.ToListAsync();
        var dict = list.ToDictionary(s => s.SettingKey, s => s.SettingValue);
        return Ok(dict);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateAll([FromBody] Dictionary<string, string> updates) {
        foreach (var kv in updates) {
            var s = await _db.Settings.FirstOrDefaultAsync(x => x.SettingKey == kv.Key);
            if (s != null) { s.SettingValue = kv.Value; s.UpdatedAt = DateTime.UtcNow; }
            else _db.Settings.Add(new Setting { SettingKey = kv.Key, SettingValue = kv.Value });
        }
        await _db.SaveChangesAsync();
        return Ok();
    }
}
