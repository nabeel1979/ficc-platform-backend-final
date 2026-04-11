namespace FICCPlatform.Models;

public class CourseMedia {
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Type { get; set; } = "image";
    public string Url { get; set; } = "";
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual EntrepreneurCourse? Course { get; set; }
}

public class CourseMediaDto {
    public string Type { get; set; } = "image";
    public string Url { get; set; } = "";
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
}
