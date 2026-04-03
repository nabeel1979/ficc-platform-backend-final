using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("og")]
public class OgController : ControllerBase {
    private readonly AppDbContext _db;
    public OgController(AppDbContext db) { _db = db; }

    private string BuildHtml(string title, string description, string imageUrl, string pageUrl, string scheme, string host) {
        // Always use https for image URLs (required by WhatsApp/Telegram)
        var abs = string.IsNullOrEmpty(imageUrl) ? "" : (imageUrl.StartsWith("http") ? imageUrl.Replace("http://", "https://") : $"https://{host}{imageUrl}");
        return $@"<!DOCTYPE html>
<html lang=""ar"" dir=""rtl"">
<head>
  <meta charset=""UTF-8""/>
  <meta property=""og:type"" content=""website""/>
  <meta property=""og:site_name"" content=""اتحاد الغرف التجارية العراقية""/>
  <meta property=""og:title"" content=""{System.Web.HttpUtility.HtmlEncode(title)}""/>
  <meta property=""og:description"" content=""{System.Web.HttpUtility.HtmlEncode(description)}""/>
  <meta property=""og:url"" content=""{pageUrl}""/>
  {(string.IsNullOrEmpty(abs)?"":$@"<meta property=""og:image"" content=""{abs}""/>
  <meta property=""og:image:width"" content=""800""/>
  <meta property=""og:image:height"" content=""800""/>")}
  <meta name=""twitter:card"" content=""summary_large_image""/>
  <meta name=""twitter:title"" content=""{System.Web.HttpUtility.HtmlEncode(title)}""/>
  {(string.IsNullOrEmpty(abs)?"":$@"<meta name=""twitter:image"" content=""{abs}""/>")}
  <title>{System.Web.HttpUtility.HtmlEncode(title)}</title>
  <script>window.location.href='{pageUrl}';</script>
</head>
<body><p>جاري التحويل... <a href=""{pageUrl}"">اضغط هنا</a></p></body>
</html>";
    }

    [HttpGet("news/{id}")]
    public async Task<IActionResult> NewsOg(int id) {
        var item = await _db.News.FindAsync(id);
        if (item == null) return Redirect("/news");
        string img = "";
        if (!string.IsNullOrEmpty(item.Images)) {
            try { var imgs = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Images); if (imgs?.Count>0) img=imgs[0]; } catch {}
        }
        if (string.IsNullOrEmpty(img)) img = item.ImageUrl ?? "";
        var desc = item.Body?.Length>200 ? item.Body[..200]+"..." : item.Body ?? "";
        return Content(BuildHtml(item.Title, desc, img, $"{Request.Scheme}://{Request.Host}/news/{id}", Request.Scheme, Request.Host.ToString()), "text/html; charset=utf-8");
    }

    [HttpGet("chambers/{id}")]
    public async Task<IActionResult> ChamberOg(int id) {
        var item = await _db.Chambers.FindAsync(id);
        if (item == null) return Redirect("/chambers");
        var desc = item.Description?.Length>200 ? item.Description[..200]+"..." : item.Description ?? $"غرفة تجارة {item.Governorate} — {item.MemberCount} عضو";
        return Content(BuildHtml(item.Name, desc, item.LogoUrl ?? "", $"{Request.Scheme}://{Request.Host}/chambers/{id}", Request.Scheme, Request.Host.ToString()), "text/html; charset=utf-8");
    }
    [HttpGet("traders/{id}")]
    public async Task<IActionResult> TraderOg(int id) {
        var item = await _db.TraderDirectory.FindAsync(id);
        if (item == null) return Redirect("/directory");
        var desc = item.Description?.Length>200 ? item.Description[..200]+"..." : item.Description
            ?? $"{item.BusinessType ?? "منشأة تجارية"} في {item.Governorate ?? "العراق"} — {item.TradeCategory ?? ""}";
        return Content(BuildHtml(
            !string.IsNullOrEmpty(item.TradeName) ? item.TradeName : item.CompanyName,
            desc,
            item.LogoUrl ?? "",
            $"{Request.Scheme}://{Request.Host}/directory/{id}",
            Request.Scheme, Request.Host.ToString()
        ), "text/html; charset=utf-8");
    }

    [HttpGet("members/{id}")]
    public async Task<IActionResult> MemberOg(int id) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return Redirect("/members");
        var desc = item.Bio ?? $"{item.Title ?? "عضو مجلس"} — {item.ChamberName ?? "اتحاد الغرف التجارية العراقية"}";
        return Content(BuildHtml(
            item.FullName,
            desc,
            item.PhotoUrl ?? "",
            $"{Request.Scheme}://{Request.Host}/members/{id}",
            Request.Scheme, Request.Host.ToString()
        ), "text/html; charset=utf-8");
    }

    // بطاقة عضو مستقلة — تُفتح مباشرة بدون redirect
    [HttpGet("member-card/{id}")]
    public async Task<IActionResult> MemberCard(int id) {
        var item = await _db.Members.FindAsync(id);
        if (item == null) return Redirect("/members");
        var host = Request.Host.ToString();
        var abs = string.IsNullOrEmpty(item.PhotoUrl) ? ""
            : (item.PhotoUrl.StartsWith("http") ? item.PhotoUrl : $"https://{host}{item.PhotoUrl}");
        var pageUrl = $"https://{host}/members/{id}";
        var logoUrl = $"https://{host}/ficc-logo.jpg";
        var avatarHtml = string.IsNullOrEmpty(abs)
            ? $@"<div class=""avatar-ph"">{(item.FullName.Length>0?item.FullName[0].ToString():"?")}</div>"
            : $@"<img class=""avatar"" src=""{abs}?v={item.CreatedAt.Ticks}"" alt=""""/>";
        var html = $@"<!DOCTYPE html>
<html lang=""ar"" dir=""rtl"">
<head>
  <meta charset=""UTF-8""/>
  <meta name=""viewport"" content=""width=device-width,initial-scale=1""/>
  <meta property=""og:type"" content=""profile""/>
  <meta property=""og:site_name"" content=""اتحاد الغرف التجارية العراقية""/>
  <meta property=""og:title"" content=""{System.Web.HttpUtility.HtmlEncode(item.FullName)}""/>
  <meta property=""og:description"" content=""{System.Web.HttpUtility.HtmlEncode(item.Title ?? "عضو مجلس الاتحاد")}""/>
  <meta property=""og:url"" content=""{pageUrl}""/>
  {(string.IsNullOrEmpty(abs)?"":$@"<meta property=""og:image"" content=""{abs}?v={item.CreatedAt.Ticks}""/>
  <meta property=""og:image:width"" content=""800""/>
  <meta property=""og:image:height"" content=""800""/>")}
  <meta name=""twitter:card"" content=""summary""/>
  <title>{System.Web.HttpUtility.HtmlEncode(item.FullName)} | اتحاد الغرف التجارية العراقية</title>
  <link href=""https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"" rel=""stylesheet""/>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box}}
    body{{font-family:'Cairo',sans-serif;background:#f0f4f8;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:0;direction:rtl}}
    /* Top header bar */
    .topbar{{width:100%;background:linear-gradient(135deg,#1a1a2e 0%,#2C3E6B 100%);padding:14px 24px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 12px rgba(0,0,0,0.3)}}
    .topbar img{{height:44px;width:auto}}
    .topbar-text{{display:flex;flex-direction:column}}
    .topbar-ar{{color:#fff;font-size:16px;font-weight:800;line-height:1.2}}
    .topbar-en{{color:rgba(255,255,255,0.6);font-size:10px;font-weight:400;letter-spacing:0.5px}}
    /* Back link */
    .back-link{{width:100%;max-width:760px;padding:16px 20px 0;text-align:right}}
    .back-link a{{color:#2C3E6B;font-size:14px;font-weight:700;text-decoration:none}}
    /* Card */
    .wrap{{width:100%;max-width:760px;padding:12px 20px 40px}}
    .card{{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(44,62,107,0.14)}}
    .card-hero{{background:linear-gradient(135deg,#1a1a2e 0%,#2C3E6B 70%,#3a5a9a 100%);padding:40px 24px 32px;text-align:center}}
    .avatar{{width:100px;height:100px;border-radius:50%;border:3px solid rgba(255,255,255,0.4);object-fit:cover;margin:0 auto 18px;display:block;box-shadow:0 4px 20px rgba(0,0,0,0.3)}}
    .avatar-ph{{width:100px;height:100px;border-radius:50%;border:3px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.1);margin:0 auto 18px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:#FFC72C}}
    .member-name{{color:#fff;font-size:24px;font-weight:800;margin-bottom:10px}}
    .badge{{display:inline-block;background:#FFC72C;color:#1a1a2e;padding:6px 18px;border-radius:20px;font-size:13px;font-weight:800;margin-bottom:10px}}
    .chamber-row{{color:rgba(255,255,255,0.75);font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px}}
    /* Body */
    .card-body{{padding:28px 32px}}
    .section-title{{color:#2C3E6B;font-size:15px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px}}
    .bio-box{{background:#FAFBFF;border:1.5px solid #dde3ed;border-radius:12px;padding:16px;color:#555;font-size:14px;line-height:1.9;margin-bottom:24px}}
    .contact-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:24px}}
    .contact-item{{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none}}
    .contact-item.phone{{background:#F0FDF4;border:1.5px solid #bbf7d0}}
    .contact-item.email{{background:#EEF2FF;border:1.5px solid #c7d2fe}}
    .contact-label{{color:#888;font-size:11px;margin-bottom:2px}}
    .contact-val{{font-size:14px;font-weight:700}}
    .contact-val.g{{color:#16a34a}}
    .contact-val.b{{color:#2C3E6B}}
    .share-box{{background:#F8F9FA;border-radius:14px;padding:16px 20px}}
    .share-label{{color:#888;font-size:13px;font-weight:700;margin-bottom:12px}}
    .share-btns{{display:flex;gap:10px}}
    .btn-wa{{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:#25D366;color:#fff;font-size:14px;font-weight:700;text-decoration:none;font-family:'Cairo',sans-serif}}
    .btn-copy{{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:#2C3E6B;color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:'Cairo',sans-serif}}
    .btn-copy:active{{opacity:0.8}}
  </style>
</head>
<body>
  <div class=""topbar"">
    <img src=""{logoUrl}"" alt=""FICC""/>
    <div class=""topbar-text"">
      <span class=""topbar-ar"">اتحاد الغرف التجارية العراقية</span>
      <span class=""topbar-en"">Federation of Iraqi Chambers of Commerce</span>
    </div>
  </div>

  <div class=""back-link""><a href=""{pageUrl}"">← العودة للأعضاء</a></div>

  <div class=""wrap"">
    <div class=""card"">
      <div class=""card-hero"">
        {avatarHtml}
        <div class=""member-name"">{System.Web.HttpUtility.HtmlEncode(item.FullName)}</div>
        {(string.IsNullOrEmpty(item.Title)?"":$@"<div class=""badge"">{System.Web.HttpUtility.HtmlEncode(item.Title)}</div>")}
        {(string.IsNullOrEmpty(item.ChamberName)?"":$@"<div class=""chamber-row"">&#x1F3DB;&#xFE0F; {System.Web.HttpUtility.HtmlEncode(item.ChamberName)}</div>")}
      </div>

      <div class=""card-body"">
        {(string.IsNullOrEmpty(item.Bio)?"":$@"
        <div class=""section-title"">&#x1F4CB; نبذة تعريفية</div>
        <div class=""bio-box"">{System.Web.HttpUtility.HtmlEncode(item.Bio)}</div>")}

        {((item.Phone != null || item.Email != null)?$@"
        <div class=""section-title"">&#x1F4DE; التواصل</div>
        <div class=""contact-grid"">
          {(item.Phone!=null?$@"<a href=""tel:{item.Phone}"" class=""contact-item phone""><span style=""font-size:20px"">&#x1F4DE;</span><div><div class=""contact-label"">الهاتف</div><div class=""contact-val g"">{System.Web.HttpUtility.HtmlEncode(item.Phone)}</div></div></a>":"")}
          {(item.Email!=null?$@"<a href=""mailto:{item.Email}"" class=""contact-item email""><span style=""font-size:20px"">&#x2709;&#xFE0F;</span><div><div class=""contact-label"">البريد</div><div class=""contact-val b"" style=""direction:ltr;text-align:left"">{System.Web.HttpUtility.HtmlEncode(item.Email)}</div></div></a>":"")}
        </div>":"") }

        <div class=""share-box"">
          <div class=""share-label"">&#x1F4E4; شارك:</div>
          <div class=""share-btns"">
            <a class=""btn-wa"" href=""https://wa.me/?text={Uri.EscapeDataString(item.FullName + (item.Title != null ? " — " + item.Title : "") + "\n" + pageUrl)}"" target=""_blank"">&#x1F4AC; واتساب</a>
            <button class=""btn-copy"" onclick=""navigator.clipboard.writeText('{pageUrl}');this.textContent='&#x2705; تم النسخ!';setTimeout(()=>this.innerHTML='&#x1F517; نسخ الرابط',2000)"">&#x1F517; نسخ الرابط</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>";
        return Content(html, "text/html; charset=utf-8");
    }

    [HttpGet("shipping/{id}")]
    public async Task<IActionResult> ShippingOg(int id) {
        var item = await _db.ShippingCompanies.FindAsync(id);
        if (item == null) return Redirect("/shipping");
        var desc = item.Description ?? $"{item.ShippingType ?? "شحن ونقل"} — {item.Governorate ?? "العراق"}";
        return Content(BuildHtml(
            item.CompanyName, desc, item.LogoUrl ?? "",
            $"{Request.Scheme}://{Request.Host}/shipping/{id}",
            Request.Scheme, Request.Host.ToString()
        ), "text/html; charset=utf-8");
    }

    // OG for /contact page
    [HttpGet("contact")]
    public IActionResult ContactOg() {
        var host = Request.Host.ToString();
        var pageUrl = $"https://{host}/contact";
        var logoUrl = $"https://{host}/ficc-logo.jpg";
        return Content(BuildHtml(
            "معلومات الاتصال — اتحاد الغرف التجارية العراقية",
            "تواصل مع اتحاد الغرف التجارية العراقية | 📞 5366 | ✉️ info@ficc.iq | بغداد — شارع السعدون",
            logoUrl, pageUrl,
            Request.Scheme, host
        ), "text/html; charset=utf-8");
    }

    // OG for /startups page
    [HttpGet("startups")]
    public IActionResult StartupsOg() {
        var host = Request.Host.ToString();
        var pageUrl = $"https://{host}/startups";
        var logoUrl = $"https://{host}/uploads/logo.png";
        return Content(BuildHtml(
            "قسم ريادة الأعمال — اتحاد الغرف التجارية العراقية",
            "قدّم مشروعك الريادي واحصل على دعم اتحاد الغرف التجارية العراقية",
            logoUrl, pageUrl,
            Request.Scheme, host
        ), "text/html; charset=utf-8");
    }

    // OG for chat page
    [HttpGet("chat")]
    public IActionResult ChatOg() {
        var host = Request.Host.ToString();
        var pageUrl = $"https://{host}/chat";
        var img = $"https://{host}/uploads/ficc-logo.jpg";
        return Content(BuildHtml(
            "راسلنا | اتحاد الغرف التجارية العراقية",
            "تواصل مع اتحاد الغرف التجارية العراقية — احصل على إجابات فورية لاستفساراتك التجارية والجمركية",
            img, pageUrl, Request.Scheme, host
        ), "text/html; charset=utf-8");
    }

    // OG for subscribe page
    [HttpGet("subscribe")]
    public IActionResult SubscribeOg() {
        var host = Request.Host.ToString();
        var scheme = Request.Scheme;
        var pageUrl = $"https://{host}/subscribe";
        var img = $"https://{host}/uploads/ficc-logo.jpg";
        return Content(BuildHtml(
            "سجّل متابعاً | اتحاد الغرف التجارية العراقية",
            "سجّل الآن لتصلك آخر الأخبار والإعلانات من اتحاد الغرف التجارية العراقية — اختر قطاعاتك وطريقة الإشعار المفضّلة",
            img, pageUrl, scheme, host
        ), "text/html; charset=utf-8");
    }

    // OG for specific startup
    [HttpGet("startups/{id}")]
    public async Task<IActionResult> StartupOg(int id) {
        var s = await _db.Startups.Include(x => x.Attachments).FirstOrDefaultAsync(x => x.Id == id);
        var host = Request.Host.ToString();
        var pageUrl = $"https://{host}/startups/{id}";
        if (s == null) return Redirect(pageUrl);
        var img = s.Attachments?.FirstOrDefault(a => a.FilePath.Contains(".jpg") || a.FilePath.Contains(".jpeg") || a.FilePath.Contains(".png"))?.FilePath ?? $"/uploads/logo.png";
        return Content(BuildHtml(
            $"{s.Name} — ريادة الأعمال",
            $"{s.Description ?? s.OwnerName} | {s.Sector}",
            img, pageUrl,
            Request.Scheme, host
        ), "text/html; charset=utf-8");
    }

}
