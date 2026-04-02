using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using FICCPlatform.Data;
using FICCPlatform.Models;
using FICCPlatform.Services;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubmissionsController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly FICCPlatform.Services.StorageService _storage;
    private readonly ILogger<SubmissionsController> _log;
    private readonly NotificationService _notify;
    public SubmissionsController(AppDbContext db, FICCPlatform.Services.StorageService storage, ILogger<SubmissionsController> log, NotificationService notify) {
        _db = db; _storage = storage; _log = log; _notify = notify;
    }

    // PUBLIC: Submit a registration request
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubmissionDto dto) {
        if (string.IsNullOrEmpty(dto.EntityType))
            return BadRequest(new { message = "نوع الطلب مطلوب" });
        if (string.IsNullOrEmpty(dto.ContactName))
            return BadRequest(new { message = "اسم مقدم الطلب مطلوب" });

        // Extract base64 images from FormData → save as files → replace with URLs
        var formDataClean = dto.FormData != null
            ? new Dictionary<string, object>(dto.FormData.ToDictionary(kv => kv.Key, kv => (object)kv.Value))
            : new Dictionary<string, object>();
        var imageKeys = new[] { "_photo", "_logo", "_idFile", "_idFileBack" };
        var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var uploadsBase = _storage.GetFolder("submissions");
        Directory.CreateDirectory(uploadsBase);
        foreach (var imgKey in imageKeys) {
            if (formDataClean.TryGetValue(imgKey, out var imgVal) && imgVal is System.Text.Json.JsonElement je && je.ValueKind == JsonValueKind.String) {
                var raw = je.GetString() ?? "";
                if (raw.StartsWith("data:")) {
                    try {
                        var ext = raw.Contains("png") ? ".png" : raw.Contains("gif") ? ".gif" : ".jpg";
                        var b64 = raw.Contains(",") ? raw.Split(',')[1] : raw;
                        var fn = $"{dto.EntityType}_{imgKey.TrimStart('_')}_{ts}{ext}";
                        await System.IO.File.WriteAllBytesAsync(Path.Combine(uploadsBase, fn), Convert.FromBase64String(b64));
                        formDataClean[imgKey] = $"/uploads/submissions/{fn}";
                    } catch { /* keep original if save fails */ }
                }
            }
        }

        var sub = new Submission {
            EntityType   = dto.EntityType,
            FormData     = JsonSerializer.Serialize(formDataClean),
            Status       = "pending",
            ContactName  = dto.ContactName,
            ContactPhone = dto.ContactPhone,
            ContactEmail = dto.ContactEmail,
            LogoData     = dto.LogoData,
            ReviewToken  = Guid.NewGuid().ToString("N"),
            CreatedAt    = DateTime.UtcNow
        };
        _db.Submissions.Add(sub);
        await _db.SaveChangesAsync();

        // Notify admin about new submission
        try {
            var entityLabels = new Dictionary<string,string> {
                {"chamber","غرفة تجارية"}, {"member","عضو مجلس الاتحاد"},
                {"trader","دليل الشركات"}, {"shipping","شركة شحن"}
            };
            var label = entityLabels.TryGetValue(dto.EntityType, out var l) ? l : dto.EntityType;
            var adminEmail = "engnabeelalmulla@gmail.com";
            var adminHtml = $@"
<div dir='rtl' style='font-family:Cairo,sans-serif;max-width:600px;margin:0 auto;background:#f5f7fa;padding:20px;border-radius:16px'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px'>
    <h2 style='color:#fff;margin:0;font-size:18px'>📬 طلب تسجيل جديد</h2>
    <p style='color:#FFC72C;margin:8px 0 0;font-size:14px'>اتحاد الغرف التجارية العراقية</p>
  </div>
  <div style='background:#fff;padding:20px;border-radius:12px;margin-bottom:12px'>
    <table style='width:100%;border-collapse:collapse;font-size:14px'>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0;width:140px'>النوع:</td><td style='color:#2C3E6B;font-weight:700'>{label}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0'>مقدم الطلب:</td><td style='color:#333;font-weight:700'>{dto.ContactName}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f0f0f0'>الهاتف:</td><td style='color:#059669;direction:ltr'>{dto.ContactPhone ?? "—"}</td></tr>
      <tr><td style='color:#888;padding:8px 0'>الإيميل:</td><td style='color:#4A6FA5'>{dto.ContactEmail ?? "—"}</td></tr>
    </table>
  </div>
  <a href='https://ficc.iq/admin/submissions' style='display:block;text-align:center;background:linear-gradient(135deg,#2C3E6B,#4A6FA5);color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:8px'>
    🔍 مراجعة الطلب في لوحة الإدارة
  </a>
  <p style='text-align:center;margin:4px 0 0'><a href='https://ficc.iq/review/{sub.ReviewToken}' style='color:#4A6FA5;font-size:13px'>🔗 الرابط المباشر (بدون تسجيل دخول)</a></p>
  <p style='color:#aaa;font-size:11px;text-align:center;margin-top:12px'>رقم الطلب: #{sub.Id} — {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
</div>";
            await _notify.SendEmail(adminEmail, $"📬 طلب جديد — {label} | {dto.ContactName}", adminHtml);
        } catch (Exception ex) { _log.LogError(ex, "Failed to send admin notification email"); }

        // ─── إشعار المتقدم: تم استلام طلبك ───
        try {
            var entityLabels = new Dictionary<string,string> {
                {"chamber","غرفة تجارية"}, {"member","عضو مجلس الاتحاد"},
                {"trader","دليل الشركات"}, {"shipping","شركة شحن"},
                {"lawyer","محامٍ"}, {"agent","وكيل إخراج"}
            };
            var lbl = entityLabels.TryGetValue(dto.EntityType, out var ll) ? ll : dto.EntityType;

            // إيميل للمتقدم
            if (!string.IsNullOrWhiteSpace(dto.ContactEmail)) {
                var applicantHtml = $@"
<div dir='rtl' style='font-family:Cairo,sans-serif;max-width:600px;margin:0 auto;background:#f5f7fa;padding:20px;border-radius:16px'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:28px 24px;border-radius:14px;text-align:center;margin-bottom:20px'>
    <div style='font-size:48px;margin-bottom:10px'>✅</div>
    <h2 style='color:#fff;margin:0;font-size:20px;font-weight:800'>تم استلام طلبك بنجاح</h2>
    <p style='color:#FFC72C;margin:8px 0 0;font-size:14px'>اتحاد الغرف التجارية العراقية</p>
  </div>
  <div style='background:#fff;padding:20px;border-radius:12px;margin-bottom:16px;border-right:4px solid #10b981'>
    <p style='color:#2C3E6B;font-size:15px;margin:0 0 12px;font-weight:700'>عزيزي {System.Web.HttpUtility.HtmlEncode(dto.ContactName)}،</p>
    <p style='color:#555;font-size:14px;margin:0;line-height:1.8'>
      تم استلام طلب تسجيلك في <strong>{System.Web.HttpUtility.HtmlEncode(lbl)}</strong> بنجاح.<br/>
      سيتم مراجعة طلبك من قِبَل فريق اتحاد الغرف التجارية العراقية وإشعارك بالنتيجة في أقرب وقت.
    </p>
  </div>
  <div style='background:#fff;padding:16px 20px;border-radius:12px;margin-bottom:16px'>
    <table style='width:100%;border-collapse:collapse;font-size:14px'>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f5f5f5;width:130px'>رقم الطلب:</td><td style='color:#2C3E6B;font-weight:800'>#{sub.Id}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f5f5f5'>نوع الطلب:</td><td style='color:#333;font-weight:700'>{System.Web.HttpUtility.HtmlEncode(lbl)}</td></tr>
      <tr><td style='color:#888;padding:8px 0;border-bottom:1px solid #f5f5f5'>الاسم:</td><td style='color:#333;font-weight:700'>{System.Web.HttpUtility.HtmlEncode(dto.ContactName)}</td></tr>
      <tr><td style='color:#888;padding:8px 0'>تاريخ التقديم:</td><td style='color:#555'>{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</td></tr>
    </table>
  </div>
  <div style='background:#EEF2FF;padding:16px;border-radius:12px;margin-bottom:16px;text-align:center'>
    <p style='color:#2C3E6B;font-size:13px;margin:0 0 8px;font-weight:700'>للاستفسار عن حالة طلبك:</p>
    <p style='color:#555;font-size:13px;margin:0'>📞 <strong>5366</strong> &nbsp;|&nbsp; ✉️ <strong>info@ficc.iq</strong></p>
  </div>
  <div style='text-align:center;padding-top:8px'>
    <p style='color:#aaa;font-size:11px;margin:0'>اتحاد الغرف التجارية العراقية — Federation of Iraqi Chambers of Commerce</p>
    <p style='color:#aaa;font-size:11px;margin:4px 0 0'><a href='https://ficc.iq' style='color:#4A6FA5'>ficc.iq</a></p>
  </div>
</div>";
                await _notify.SendEmail(dto.ContactEmail, $"✅ تم استلام طلبك — {lbl} | اتحاد الغرف التجارية العراقية", applicantHtml);
            }

            // SMS للمتقدم
            if (!string.IsNullOrWhiteSpace(dto.ContactPhone)) {
                var smsMsg = $"✅ عزيزي {dto.ContactName}، تم استلام طلبك في اتحاد الغرف التجارية العراقية (رقم الطلب: #{sub.Id}). سيتم مراجعته وإشعارك بالنتيجة. للاستفسار: 5366";
                await _notify.SendSmsText(dto.ContactPhone, smsMsg);
            }
        } catch (Exception ex) { _log.LogError(ex, "Failed to send applicant confirmation"); }

        return Ok(new { id = sub.Id, message = "تم استلام طلبك بنجاح، سيتم مراجعته قريباً" });
    }

    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true });

    // ADMIN: Get all submissions with optional filter + pagination
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? entityType, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) {
        var q = _db.Submissions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        if (!string.IsNullOrEmpty(entityType)) q = q.Where(s => s.EntityType == entityType);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(s => s.CreatedAt)
            .Skip((page-1)*pageSize).Take(pageSize)
            .Select(s => new { s.Id, s.EntityType, s.Status, s.ContactName, s.ContactPhone, s.ContactEmail, s.ReviewNote, s.ReviewedAt, s.CreatedAt, s.FormData })
            .ToListAsync();
        // Serialize manually to avoid any serializer issues
        var sb = new System.Text.StringBuilder();
        sb.Append("{\"total\":").Append(total)
          .Append(",\"page\":").Append(page)
          .Append(",\"pageSize\":").Append(pageSize)
          .Append(",\"items\":[");
        bool first = true;
        foreach (var s in items) {
            if (!first) sb.Append(',');
            first = false;
            var fd = new Dictionary<string, string?>();
            if (!string.IsNullOrEmpty(s.FormData)) {
                try {
                    using var doc = System.Text.Json.JsonDocument.Parse(s.FormData);
                    foreach (var prop in doc.RootElement.EnumerateObject()) {
                        if (prop.Name.StartsWith("_") || prop.Name == "logoData") continue;
                        fd[prop.Name] = prop.Value.ValueKind == JsonValueKind.String ? prop.Value.GetString() : prop.Value.GetRawText();
                    }
                } catch { }
            }
            var item = new {
                id = s.Id, entityType = s.EntityType, status = s.Status,
                contactName = s.ContactName, contactPhone = s.ContactPhone, contactEmail = s.ContactEmail,
                reviewNote = s.ReviewNote, reviewedAt = s.ReviewedAt, createdAt = s.CreatedAt,
                formData = fd
            };
            sb.Append(JsonSerializer.Serialize(item, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        }
        sb.Append("]}");
        return Content(sb.ToString(), "application/json");
    }

    // ADMIN: Get single submission
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) {
        _log.LogInformation("Get submission {Id} - start", id);
        var s = await _db.Submissions
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new { x.Id, x.EntityType, x.Status, x.ContactName, x.ContactPhone, x.ContactEmail, x.ReviewNote, x.ReviewedAt, x.CreatedAt, x.FormData })
            .FirstOrDefaultAsync();
        _log.LogInformation("Get submission {Id} - db done, found={Found}", id, s != null);
        if (s == null) return NotFound();
        var fdJson = string.IsNullOrEmpty(s.FormData) ? "{}" : s.FormData;
        _log.LogInformation("Get submission {Id} - fdJson len={Len}", id, fdJson.Length);
        var resp = $"{{\"id\":{s.Id},\"entityType\":{JsonSerializer.Serialize(s.EntityType)},\"status\":{JsonSerializer.Serialize(s.Status)},\"contactName\":{JsonSerializer.Serialize(s.ContactName)},\"contactPhone\":{JsonSerializer.Serialize(s.ContactPhone)},\"contactEmail\":{JsonSerializer.Serialize(s.ContactEmail)},\"reviewNote\":{JsonSerializer.Serialize(s.ReviewNote)},\"reviewedAt\":{JsonSerializer.Serialize(s.ReviewedAt?.ToString("o"))},\"createdAt\":{JsonSerializer.Serialize(s.CreatedAt.ToString("o"))},\"formData\":{fdJson}}}";
        _log.LogInformation("Get submission {Id} - returning {Bytes} bytes", id, resp.Length);
        return Content(resp, "application/json");
    }

    // ADMIN: Approve — creates actual record
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveDto dto) {
        var sub = await _db.Submissions.FindAsync(id);
        if (sub == null) return NotFound();
        if (sub.Status != "pending") return BadRequest(new { message = "الطلب تمت معالجته مسبقاً" });

        var data = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(sub.FormData) ?? new();

        string getString(string key) => data.TryGetValue(key, out var v) ? (v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : v.ToString()) : "";
        int? getInt(string key) {
            if (!data.TryGetValue(key, out var v)) return null;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out int n)) return n;
            if (v.ValueKind == JsonValueKind.String && int.TryParse(v.GetString(), out int s)) return s;
            return null;
        }
        (string fb,string tw,string ig,string li,string yt,string wa,string tg,string _) ParseSocial(Dictionary<string,JsonElement> d) {
            string fb2="",tw2="",ig2="",li2="",yt2="",wa2="",tg2="";
            if (d.TryGetValue("_social", out var se) && se.ValueKind == JsonValueKind.Object)
                foreach (var sp in se.EnumerateObject()) switch(sp.Name.ToLower()) {
                    case "facebook": fb2=sp.Value.GetString()??""; break;
                    case "twitter":  tw2=sp.Value.GetString()??""; break;
                    case "instagram":ig2=sp.Value.GetString()??""; break;
                    case "linkedin": li2=sp.Value.GetString()??""; break;
                    case "youtube":  yt2=sp.Value.GetString()??""; break;
                    case "whatsapp": wa2=sp.Value.GetString()??""; break;
                    case "telegram": tg2=sp.Value.GetString()??""; break;
                }
            string gf(string k) => d.TryGetValue(k, out var v2) && v2.ValueKind==JsonValueKind.String ? v2.GetString()??"" : "";
            if(string.IsNullOrEmpty(fb2)) fb2=gf("facebook");
            if(string.IsNullOrEmpty(tw2)) tw2=gf("twitter");
            if(string.IsNullOrEmpty(ig2)) ig2=gf("instagram");
            if(string.IsNullOrEmpty(li2)) li2=gf("linkedin");
            if(string.IsNullOrEmpty(yt2)) yt2=gf("youtube");
            if(string.IsNullOrEmpty(wa2)) wa2=gf("whatsApp");
            if(string.IsNullOrEmpty(tg2)) tg2=gf("telegram");
            return (fb2,tw2,ig2,li2,yt2,wa2,tg2,"");
        }

        int createdId = 0;
        switch (sub.EntityType) {
            case "chamber": {
                var item = new Chamber {
                    Name = getString("name"), Governorate = getString("governorate"),
                    City = getString("city"), Phone = getString("phone"),
                    Email = getString("email"), Website = getString("website"),
                    Address = getString("address"), Description = getString("description"),
                    PoBox = getString("poBox"),
                    EstablishedYear = getInt("establishedYear"),
                    BoardMembersCount = getInt("boardMembersCount"),
                    GeneralAssemblyCount = getInt("generalAssemblyCount"),
                    Facebook = getString("facebook"), Twitter = getString("twitter"),
                    Instagram = getString("instagram"), WhatsApp = getString("whatsApp"),
                    Telegram = getString("telegram"), YouTube = getString("youTube"),
                    CreatedAt = DateTime.UtcNow
                };
                _db.Chambers.Add(item);
                await _db.SaveChangesAsync();
                createdId = item.Id;
                break;
            }
            case "member": {
                int? chamberId = getInt("chamberId");
                string chamberName = getString("chamberName");
                if (chamberId.HasValue && string.IsNullOrEmpty(chamberName)) {
                    var ch = await _db.Chambers.FindAsync(chamberId.Value);
                    if (ch != null) chamberName = ch.Name;
                }
                // Photo: saved as URL by Create endpoint (key = _photo)
                string photoUrl = getString("_photo");
                if (string.IsNullOrEmpty(photoUrl)) photoUrl = getString("photoUrl");

                // Parse _social
                var (mFb,mTw,mIg,mLi,mYt,_,_2,_3) = ParseSocial(data);

                var item = new Member {
                    FullName = getString("fullName"), Title = getString("title"),
                    ChamberId = chamberId, ChamberName = chamberName,
                    Phone = getString("phone"), Email = getString("email"), Bio = getString("bio"),
                    PhotoUrl = string.IsNullOrEmpty(photoUrl) ? null : photoUrl,
                    Facebook = mFb, Twitter = mTw, Instagram = mIg, LinkedIn = mLi, YouTube = mYt,
                    Status = "Active", CreatedAt = DateTime.UtcNow
                };
                _db.Members.Add(item);
                await _db.SaveChangesAsync();
                createdId = item.Id;
                break;
            }
            case "trader": {
                // Resolve chamber
                int? traderChamberId = getInt("chamberId");
                string traderChamberName = getString("chamberName");
                if (traderChamberId.HasValue && string.IsNullOrEmpty(traderChamberName)) {
                    var ch = await _db.Chambers.FindAsync(traderChamberId.Value);
                    if (ch != null) traderChamberName = ch.Name;
                }
                // Photo + social
                string traderPhotoUrl = getString("_photo");
                if (string.IsNullOrEmpty(traderPhotoUrl)) traderPhotoUrl = getString("photoUrl");
                var (fbVal,twVal,igVal,_li,ytVal,waVal,tgVal,_x) = ParseSocial(data);

                var item = new TraderDirectory {
                    TradeName = getString("tradeName"),
                    CompanyName = getString("companyName") != "" ? getString("companyName") : getString("tradeName"),
                    OwnerName = getString("ownerName"), BusinessType = getString("businessType"),
                    Governorate = getString("governorate"), Area = getString("area"),
                    Address = getString("address"), Website = getString("website"),
                    Phone = getString("phone"), Mobile = getString("mobile"),
                    Email = getString("email"), Description = getString("description"),
                    TradeCategory = getString("tradeCategory"),
                    ChamberId = traderChamberId, ChamberName = traderChamberName,
                    PhotoUrl = string.IsNullOrEmpty(traderPhotoUrl) ? null : traderPhotoUrl,
                    IdFileUrl = getString("_idFile"),
                    IdFileBackUrl = getString("_idFileBack"),
                    Facebook = fbVal, Instagram = igVal, Twitter = twVal,
                    WhatsApp = waVal, Telegram = tgVal, YouTube = ytVal,
                    Notes = getString("notes"),
                    IsVerified = false, CreatedAt = DateTime.UtcNow
                };
                _db.TraderDirectory.Add(item);
                await _db.SaveChangesAsync();
                createdId = item.Id;
                break;
            }
            case "shipping": {
                var (sFb,sTw,sIg,sLi,sYt,sWa,sTg,_) = ParseSocial(data);
                var item = new ShippingCompany {
                    CompanyName = getString("companyName"),
                    ShippingType = getString("shippingType"),
                    Governorate = getString("governorate"), Phone = getString("phone"),
                    Mobile = getString("mobile"), Email = getString("email"),
                    Address = getString("address"), Website = getString("website"),
                    Description = getString("description"), Country = getString("country"),
                    Facebook = sFb, Instagram = sIg, WhatsApp = sWa,
                    Telegram = sTg, YouTube = sYt,
                    IsVerified = false, CreatedAt = DateTime.UtcNow
                };
                _db.ShippingCompanies.Add(item);
                await _db.SaveChangesAsync();
                createdId = item.Id;
                break;
            }
            default:
                return BadRequest(new { message = $"نوع غير معروف: {sub.EntityType}" });
        }

        sub.Status = "approved";
        sub.ReviewNote = dto?.Note;
        sub.ReviewedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Save logo file if provided
        if (!string.IsNullOrEmpty(sub.LogoData) && sub.LogoData.StartsWith("data:image")) {
            try {
                var base64 = sub.LogoData.Substring(sub.LogoData.IndexOf(',') + 1);
                var ext = sub.LogoData.Contains("png") ? ".png" : sub.LogoData.Contains("gif") ? ".gif" : ".jpg";
                var bytes = Convert.FromBase64String(base64);
                var wwwroot = _storage.UploadsRoot;
                var folder = sub.EntityType switch {
                    "chamber" => Path.Combine(wwwroot, "uploads", "chambers"),
                    "trader"  => Path.Combine(wwwroot, "uploads", "traders"),
                    "member"  => Path.Combine(wwwroot, "uploads", "members"),
                    _         => Path.Combine(wwwroot, "uploads", "chambers")
                };
                Directory.CreateDirectory(folder);
                var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var filename = $"{sub.EntityType}_sub_{sub.Id}_{ts}{ext}";
                await System.IO.File.WriteAllBytesAsync(Path.Combine(folder, filename), bytes);
                var logoUrl = $"/uploads/{sub.EntityType switch { "chamber" => "chambers", "trader" => "traders", "member" => "members", _ => "chambers" }}/{filename}";

                // Update the newly created record with the logo URL
                if (sub.EntityType == "chamber") {
                    var last = await _db.Chambers.OrderByDescending(c => c.Id).FirstOrDefaultAsync();
                    if (last != null) { last.LogoUrl = logoUrl; await _db.SaveChangesAsync(); }
                } else if (sub.EntityType == "trader") {
                    var last = await _db.TraderDirectory.OrderByDescending(t => t.Id).FirstOrDefaultAsync();
                    if (last != null) { last.LogoUrl = logoUrl; await _db.SaveChangesAsync(); }
                } else if (sub.EntityType == "member") {
                    var last = await _db.Members.OrderByDescending(m => m.Id).FirstOrDefaultAsync();
                    if (last != null) { last.PhotoUrl = logoUrl; await _db.SaveChangesAsync(); }
                }
            } catch (Exception ex) {
                _log.LogError(ex, "Logo save failed for submission {Id}", sub.Id);
            }
        }

        // Send approval email notification
        // Try formData email first, then submission contactEmail
        var contactEmail = getString("email");
        if (string.IsNullOrEmpty(contactEmail)) contactEmail = sub.ContactEmail ?? "";
        if (!string.IsNullOrEmpty(contactEmail)) {
            try {
                var entityLabels = new Dictionary<string,string> {
                    {"chamber","غرفة تجارية"}, {"member","عضو مجلس الاتحاد"},
                    {"trader","دليل الشركات"}, {"shipping","شركة شحن"}
                };
                var label = entityLabels.TryGetValue(sub.EntityType, out var l) ? l : sub.EntityType;
                var name = getString("fullName") != "" ? getString("fullName") : getString("name") != "" ? getString("name") : getString("tradeName") != "" ? getString("tradeName") : sub.ContactName;
                // Build card URL using createdId
                var section = sub.EntityType switch {
                    "member" => "members", "chamber" => "chambers",
                    "trader" => "directory", "shipping" => "shipping", _ => "members"
                };
                var cardUrl = createdId > 0 ? $"https://ficc.iq/{section}/{createdId}" : "https://ficc.iq";
                var htmlBody = $@"
<div dir='rtl' style='font-family:Cairo,sans-serif;max-width:600px;margin:0 auto;background:#f5f7fa;padding:20px;border-radius:16px'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:28px;border-radius:12px;text-align:center;margin-bottom:20px'>
    <img src='https://ficc.iq/ficc-logo.jpg' style='width:70px;height:70px;border-radius:50%;border:3px solid #FFC72C;margin-bottom:12px'/>
    <h2 style='color:#fff;margin:0;font-size:20px'>اتحاد الغرف التجارية العراقية</h2>
  </div>
  <div style='background:#fff;padding:24px;border-radius:12px;text-align:center'>
    <div style='font-size:48px;margin-bottom:12px'>🎉</div>
    <h3 style='color:#2C3E6B;font-size:22px;margin:0 0 12px'>✅ تم نشر طلبك</h3>
    <p style='color:#555;font-size:15px;margin-bottom:20px'>مرحباً <strong>{name}</strong>، تم نشر بياناتك كـ <strong>{label}</strong> في دليل اتحاد الغرف التجارية العراقية</p>
    <a href='{cardUrl}' style='display:inline-block;background:linear-gradient(135deg,#2C3E6B,#4A6FA5);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:20px'>
      👤 عرض بطاقتك
    </a>
    <p style='color:#888;font-size:13px'>يمكنك مشاركة هذا الرابط: <a href='{cardUrl}' style='color:#4A6FA5'>{cardUrl}</a></p>
  </div>
  <p style='color:#aaa;font-size:11px;text-align:center;margin-top:16px'>اتحاد الغرف التجارية العراقية — ficc.iq</p>
</div>";
                await _notify.SendEmail(contactEmail, $"✅ تم نشر طلبك — {label} | اتحاد الغرف التجارية العراقية", htmlBody);
                _log.LogInformation("Approval email sent to {Email}", contactEmail);
            } catch (Exception ex) { _log.LogError(ex, "Failed to send approval email"); }
        }

        return Ok(new { message = "تم الموافقة وإنشاء السجل بنجاح" });
    }

    // ADMIN: Reject
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApproveDto dto) {
        var sub = await _db.Submissions.FindAsync(id);
        if (sub == null) return NotFound();
        sub.Status = "rejected";
        sub.ReviewNote = dto?.Note;
        sub.ReviewedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم رفض الطلب" });
    }

    // ADMIN: Delete submission
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) {
        var sub = await _db.Submissions.FindAsync(id);
        if (sub == null) return NotFound();
        var name = sub.ContactName;
        var entity = sub.EntityType;
        var phone = sub.ContactPhone;
        _db.Submissions.Remove(sub);
        await _db.SaveChangesAsync();
        // Notify admin
        try {
            var html = $@"<div dir='rtl' style='font-family:Cairo,sans-serif;max-width:500px;margin:0 auto;background:#fff;padding:24px;border-radius:12px;border:2px solid #dc2626'>
  <h2 style='color:#dc2626;margin:0 0 16px'>🗑️ تم حذف طلب تسجيل</h2>
  <table style='width:100%;font-size:14px'>
    <tr><td style='color:#888;padding:6px 0;width:120px'>رقم الطلب:</td><td style='font-weight:700'>#{id}</td></tr>
    <tr><td style='color:#888;padding:6px 0'>النوع:</td><td style='font-weight:700'>{entity}</td></tr>
    <tr><td style='color:#888;padding:6px 0'>مقدم الطلب:</td><td style='font-weight:700'>{name}</td></tr>
    <tr><td style='color:#888;padding:6px 0'>الهاتف:</td><td style='font-weight:700'>{phone}</td></tr>
    <tr><td style='color:#888;padding:6px 0'>وقت الحذف:</td><td style='color:#dc2626'>{DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</td></tr>
  </table>
</div>";
            await _notify.SendEmail("engnabeelalmulla@gmail.com", $"🗑️ حُذف طلب #{id} — {name}", html);
        } catch { }
        return Ok(new { message = "تم حذف الطلب" });
    }

    // Store logo data (base64) with submission
    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchLogo(int id, [FromBody] PatchSubmissionDto dto) {
        var sub = await _db.Submissions.FindAsync(id);
        if (sub == null) return NotFound();
        if (!string.IsNullOrEmpty(dto.LogoData)) sub.LogoData = dto.LogoData;
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ADMIN: Stats
    // Track by phone
    [HttpGet("track")]
    public async Task<IActionResult> Track([FromQuery] string phone) {
        if (string.IsNullOrEmpty(phone)) return BadRequest();
        var normalized = phone.Replace(" ", "").Replace("-", "");
        var local = normalized.StartsWith("+9647") ? "0" + normalized[4..] : normalized;
        var intl  = normalized.StartsWith("07") ? "+964" + normalized[1..] : normalized;
        var subs = await _db.Submissions
            .Where(s => s.ContactPhone == normalized || s.ContactPhone == local || s.ContactPhone == intl)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new { s.Id, s.EntityType, s.Status, s.ContactName, s.ContactPhone, s.ReviewNote, s.CreatedAt, s.ReviewedAt })
            .ToListAsync();
        return Ok(subs);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats() {
        var pending  = await _db.Submissions.CountAsync(s => s.Status == "pending");
        var approved = await _db.Submissions.CountAsync(s => s.Status == "approved");
        var rejected = await _db.Submissions.CountAsync(s => s.Status == "rejected");
        return Ok(new { pending, approved, rejected, total = pending + approved + rejected });
    }
    [HttpGet("review/{token}")]
    public async Task<IActionResult> GetByToken(string token) {
        var sub = await _db.Submissions.AsNoTracking()
            .Where(s => s.ReviewToken == token)
            .Select(s => new { s.Id, s.EntityType, s.Status, s.ContactName, s.ContactPhone, s.ContactEmail, s.ReviewNote, s.ReviewedAt, s.CreatedAt, s.ReviewToken, s.FormData })
            .FirstOrDefaultAsync();
        if (sub == null) return NotFound(new { message = "الرابط غير صحيح أو انتهت صلاحيته" });
        var fdJson = sub.FormData ?? "{}";
        var baseJson = JsonSerializer.Serialize(new {
            id = sub.Id, entityType = sub.EntityType, status = sub.Status,
            contactName = sub.ContactName, contactPhone = sub.ContactPhone, contactEmail = sub.ContactEmail,
            reviewNote = sub.ReviewNote, reviewedAt = sub.ReviewedAt?.ToString("o"),
            createdAt = sub.CreatedAt.ToString("o"), reviewToken = sub.ReviewToken
        });
        return Content(baseJson.TrimEnd('}') + ",\"formData\":" + fdJson + "}", "application/json");
    }

    [HttpPost("review/{token}/approve")]
    public async Task<IActionResult> ApproveByToken(string token, [FromBody] ApproveDto? dto) {
        var sub = await _db.Submissions.FirstOrDefaultAsync(s => s.ReviewToken == token);
        if (sub == null) return NotFound(new { message = "الرابط غير صحيح" });
        if (sub.Status != "pending") return BadRequest(new { message = "الطلب تمت معالجته مسبقاً" });
        return await Approve(sub.Id, dto);
    }

    [HttpPost("review/{token}/reject")]
    public async Task<IActionResult> RejectByToken(string token, [FromBody] ApproveDto? dto) {
        var sub = await _db.Submissions.FirstOrDefaultAsync(s => s.ReviewToken == token);
        if (sub == null) return NotFound(new { message = "الرابط غير صحيح" });
        if (sub.Status != "pending") return BadRequest(new { message = "الطلب تمت معالجته مسبقاً" });
        return await Reject(sub.Id, dto);
    }

}

public class SubmissionListItem {
    public int Id { get; set; }
    public string? EntityType { get; set; }
    public string? Status { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, string?> FormData { get; set; } = new();
}

public record CreateSubmissionDto(
    string EntityType,
    string ContactName,
    string? ContactPhone,
    string? ContactEmail,
    Dictionary<string, JsonElement>? FormData,
    string? LogoData
);
public record ApproveDto(string? Note);
public record PatchSubmissionDto(string? LogoData);

