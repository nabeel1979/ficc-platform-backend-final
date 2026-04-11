using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using System.Security.Claims;

namespace FICCPlatform.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrganizationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<OrganizationsController> _logger;

        public OrganizationsController(AppDbContext context, ILogger<OrganizationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? User.FindFirst("nameid")?.Value
                   ?? throw new UnauthorizedAccessException("User not authenticated");
            return val;
        }

        // GET /api/organizations
        [HttpGet]
        public async Task<ActionResult<List<OrganizationDto>>> GetOrganizations()
        {
            try
            {
                var userId = GetCurrentUserId();
                // جلب جهات المستخدم + الجهات المشتركة من الـ Admin
                var organizations = await _context.Organizations
                    .Where(o => o.UserId == userId || o.IsShared == true)
                    .Include(o => o.OrganizationChambers)
                    .OrderByDescending(o => o.IsShared) // المشتركة أولاً
                    .ThenByDescending(o => o.CreatedAt)
                    .ToListAsync();

                var dtos = organizations.Select(o => new OrganizationDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    Chambers = o.OrganizationChambers.Select(oc => oc.ChamberId).ToList(),
                    IsShared = o.IsShared,
                    IsOwner = o.UserId == userId,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting organizations: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في جلب الجهات" });
            }
        }

        // GET /api/organizations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<OrganizationDto>> GetOrganization(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var org = await _context.Organizations
                    .Where(o => o.Id == id && o.UserId == userId)
                    .Include(o => o.OrganizationChambers)
                    .FirstOrDefaultAsync();

                if (org == null)
                    return NotFound(new { error = "الجهة غير موجودة" });

                var dto = new OrganizationDto
                {
                    Id = org.Id,
                    Name = org.Name,
                    Chambers = org.OrganizationChambers.Select(oc => oc.ChamberId).ToList(),
                    CreatedAt = org.CreatedAt,
                    UpdatedAt = org.UpdatedAt
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting organization: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في جلب الجهة" });
            }
        }

        // POST /api/organizations
        [HttpPost]
        public async Task<ActionResult<OrganizationDto>> CreateOrganization([FromBody] CreateOrganizationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return BadRequest(new { error = "اسم الجهة مطلوب" });

                if (request.Chambers == null || request.Chambers.Count == 0)
                    return BadRequest(new { error = "يجب اختيار غرفة واحدة على الأقل" });

                var userId = GetCurrentUserId();

                // تحقق من عدم تكرار الاسم لنفس المستخدم
                var nameExists = await _context.Organizations
                    .AnyAsync(o => o.UserId == userId && o.Name.ToLower() == request.Name.Trim().ToLower());
                if (nameExists)
                    return BadRequest(new { error = "اسم الجهة موجود مسبقاً - اختر اسماً مختلفاً" });

                var org = new Organization
                {
                    UserId = userId,
                    Name = request.Name.Trim(),
                    IsShared = request.IsShared,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Organizations.Add(org);
                await _context.SaveChangesAsync();

                // Add chambers
                foreach (var chamberId in request.Chambers)
                {
                    var orgChamber = new OrganizationChamber
                    {
                        OrganizationId = org.Id,
                        ChamberId = chamberId
                    };
                    _context.OrganizationChambers.Add(orgChamber);
                }

                await _context.SaveChangesAsync();

                var dto = new OrganizationDto
                {
                    Id = org.Id,
                    Name = org.Name,
                    Chambers = request.Chambers,
                    CreatedAt = org.CreatedAt
                };

                return CreatedAtAction(nameof(GetOrganization), new { id = org.Id }, dto);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating organization: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في إضافة الجهة" });
            }
        }

        // PUT /api/organizations/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<OrganizationDto>> UpdateOrganization(long id, [FromBody] UpdateOrganizationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return BadRequest(new { error = "اسم الجهة مطلوب" });

                if (request.Chambers == null || request.Chambers.Count == 0)
                    return BadRequest(new { error = "يجب اختيار غرفة واحدة على الأقل" });

                var userId = GetCurrentUserId();
                var org = await _context.Organizations
                    .Where(o => o.Id == id && o.UserId == userId)
                    .Include(o => o.OrganizationChambers)
                    .FirstOrDefaultAsync();

                if (org == null)
                    return NotFound(new { error = "الجهة غير موجودة" });

                org.Name = request.Name.Trim();
                org.UpdatedAt = DateTime.UtcNow;

                // Remove old chambers
                _context.OrganizationChambers.RemoveRange(org.OrganizationChambers);

                // Add new chambers
                foreach (var chamberId in request.Chambers)
                {
                    var orgChamber = new OrganizationChamber
                    {
                        OrganizationId = org.Id,
                        ChamberId = chamberId
                    };
                    _context.OrganizationChambers.Add(orgChamber);
                }

                await _context.SaveChangesAsync();

                var dto = new OrganizationDto
                {
                    Id = org.Id,
                    Name = org.Name,
                    Chambers = request.Chambers,
                    CreatedAt = org.CreatedAt,
                    UpdatedAt = org.UpdatedAt
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating organization: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في تحديث الجهة" });
            }
        }

        // DELETE /api/organizations/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteOrganization(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var org = await _context.Organizations
                    .Where(o => o.Id == id && o.UserId == userId)
                    .FirstOrDefaultAsync();

                if (org == null)
                    return NotFound(new { error = "الجهة غير موجودة" });

                _context.Organizations.Remove(org);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting organization: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في حذف الجهة" });
            }
        }

        // GET /api/organizations/{id}/chambers
        [HttpGet("{id}/chambers")]
        public async Task<ActionResult<List<ChamberDto>>> GetOrganizationChambers(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var org = await _context.Organizations
                    .Where(o => o.Id == id && o.UserId == userId)
                    .Include(o => o.OrganizationChambers)
                    .ThenInclude(oc => oc.Chamber)
                    .FirstOrDefaultAsync();

                if (org == null)
                    return NotFound(new { error = "الجهة غير موجودة" });

                var chambers = org.OrganizationChambers
                    .Select(oc => new ChamberDto
                    {
                        Id = oc.Chamber.Id,
                        Name = oc.Chamber.Name
                    })
                    .ToList();

                return Ok(chambers);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting organization chambers: {ex.Message}");
                return StatusCode(500, new { error = "خطأ في جلب الغرف" });
            }
        }
    }

    // Simple DTO for chambers
    public class ChamberDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
