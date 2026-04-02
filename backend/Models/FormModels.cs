namespace FICCPlatform.Models;

public class Form {
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public int? CreatedBy { get; set; }
    public int? ChamberId { get; set; }
    public Chamber? Chamber { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsPublic { get; set; } = true;
    public bool AllowAnonymous { get; set; } = false;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? MaxResponses { get; set; }
    public int ResponseCount { get; set; } = 0;
    public string? ShareToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<FormField> Fields { get; set; } = new List<FormField>();
    public ICollection<FormResponse> Responses { get; set; } = new List<FormResponse>();
}

public class FormField {
    public int Id { get; set; }
    public int FormId { get; set; }
    public Form? Form { get; set; }
    public int FieldOrder { get; set; }
    public string Label { get; set; } = "";
    public string FieldType { get; set; } = "text";
    public bool IsRequired { get; set; } = false;
    public string? Placeholder { get; set; }
    public string? HelpText { get; set; }
    public string? Options { get; set; }  // JSON
    public string? Validation { get; set; }  // JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FormResponse {
    public int Id { get; set; }
    public int FormId { get; set; }
    public Form? Form { get; set; }
    public string? RespondentName { get; set; }
    public string? RespondentPhone { get; set; }
    public string? RespondentEmail { get; set; }
    public int? MemberId { get; set; }
    public Member? Member { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string Status { get; set; } = "Submitted";
    public ICollection<FormAnswer> Answers { get; set; } = new List<FormAnswer>();
}

public class FormAnswer {
    public int Id { get; set; }
    public int ResponseId { get; set; }
    public FormResponse? Response { get; set; }
    public int FieldId { get; set; }
    public FormField? Field { get; set; }
    public string? Answer { get; set; }
    public string? FileUrl { get; set; }
}

public class FormTemplate {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Category { get; set; }
    public string? Description { get; set; }
    public string? FieldsJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
