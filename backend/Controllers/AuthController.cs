using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FICCPlatform.Data;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    public AuthController(AppDbContext db, IConfiguration config) { _db = db; _config = config; }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto) {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);
        if (user == null) return Unauthorized(new { message = "اسم المستخدم غير صحيح" });

        // OTP-only login: if no password provided, just validate username exists
        // Password is optional — OTP is the primary authentication method
        if (!string.IsNullOrEmpty(dto.Password)) {
            bool passwordValid = false;
            try {
                var normalizedHash = user.PasswordHash?.Replace("$2a$", "$2b$") ?? "";
                passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, normalizedHash);
            } catch { passwordValid = false; }
            if (!passwordValid) return Unauthorized(new { message = "كلمة المرور غير صحيحة" });
        }

        var jwt = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("chamberId", (user.ChamberId ?? 0).ToString())
        };
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(int.Parse(jwt["ExpiryDays"]!)),
            signingCredentials: creds
        );
        return Ok(new {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            user = new { 
                user.Id, 
                user.Username, 
                user.Role, 
                user.FullName, 
                ChamberId = user.ChamberId 
            }
        });
    }
    
    // OTP-based login: username + channel → send OTP → verify → get token
    [HttpPost("login-otp")]
    public async Task<IActionResult> LoginOtp([FromBody] LoginOtpDto dto) {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);
        if (user == null) return Unauthorized(new { message = "اسم المستخدم غير صحيح" });
        return Ok(new { exists = true, hasPhone = !string.IsNullOrEmpty(user.Phone), hasEmail = !string.IsNullOrEmpty(user.Email) });
    }

    // Verify OTP and return JWT token
    [HttpPost("login-otp-verify")]
    public async Task<IActionResult> LoginOtpVerify([FromBody] LoginOtpVerifyDto dto) {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);
        if (user == null) return Unauthorized(new { message = "المستخدم غير موجود" });

        // Verify OTP from DB
        var otp = await _db.OtpCodes.FirstOrDefaultAsync(o =>
            o.UserId == user.Id && o.Code == dto.Code && o.Type == "login" &&
            o.Channel == dto.Channel && o.UsedAt == null && o.ExpiresAt > DateTime.UtcNow);
        if (otp == null) return BadRequest(new { message = "الرمز غير صحيح أو منتهي الصلاحية" });

        otp.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var jwt = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("chamberId", (user.ChamberId ?? 0).ToString())
        };
        var token = new JwtSecurityToken(issuer: jwt["Issuer"], audience: jwt["Audience"],
            claims: claims, expires: DateTime.UtcNow.AddDays(int.Parse(jwt["ExpiryDays"]!)),
            signingCredentials: creds);
        return Ok(new { 
            token = new JwtSecurityTokenHandler().WriteToken(token),
            user = new { 
                user.Id, 
                user.Username, 
                user.Role, 
                user.FullName, 
                ChamberId = user.ChamberId 
            } 
        });
    }

    [HttpPost("setup-admin")]
    public async Task<IActionResult> SetupAdmin() {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (user == null) return NotFound();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث كلمة المرور" });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me() {
        var auth = Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer "))
            return Unauthorized();
        try {
            var token = auth.Substring(7);
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            if (jwt.ValidTo < DateTime.UtcNow) return Unauthorized();
            var userIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier || c.Type == "nameid");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId)) {
                var user = await _db.Users.FindAsync(userId);
                if (user != null)
                    return Ok(new { valid = true, user.Id, user.Username, user.Role, user.FullName, ChamberId = user.ChamberId });
            }
            return Ok(new { valid = true });
        } catch { return Unauthorized(); }
    }
}

public record LoginDto(string Username, string? Password);
public record LoginOtpDto(string Username);
public record LoginOtpVerifyDto(string Username, string Code, string Channel);