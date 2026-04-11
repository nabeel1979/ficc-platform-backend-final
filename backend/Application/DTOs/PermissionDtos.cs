namespace FICCPlatform.Application.DTOs;

/// <summary>
/// DTO for OrganizationalStructure
/// </summary>
public class OrganizationalStructureDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for MenuItem
/// </summary>
public class MenuItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for User Permissions (single permission set)
/// </summary>
public class UserPermissionDto
{
    public int Id { get; set; }
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public bool CanCreate { get; set; }
    public bool CanRead { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO for all user permissions (dashboard view)
/// </summary>
public class UserPermissionsGridDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? OrganizationalStructureId { get; set; }
    public string? OrganizationalStructureName { get; set; }
    
    // Key: MenuItemId, Value: permissions
    public Dictionary<int, UserPermissionDto> Permissions { get; set; } = new();
}

/// <summary>
/// DTO for assigning permissions (bulk update)
/// </summary>
public class AssignPermissionsRequest
{
    public int UserId { get; set; }
    public int? OrganizationalStructureId { get; set; }
    
    // Key: MenuItemId, Value: {create, read, update, delete}
    public Dictionary<int, PermissionFlags> MenuPermissions { get; set; } = new();
}

/// <summary>
/// Simple permission flags
/// </summary>
public class PermissionFlags
{
    public bool Create { get; set; }
    public bool Read { get; set; }
    public bool Update { get; set; }
    public bool Delete { get; set; }
}

/// <summary>
/// DTO for permission audit log
/// </summary>
public class PermissionAuditLogDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? TargetUserName { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Changes { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
}
