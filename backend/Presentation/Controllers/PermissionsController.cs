using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FICCPlatform.Application.Services;
using FICCPlatform.Application.DTOs;
using FICCPlatform.Common.Utilities;
using System.Security.Claims;

namespace FICCPlatform.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly ILogger<PermissionsController> _logger;

    public PermissionsController(IPermissionService permissionService, ILogger<PermissionsController> logger)
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all organizational structures
    /// </summary>
    [HttpGet("organizational-structures")]
    public async Task<IActionResult> GetOrganizationalStructures()
    {
        try
        {
            var structures = await _permissionService.GetAllOrganizationalStructuresAsync();
            return Ok(ApiResponse<List<OrganizationalStructureDto>>.SuccessResponse(
                structures,
                "الهياكل التنظيمية جلبت بنجاح"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching organizational structures");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }

    /// <summary>
    /// Get all menu items (pages)
    /// </summary>
    [HttpGet("menu-items")]
    public async Task<IActionResult> GetMenuItems()
    {
        try
        {
            var items = await _permissionService.GetAllMenuItemsAsync();
            return Ok(ApiResponse<List<MenuItemDto>>.SuccessResponse(
                items,
                "عناصر القائمة جلبت بنجاح"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching menu items");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }

    /// <summary>
    /// Get all permissions for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserPermissions(int userId)
    {
        try
        {
            var permissions = await _permissionService.GetUserPermissionsAsync(userId);
            if (permissions == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("المستخدم غير موجود"));
            }

            return Ok(ApiResponse<UserPermissionsGridDto>.SuccessResponse(
                permissions,
                "صلاحيات المستخدم جلبت بنجاح"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user permissions");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }

    /// <summary>
    /// Assign/Update permissions for a user
    /// </summary>
    [HttpPost("assign")]
    [Authorize(Roles = "Admin")]  // Only admins can assign permissions
    public async Task<IActionResult> AssignPermissions(AssignPermissionsRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("البيانات غير صحيحة"));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            if (!int.TryParse(userId, out var changedByUserId))
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("لم يتم التحقق من الهوية"));
            }

            var result = await _permissionService.AssignPermissionsAsync(
                request.UserId,
                request,
                changedByUserId,
                ipAddress
            );

            if (!result)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("فشل تعيين الصلاحيات"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                "تم تعيين الصلاحيات بنجاح"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning permissions");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }

    /// <summary>
    /// Get permission audit logs
    /// </summary>
    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int? userId = null, [FromQuery] int limit = 100)
    {
        try
        {
            var logs = await _permissionService.GetPermissionAuditLogsAsync(userId, limit);
            return Ok(ApiResponse<List<PermissionAuditLogDto>>.SuccessResponse(
                logs,
                "سجلات التدقيق جلبت بنجاح"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching audit logs");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }

    /// <summary>
    /// Check if user has permission for an action
    /// </summary>
    [HttpPost("check")]
    public async Task<IActionResult> CheckPermission(int userId, int menuItemId, string action)
    {
        try
        {
            var hasPermission = await _permissionService.UserHasPermissionAsync(userId, menuItemId, action);
            return Ok(ApiResponse<bool>.SuccessResponse(
                hasPermission,
                hasPermission ? "المستخدم لديه الصلاحية" : "المستخدم لا يملك الصلاحية"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking permission");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("خطأ في الخادم"));
        }
    }
}
