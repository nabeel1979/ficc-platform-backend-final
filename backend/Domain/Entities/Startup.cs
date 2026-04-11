public class Startup {
    public List<StartupAttachment> Attachments { get; set; } = new();
    public int Id { get; set; }
    public string Name { get; set; } = "";           // اسم المشروع
    public string? Description { get; set; }          // وصف الفكرة
    public string OwnerName { get; set; } = "";       // صاحب المشروع
    public string? OwnerEmail { get; set; }
    public string? OwnerPhone { get; set; }
    public string Sector { get; set; } = "";          // القطاع
    public string? FundingNeeded { get; set; }        // التمويل المطلوب
    public string? OwnerBirthdate { get; set; }        // تاريخ الميلاد
    public string? OwnerGender { get; set; }           // الجنس
    public string? Stage { get; set; } = "فكرة";     // المرحلة
    public string? LogoUrl { get; set; }
    public string Status { get; set; } = "pending";  // pending | approved | rejected
    public string? AdminNotes { get; set; }
    public int? ChamberId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}

public class StartupAttachment {
    public int Id { get; set; }
    public int StartupId { get; set; }
    public string FileName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
