using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;
using FICCPlatform.Models;
using FICCPlatform.Services;
using System.Text.Json;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/correspondence")]
[Authorize]
public class CorrespondenceController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    private readonly NotificationService _notify;
    private readonly ILogger<CorrespondenceController> _log;

    public CorrespondenceController(AppDbContext db, FICCPlatform.Services.StorageService storage, NotificationService notify, ILogger<CorrespondenceController> log) {
        _db = db; _storage = storage; _notify = notify; _log = log;
    }

    // GET: Inbox for a chamber
    [HttpGet("inbox/{chamberId}")]
    public async Task<IActionResult> Inbox(int chamberId, [FromQuery] bool unreadOnly = false) {
        var q = _db.CorrespondenceRecipients
            .Include(r => r.Correspondence).ThenInclude(c => c.Attachments)
            .Include(r => r.Correspondence).ThenInclude(c => c.Recipients)
            .Where(r => r.ChamberId == chamberId && r.Correspondence.Status == "sent");
        if (unreadOnly) q = q.Where(r => r.ReadAt == null);
        var items = await q.OrderByDescending(r => r.Correspondence.SentAt).ToListAsync();
        return Ok(items.Select(r => new {
            r.Correspondence.Id, r.Correspondence.ReferenceNumber,
            r.Correspondence.Subject, r.Correspondence.Priority,
            r.Correspondence.SentAt, r.Correspondence.SenderName,
            r.ReadAt, AttachmentsCount = r.Correspondence.Attachments.Count,
            Recipients = r.Correspondence.Recipients.Select(rc => new { rc.ChamberId, rc.ChamberName })
        }));
    }

    // GET: Sent by chamber
    [HttpGet("sent/{chamberId}")]
    public async Task<IActionResult> Sent(int chamberId) {
        var items = await _db.Correspondences
            .Include(c => c.Recipients).Include(c => c.Attachments)
            .Where(c => c.SenderId == chamberId && c.Status == "sent")
            .OrderByDescending(c => c.SentAt).ToListAsync();
        return Ok(items.Select(c => new {
            c.Id, c.ReferenceNumber, c.Subject, c.Priority, c.SentAt,
            RecipientsCount = c.Recipients.Count, AttachmentsCount = c.Attachments.Count
        }));
    }

    // GET: Drafts
    [HttpGet("drafts/{chamberId}")]
    [AllowAnonymous]
    public async Task<IActionResult> Drafts(int chamberId) {
        var items = await _db.Correspondences
            .Include(c => c.Recipients)
            .Include(c => c.Attachments)
            .Where(c => c.SenderId == chamberId && c.Status == "draft")
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new {
                c.Id,
                c.Subject,
                c.Body,
                c.Priority,
                c.Status,
                c.SenderId,
                c.CreatedAt,
                c.SentAt,
                Recipients = c.Recipients.Select(r => new { r.ChamberId, r.ChamberName }).ToList(),
                AttachmentsCount = c.Attachments.Count
            }).ToListAsync();
        return Ok(items);
    }

    // GET: Full letter
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id, [FromQuery] int viewerId = 0) {
        var item = await _db.Correspondences
            .Include(c => c.Recipients)
            .Include(c => c.Attachments)
            .Include(c => c.Replies)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (item == null) return NotFound();
        // Mark as read
        if (viewerId > 0) {
            var r = item.Recipients.FirstOrDefault(r => r.ChamberId == viewerId);
            if (r != null && r.ReadAt == null) {
                r.ReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
        return Ok(item);
    }

    // POST: Create/Save draft
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCorrespondenceDto dto) {
        // Auto-generate reference number
        var year = DateTime.UtcNow.Year;
        var count = await _db.Correspondences.CountAsync(c => c.CreatedAt.Year == year) + 1;
        var refNum = $"{year}/FICC/{count:D3}";

        var letter = new Correspondence {
            ReferenceNumber = refNum,
            Subject = dto.Subject,
            Body = dto.Body,
            SenderId = dto.SenderId,
            SenderName = dto.SenderName,
            Priority = dto.Priority ?? "normal",
            Status = dto.SendNow ? "sent" : "draft",
            SentAt = dto.SendNow ? DateTime.UtcNow : null,
        };
        _db.Correspondences.Add(letter);
        await _db.SaveChangesAsync();

        // Add recipients
        foreach (var rec in dto.Recipients ?? new()) {
            _db.CorrespondenceRecipients.Add(new CorrespondenceRecipient {
                CorrespondenceId = letter.Id,
                ChamberId = rec.ChamberId,
                ChamberName = rec.ChamberName
            });
            // Create notification
            if (dto.SendNow) {
                _db.CorrespondenceNotifications.Add(new CorrespondenceNotification {
                    ChamberId = rec.ChamberId,
                    ChamberName = rec.ChamberName,
                    CorrespondenceId = letter.Id,
                    Type = dto.Priority == "urgent" ? "urgent" : "new_letter",
                    Title = $"كتاب جديد: {dto.Subject}"
                });
            }
        }
        await _db.SaveChangesAsync();

        // Send email notifications if sent now
        if (dto.SendNow) {
            _ = Task.Run(async () => {
                foreach (var rec in dto.Recipients ?? new()) {
                    try {
                        var chamber = await _db.Chambers.FindAsync(rec.ChamberId);
                        var email = chamber?.InternalEmail ?? chamber?.Email;
                        if (!string.IsNullOrEmpty(email)) {
                            var priorityLabel = dto.Priority == "urgent" ? "🔴 عاجل" : dto.Priority == "secret" ? "🔒 سري" : "📄 عادي";
                            var html = $@"
<div dir='rtl' style='font-family:Cairo,sans-serif;max-width:600px;margin:0 auto;background:#f5f7fa;padding:20px;border-radius:16px'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px'>
    <h2 style='color:#fff;margin:0'>📨 كتاب رسمي جديد</h2>
    <p style='color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px'>اتحاد الغرف التجارية العراقية</p>
  </div>
  <div style='background:#fff;padding:20px;border-radius:12px;margin-bottom:12px'>
    <table style='width:100%;font-size:14px;border-collapse:collapse'>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0;width:130px'>رقم الكتاب:</td><td style='font-weight:700;color:#2C3E6B'>{refNum}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0'>الأولوية:</td><td>{priorityLabel}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0'>المرسل:</td><td style='font-weight:700'>{dto.SenderName}</td></tr>
      <tr><td style='color:#888;padding:8px 0'>الموضوع:</td><td style='font-weight:700;color:#2C3E6B'>{dto.Subject}</td></tr>
    </table>
  </div>
  <a href='https://ficc.iq/correspondence/view/{letter.Id}' style='display:block;text-align:center;background:linear-gradient(135deg,#2C3E6B,#4A6FA5);color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px'>
    📄 عرض الكتاب
  </a>
</div>";
                            await _notify.SendEmail(email, $"📨 كتاب رسمي: {dto.Subject} | {priorityLabel}", html);
                        }
                    } catch (Exception ex) { _log.LogError(ex, "Email notification failed"); }
                }
            });
        }

        return Ok(new { id = letter.Id, referenceNumber = refNum, message = dto.SendNow ? "تم الإرسال" : "تم الحفظ كمسودة" });
    }

    // PUT: Update draft
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCorrespondenceDto dto) {
        var letter = await _db.Correspondences.Include(c => c.Recipients).FirstOrDefaultAsync(c => c.Id == id);
        if (letter == null) return NotFound();
        letter.Subject = dto.Subject ?? letter.Subject;
        letter.Body = dto.Body ?? letter.Body;
        letter.Priority = dto.Priority ?? letter.Priority;
        letter.Status = dto.Status ?? letter.Status;
        if (dto.Status == "sent" && letter.SentAt == null) letter.SentAt = DateTime.UtcNow;
        // Update recipients
        if (dto.Recipients != null) {
            _db.CorrespondenceRecipients.RemoveRange(letter.Recipients);
            foreach (var r in dto.Recipients)
                letter.Recipients.Add(new CorrespondenceRecipient { ChamberId = r.ChamberId, ChamberName = r.ChamberName });
        }
        await _db.SaveChangesAsync();
        return Ok(new { id = letter.Id, referenceNumber = letter.ReferenceNumber });
    }

    // POST: Send draft
    [HttpPost("{id}/send")]
    public async Task<IActionResult> Send(int id) {
        var letter = await _db.Correspondences.Include(c => c.Recipients).FirstOrDefaultAsync(c => c.Id == id);
        if (letter == null) return NotFound();
        letter.Status = "sent";
        letter.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم الإرسال" });
    }

    // POST: Reply
    [HttpPost("{id}/reply")]
    public async Task<IActionResult> Reply(int id, [FromBody] ReplyDto dto) {
        var letter = await _db.Correspondences.FindAsync(id);
        if (letter == null) return NotFound();
        _db.CorrespondenceReplies.Add(new CorrespondenceReply {
            CorrespondenceId = id, SenderId = dto.SenderId,
            SenderName = dto.SenderName, Body = dto.Body
        });
        // Notify original sender
        _db.CorrespondenceNotifications.Add(new CorrespondenceNotification {
            ChamberId = letter.SenderId, CorrespondenceId = id,
            Type = "reply", Title = $"رد على: {letter.Subject}"
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال الرد" });
    }

    // POST: Upload attachment
    [HttpPost("{id}/attach")]
    public async Task<IActionResult> Attach(int id, [FromForm] IFormFile file) {
        var letter = await _db.Correspondences.FindAsync(id);
        if (letter == null) return NotFound();
        var dir = _storage.GetFolder("correspondence");
        Directory.CreateDirectory(dir);
        var name = $"{id}_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var path = Path.Combine(dir, name);
        await using var stream = System.IO.File.Create(path);
        // Upload to R2
        var r2Path = await _storage.SaveFileAsync(file, "correspondence", name);
        _db.CorrespondenceAttachments.Add(new CorrespondenceAttachment {
            CorrespondenceId = id, FileName = file.FileName,
            FilePath = r2Path, FileSize = file.Length
        });
        await _db.SaveChangesAsync();
        return Ok(new { filePath = r2Path, fileName = file.FileName });
    }

    // GET: Unread count
    [HttpGet("unread/{chamberId}")]
    public async Task<IActionResult> UnreadCount(int chamberId) {
        var count = await _db.CorrespondenceRecipients
            .Where(r => r.ChamberId == chamberId && r.ReadAt == null &&
                        r.Correspondence.Status == "sent")
            .CountAsync();
        return Ok(new { count });
    }

    [HttpPost("open-naps2")]
    [AllowAnonymous]
    public IActionResult OpenNAPS2() {
        try {
            var naps2Paths = new[] {
                "C:\\Program Files\\NAPS2\\NAPS2.exe",
                "C:\\Program Files (x86)\\NAPS2\\NAPS2.exe",
                "C:\\Program Files\\NAPS2\\Naps2.exe",  // Case sensitivity
                "C:\\Program Files (x86)\\NAPS2\\Naps2.exe"
            };
            
            // أولاً: ابحث عن NAPS2
            string foundPath = null;
            foreach (var path in naps2Paths) {
                if (System.IO.File.Exists(path)) {
                    foundPath = path;
                    break;
                }
            }
            
            // إذا لم تجد، ابحث في البرامج الأخرى
            if (foundPath == null) {
                // محاولة من خلال registry
                try {
                    var regPath = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
                    if (regPath != null) {
                        foreach (var subKeyName in regPath.GetSubKeyNames()) {
                            var subKey = regPath.OpenSubKey(subKeyName);
                            var displayName = subKey?.GetValue("DisplayName")?.ToString();
                            if (displayName != null && displayName.Contains("NAPS2")) {
                                var installLocation = subKey?.GetValue("InstallLocation")?.ToString();
                                if (installLocation != null) {
                                    var napsExe = System.IO.Path.Combine(installLocation, "NAPS2.exe");
                                    if (System.IO.File.Exists(napsExe)) {
                                        foundPath = napsExe;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch { }
            }
            
            if (foundPath != null) {
                var process = new System.Diagnostics.Process {
                    StartInfo = new System.Diagnostics.ProcessStartInfo {
                        FileName = foundPath,
                        UseShellExecute = true,
                        CreateNoWindow = false
                    }
                };
                process.Start();
                return Ok(new { success = true, message = "NAPS2 تم فتحها بنجاح", path = foundPath });
            }
            
            return BadRequest(new { 
                success = false, 
                error = "NAPS2 غير مثبتة. يرجى التأكد من التثبيت في: C:\\Program Files\\NAPS2\\" 
            });
        } catch (Exception ex) {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("scan-folder")]
    [AllowAnonymous]
    public IActionResult ScanFolder() {
        // مراقبة مجلد NAPS2 وإرجاع الصور الجديدة
        var naps2Dirs = new[] {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "NAPS2"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Pictures", "NAPS2")
        };
        
        var files = new List<string>();
        foreach (var dir in naps2Dirs) {
            if (Directory.Exists(dir)) {
                files.AddRange(Directory.GetFiles(dir, "*.jpg").Concat(Directory.GetFiles(dir, "*.png")).ToList());
            }
        }
        
        return Ok(new { files = files.OrderByDescending(f => new FileInfo(f).LastWriteTime).Take(5).ToList() });
    }

    // GET: Notifications
    [HttpGet("notifications/{chamberId}")]
    public async Task<IActionResult> Notifications(int chamberId) {
        var items = await _db.CorrespondenceNotifications
            .Where(n => n.ChamberId == chamberId)
            .OrderByDescending(n => n.CreatedAt).Take(20).ToListAsync();
        return Ok(items);
    }

    // POST: Mark notification read
    [HttpPost("notifications/{id}/read")]
    public async Task<IActionResult> MarkRead(int id) {
        var n = await _db.CorrespondenceNotifications.FindAsync(id);
        if (n != null) { n.IsRead = true; await _db.SaveChangesAsync(); }
        return Ok();
    }

    // DELETE: Delete draft
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {
        var letter = await _db.Correspondences.FindAsync(id);
        if (letter == null) return NotFound();
        if (letter.Status != "draft") return BadRequest(new { message = "لا يمكن حذف كتاب مرسل" });
        _db.Correspondences.Remove(letter);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<IActionResult> Acknowledge(int id, [FromBody] AcknowledgeDto dto) {
        var r = await _db.CorrespondenceRecipients
            .FirstOrDefaultAsync(rec => rec.CorrespondenceId == id && rec.ChamberId == dto.ChamberId);
        if (r == null) return NotFound();
        r.AcknowledgedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تأكيد الاستلام" });
    }
}

public class CreateCorrespondenceDto {
    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";
    public int SenderId { get; set; }
    public string? SenderName { get; set; }
    public string? Priority { get; set; }
    public bool SendNow { get; set; } = false;
    public List<RecipientDto>? Recipients { get; set; }
}
public class RecipientDto { public int? ChamberId { get; set; } public string? ChamberName { get; set; } }
public class UpdateCorrespondenceDto {
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public List<RecipientDto>? Recipients { get; set; }
}
public class ReplyDto { public int SenderId { get; set; } public string? SenderName { get; set; } public string Body { get; set; } = ""; }
