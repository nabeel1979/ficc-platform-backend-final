using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FormsController : ControllerBase {
    private readonly AppDbContext _db;
    public FormsController(AppDbContext db) => _db = db;

    // GET /api/forms - List all forms
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int? chamberId) {
        var q = _db.Forms.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(f => f.Status == status);
        if (chamberId.HasValue) q = q.Where(f => f.ChamberId == chamberId);
        return Ok(await q.OrderByDescending(f => f.CreatedAt).ToListAsync());
    }

    // GET /api/forms/{id} - Get form with fields
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id) {
        var form = await _db.Forms
            .Include(f => f.Fields.OrderBy(ff => ff.FieldOrder))
            .FirstOrDefaultAsync(f => f.Id == id);
        return form == null ? NotFound() : Ok(form);
    }

    // GET /api/forms/share/{token} - Get form by share token (public)
    [HttpGet("share/{token}")]
    public async Task<IActionResult> GetByToken(string token) {
        var form = await _db.Forms
            .Include(f => f.Fields.OrderBy(ff => ff.FieldOrder))
            .FirstOrDefaultAsync(f => f.ShareToken == token && f.Status == "Active");
        if (form == null) return NotFound(new { message = "الاستمارة غير موجودة أو منتهية" });
        if (form.EndDate.HasValue && form.EndDate < DateTime.UtcNow)
            return BadRequest(new { message = "انتهت فترة الاستمارة" });
        return Ok(form);
    }

    // POST /api/forms - Create form
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormDto dto) {
        var token = Guid.NewGuid().ToString("N")[..12].ToUpper();
        var form = new Form {
            Title = dto.Title,
            Description = dto.Description,
            ChamberId = dto.ChamberId,
            IsPublic = dto.IsPublic,
            AllowAnonymous = dto.AllowAnonymous,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxResponses = dto.MaxResponses,
            ShareToken = token,
            Status = "Active"
        };
        _db.Forms.Add(form);
        await _db.SaveChangesAsync();

        // Add fields
        for (int i = 0; i < dto.Fields.Count; i++) {
            var f = dto.Fields[i];
            _db.FormFields.Add(new FormField {
                FormId = form.Id,
                FieldOrder = i + 1,
                Label = f.Label,
                FieldType = f.FieldType,
                IsRequired = f.IsRequired,
                Placeholder = f.Placeholder,
                HelpText = f.HelpText,
                Options = f.Options,
                Validation = f.Validation
            });
        }
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = form.Id }, form);
    }

    // POST /api/forms/{id}/submit - Submit response
    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id, [FromBody] SubmitResponseDto dto) {
        var form = await _db.Forms.Include(f => f.Fields).FirstOrDefaultAsync(f => f.Id == id);
        if (form == null) return NotFound();
        if (form.Status != "Active") return BadRequest(new { message = "الاستمارة مغلقة" });
        if (form.MaxResponses.HasValue && form.ResponseCount >= form.MaxResponses)
            return BadRequest(new { message = "اكتملت الاستمارة" });

        // Validate required fields
        var requiredFields = form.Fields.Where(f => f.IsRequired).Select(f => f.Id).ToList();
        var answeredFields = dto.Answers.Select(a => a.FieldId).ToList();
        var missing = requiredFields.Except(answeredFields).ToList();
        if (missing.Any()) return BadRequest(new { message = "يرجى ملء جميع الحقول المطلوبة", missingFields = missing });

        var response = new FormResponse {
            FormId = id,
            RespondentName = dto.RespondentName,
            RespondentPhone = dto.RespondentPhone,
            RespondentEmail = dto.RespondentEmail,
            MemberId = dto.MemberId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        };
        _db.FormResponses.Add(response);
        await _db.SaveChangesAsync();

        foreach (var ans in dto.Answers) {
            _db.FormAnswers.Add(new FormAnswer {
                ResponseId = response.Id,
                FieldId = ans.FieldId,
                Answer = ans.Answer,
                FileUrl = ans.FileUrl
            });
        }

        form.ResponseCount++;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال الاستمارة بنجاح", responseId = response.Id });
    }

    // GET /api/forms/{id}/responses - Get all responses (admin)
    [HttpGet("{id}/responses")]
    public async Task<IActionResult> GetResponses(int id) {
        var responses = await _db.FormResponses
            .Include(r => r.Answers)
            .Where(r => r.FormId == id)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
        return Ok(responses);
    }

    // GET /api/forms/templates - Get form templates
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates() {
        return Ok(await _db.FormTemplates.ToListAsync());
    }
}

// DTOs
public record CreateFormDto(
    string Title, string? Description, int? ChamberId,
    bool IsPublic, bool AllowAnonymous,
    DateTime? StartDate, DateTime? EndDate, int? MaxResponses,
    List<FieldDto> Fields
);

public record FieldDto(
    string Label, string FieldType, bool IsRequired,
    string? Placeholder, string? HelpText, string? Options, string? Validation
);

public record SubmitResponseDto(
    string? RespondentName, string? RespondentPhone, string? RespondentEmail,
    int? MemberId, List<AnswerDto> Answers
);

public record AnswerDto(int FieldId, string? Answer, string? FileUrl);
