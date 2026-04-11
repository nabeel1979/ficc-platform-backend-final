namespace FICCPlatform.Domain.Entities;

/// <summary>
/// الهيكل التنظيمي للاتحاد
/// </summary>
public class OrganizationalStructure
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;  // e.g., "إدارة الدورات", "إدارة الأخبار"
    public string NameEn { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ParentId { get; set; }  // For nested structure
    public OrganizationalStructure? Parent { get; set; }
    public ICollection<OrganizationalStructure> Children { get; set; } = new List<OrganizationalStructure>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// الصفحات المتاحة في المنيو
/// </summary>
public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;  // e.g., "الأخبار", "الدورات"
    public string NameEn { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;  // e.g., "/admin/news"
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<UserPermission> Permissions { get; set; } = new List<UserPermission>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// أنواع الإجراءات (CRUD)
/// </summary>
public enum PermissionAction
{
    Create = 1,  // إضافة
    Read = 2,    // قراءة
    Update = 3,  // تعديل
    Delete = 4   // حذف
}

/// <summary>
/// صلاحيات المستخدم لكل صفحة
/// </summary>
public class UserPermission
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    
    public int MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }
    
    // CRUD Permissions
    public bool CanCreate { get; set; } = false;
    public bool CanRead { get; set; } = false;
    public bool CanUpdate { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Unique constraint: one user can have one permission set per menu item
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Audit log for permission changes
/// </summary>
public class PermissionAuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    
    public int? TargetUserId { get; set; }  // Who's permissions were changed
    public string? TargetUserName { get; set; }
    
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    
    public string Action { get; set; } = string.Empty;  // "CREATE", "UPDATE", "DELETE"
    public string Changes { get; set; } = string.Empty;  // JSON of what changed
    
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = string.Empty;
}
