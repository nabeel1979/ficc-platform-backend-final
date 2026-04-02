namespace FICCPlatform.Models;

public class CustomsAgent {
    public int Id { get; set; }
    public string AgentName { get; set; } = "";
    public string? CompanyName { get; set; }
    public string? LicenseNo { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public string? Governorate { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Specializations { get; set; }
    public string? CustomsPorts { get; set; }
    public int? YearsExperience { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Lawyer {
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string? LicenseNo { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public string? BarAssociation { get; set; }
    public string? Governorate { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Specializations { get; set; }
    public int? YearsExperience { get; set; }
    public string? Education { get; set; }
    public string? Languages { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public bool AcceptsOnlineConsultation { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DirectoryReview {
    public int Id { get; set; }
    public string EntityType { get; set; } = "";
    public int EntityId { get; set; }
    public string? ReviewerName { get; set; }
    public string? ReviewerPhone { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ConsultationRequest {
    public int Id { get; set; }
    public int? LawyerId { get; set; }
    public Lawyer? Lawyer { get; set; }
    public int? AgentId { get; set; }
    public CustomsAgent? Agent { get; set; }
    public string RequesterName { get; set; } = "";
    public string RequesterPhone { get; set; } = "";
    public string? RequesterEmail { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public DateTime? PreferredDate { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
