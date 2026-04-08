namespace FICCPlatform.Models;

public class EntrepreneurCourse {
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Speaker { get; set; }
    public string? SpeakerTitle { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxParticipants { get; set; } = 50;
    public int CurrentParticipants { get; set; } = 0;
    public string Status { get; set; } = "upcoming";
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; } = 0;
    public bool IsFree { get; set; } = true;
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }
}

public class CourseApplication {
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Motivation { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
