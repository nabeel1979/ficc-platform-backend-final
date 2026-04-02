using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase {
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) {
        // فحص هل المستخدم الحالي SuperAdmin
        var callerUsername = User.Identity?.Name ?? 
            Request.Headers["Authorization"].ToString()
                .Replace("Bearer ", "");
        
        // جلب دور المستخدم الحالي من الـ JWT Claims
        var callerRole = User.Claims.FirstOrDefault(c => c.Type == "role" || c.Type.EndsWith("/role"))?.Value ?? "";
        bool isSuperAdmin = callerRole == "SuperAdmin";

        var query = _db.Users.AsQueryable();

        // أخفي حسابات SuperAdmin من غير SuperAdmin
        if (!isSuperAdmin) {
            query = query.Where(u => u.Role != "SuperAdmin");
        }

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Username.Contains(search) || (u.FullName != null && u.FullName.Contains(search)) || (u.Email != null && u.Email.Contains(search)));
        var total = await query.CountAsync();
        var users = await query
            .Select(u => new { u.Id, u.Username, u.FullName, u.Email, u.Phone, u.Role, u.IsActive, u.CreatedAt, u.ChamberId })
            .Skip((page-1)*pageSize).Take(pageSize)
            .ToListAsync();
        return Ok(new { total, page, pageSize, items = users });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto) {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest(new { message = "اسم المستخدم موجود مسبقاً" });
        if (!string.IsNullOrEmpty(dto.Email) && await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "البريد الإلكتروني مستخدم مسبقاً" });
        if (!string.IsNullOrEmpty(dto.Phone) && await _db.Users.AnyAsync(u => u.Phone == dto.Phone))
            return BadRequest(new { message = "رقم الهاتف مستخدم مسبقاً" });
        var user = new User {
            Username     = dto.Username,
            FullName     = dto.FullName,
            Email        = dto.Email,
            Phone        = dto.Phone,
            Role         = dto.Role ?? "Member",
            IsActive     = true,
            IsEmailVerified = false,
            IsFirstLogin = true,
            // No password required — OTP-based login
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            CreatedAt    = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.Username, user.Role, user.FullName });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto) {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        // Check uniqueness (exclude current user)
        if (!string.IsNullOrEmpty(dto.Email) && await _db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
            return BadRequest(new { message = "البريد الإلكتروني مستخدم من قبل مستخدم آخر" });
        if (!string.IsNullOrEmpty(dto.Phone) && await _db.Users.AnyAsync(u => u.Phone == dto.Phone && u.Id != id))
            return BadRequest(new { message = "رقم الهاتف مستخدم من قبل مستخدم آخر" });
        user.FullName = dto.FullName ?? user.FullName;
        user.Email    = dto.Email    ?? user.Email;
        user.Phone    = dto.Phone    ?? user.Phone;
        user.Role     = dto.Role     ?? user.Role;
        user.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.Username, user.Role, user.FullName, user.IsActive });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (user.Role == "Admin" && await _db.Users.CountAsync(u => u.Role == "Admin") <= 1)
            return BadRequest(new { message = "لا يمكن حذف آخر مدير" });
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id) {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { user.IsActive });
    }
    [HttpPatch("{id}/clear-contact")]
    public async Task<IActionResult> ClearContact(int id, [FromBody] ClearContactDto dto) {
        var item = await _db.Users.FindAsync(id);
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

public record CreateUserDto(string Username, string? FullName, string? Email, string? Phone, string? Role);
public record UpdateUserDto(string? FullName, string? Email, string? Phone, string? Role, bool IsActive);
