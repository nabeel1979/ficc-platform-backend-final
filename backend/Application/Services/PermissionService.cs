using FICCPlatform.Domain.Entities;
using FICCPlatform.Application.DTOs;
using FICCPlatform.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FICCPlatform.Application.Services;

public interface IPermissionService
{
    Task<List<OrganizationalStructureDto>> GetAllOrganizationalStructuresAsync();
    Task<List<MenuItemDto>> GetAllMenuItemsAsync();
    Task<UserPermissionsGridDto?> GetUserPermissionsAsync(int userId);
    Task<bool> AssignPermissionsAsync(int userId, AssignPermissionsRequest request, int changedByUserId, string ipAddress);
    Task<List<PermissionAuditLogDto>> GetPermissionAuditLogsAsync(int? userId = null, int limit = 100);
    Task<bool> UserHasPermissionAsync(int userId, int menuItemId, string action);
}

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _db;
    private readonly ILogger<PermissionService> _logger;

    public PermissionService(AppDbContext db, ILogger<PermissionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<OrganizationalStructureDto>> GetAllOrganizationalStructuresAsync()
    {
        var structures = await _db.Set<OrganizationalStructure>()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new OrganizationalStructureDto
            {
                Id = x.Id,
                Name = x.Name,
                NameEn = x.NameEn,
                Description = x.Description,
                ParentId = x.ParentId,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return structures;
    }

    public async Task<List<MenuItemDto>> GetAllMenuItemsAsync()
    {
        var items = await _db.Set<MenuItem>()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Order)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                NameEn = x.NameEn,
                Icon = x.Icon,
                Route = x.Route,
                Order = x.Order,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return items;
    }

    public async Task<UserPermissionsGridDto?> GetUserPermissionsAsync(int userId)
    {
        var user = await _db.Set<User>()
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return null;

        var permissions = await _db.Set<UserPermission>()
            .Where(p => p.UserId == userId && p.IsActive)
            .Include(p => p.MenuItem)
            .ToListAsync();

        var grid = new UserPermissionsGridDto
        {
            UserId = userId,
            UserName = user.FullName ?? user.Username,
            OrganizationalStructureId = user.OrganizationalStructureId,
            Permissions = new()
        };

        foreach (var perm in permissions)
        {
            grid.Permissions[perm.MenuItemId] = new UserPermissionDto
            {
                Id = perm.Id,
                MenuItemId = perm.MenuItemId,
                MenuItemName = perm.MenuItem?.Name ?? "",
                CanCreate = perm.CanCreate,
                CanRead = perm.CanRead,
                CanUpdate = perm.CanUpdate,
                CanDelete = perm.CanDelete,
                IsActive = perm.IsActive
            };
        }

        return grid;
    }

    public async Task<bool> AssignPermissionsAsync(int userId, AssignPermissionsRequest request, int changedByUserId, string ipAddress)
    {
        try
        {
            var user = await _db.Set<User>().FindAsync(userId);
            if (user == null) return false;

            // Update organizational structure
            if (request.OrganizationalStructureId.HasValue)
            {
                user.OrganizationalStructureId = request.OrganizationalStructureId;
            }

            // Get all menu items
            var allMenuItems = await _db.Set<MenuItem>()
                .Where(m => m.IsActive)
                .ToListAsync();

            // Get existing permissions
            var existingPerms = await _db.Set<UserPermission>()
                .Where(p => p.UserId == userId)
                .ToDictionaryAsync(p => p.MenuItemId);

            // Update or create permissions
            foreach (var menuItem in allMenuItems)
            {
                var hasRequest = request.MenuPermissions.TryGetValue(menuItem.Id, out var flags);

                if (existingPerms.TryGetValue(menuItem.Id, out var existing))
                {
                    // Update existing
                    var oldPerm = JsonSerializer.Serialize(new { existing.CanCreate, existing.CanRead, existing.CanUpdate, existing.CanDelete });
                    
                    existing.CanCreate = hasRequest && flags.Create;
                    existing.CanRead = hasRequest && flags.Read;
                    existing.CanUpdate = hasRequest && flags.Update;
                    existing.CanDelete = hasRequest && flags.Delete;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.IsActive = hasRequest;

                    var newPerm = JsonSerializer.Serialize(new { existing.CanCreate, existing.CanRead, existing.CanUpdate, existing.CanDelete });
                    
                    if (oldPerm != newPerm)
                    {
                        LogAudit(changedByUserId, userId, menuItem.Id, "UPDATE", oldPerm, newPerm, ipAddress);
                    }
                }
                else if (hasRequest)
                {
                    // Create new
                    var newUserPerm = new UserPermission
                    {
                        UserId = userId,
                        MenuItemId = menuItem.Id,
                        CanCreate = flags.Create,
                        CanRead = flags.Read,
                        CanUpdate = flags.Update,
                        CanDelete = flags.Delete,
                        IsActive = true
                    };

                    _db.Set<UserPermission>().Add(newUserPerm);
                    LogAudit(changedByUserId, userId, menuItem.Id, "CREATE", "", JsonSerializer.Serialize(flags), ipAddress);
                }
            }

            _db.Set<User>().Update(user);
            await _db.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning permissions to user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> UserHasPermissionAsync(int userId, int menuItemId, string action)
    {
        var permission = await _db.Set<UserPermission>()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.MenuItemId == menuItemId && p.IsActive);

        if (permission == null) return false;

        return action.ToLower() switch
        {
            "create" => permission.CanCreate,
            "read" => permission.CanRead,
            "update" => permission.CanUpdate,
            "delete" => permission.CanDelete,
            _ => false
        };
    }

    public async Task<List<PermissionAuditLogDto>> GetPermissionAuditLogsAsync(int? userId = null, int limit = 100)
    {
        var query = _db.Set<PermissionAuditLog>().AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(l => l.TargetUserId == userId);
        }

        var logs = await query
            .OrderByDescending(l => l.ChangedAt)
            .Take(limit)
            .Select(l => new PermissionAuditLogDto
            {
                Id = l.Id,
                UserName = l.UserName,
                TargetUserName = l.TargetUserName,
                MenuItemName = l.MenuItemName,
                Action = l.Action,
                Changes = l.Changes,
                ChangedAt = l.ChangedAt,
                IpAddress = l.IpAddress
            })
            .ToListAsync();

        return logs;
    }

    private void LogAudit(int changedByUserId, int? targetUserId, int menuItemId, string action, string oldValue, string newValue, string ipAddress)
    {
        var changedByUser = _db.Set<User>().FirstOrDefault(u => u.Id == changedByUserId);
        var targetUser = targetUserId.HasValue ? _db.Set<User>().FirstOrDefault(u => u.Id == targetUserId) : null;
        var menuItem = _db.Set<MenuItem>().FirstOrDefault(m => m.Id == menuItemId);

        var log = new PermissionAuditLog
        {
            UserId = changedByUserId,
            UserName = changedByUser?.FullName ?? changedByUser?.Username ?? "Unknown",
            TargetUserId = targetUserId,
            TargetUserName = targetUser?.FullName ?? targetUser?.Username,
            MenuItemId = menuItemId,
            MenuItemName = menuItem?.Name ?? "Unknown",
            Action = action,
            Changes = $"Old: {oldValue} | New: {newValue}",
            ChangedAt = DateTime.UtcNow,
            IpAddress = ipAddress
        };

        _db.Set<PermissionAuditLog>().Add(log);
    }
}
