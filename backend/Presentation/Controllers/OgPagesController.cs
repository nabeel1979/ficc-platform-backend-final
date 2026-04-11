using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FICCPlatform.Data;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("og")]
public class OgPagesController : ControllerBase {
    private readonly AppDbContext _db;
    public OgPagesController(AppDbContext db) { _db = db; }
    private string PageHtml(string pageTitle, string description, string pageUrl, string imageUrl) => $@"<!DOCTYPE html>
<html lang=""ar"" dir=""rtl"">
<head>
  <meta charset=""UTF-8""/>
  <meta property=""og:type"" content=""website""/>
  <meta property=""og:site_name"" content=""منصة اتحاد الغرف التجارية العراقية""/>
  <meta property=""og:title"" content=""{pageTitle}""/>
  <meta property=""og:description"" content=""{description}""/>
  <meta property=""og:url"" content=""{pageUrl}""/>
  <meta property=""og:image"" content=""{imageUrl}""/>
  <meta property=""og:image:width"" content=""800""/>
  <meta property=""og:image:height"" content=""800""/>
  <meta name=""twitter:card"" content=""summary""/>
  <meta name=""twitter:title"" content=""{pageTitle}""/>
  <meta name=""twitter:image"" content=""{imageUrl}""/>
  <title>{pageTitle} | اتحاد الغرف التجارية العراقية</title>
  <script>window.location.href='{pageUrl}';</script>
</head>
<body><p>جاري التحويل... <a href=""{pageUrl}"">اضغط هنا</a></p></body>
</html>";

    private string BaseUrl => $"https://{Request.Host}";
    private string Logo => $"https://{Request.Host}/uploads/ficc-logo.jpg";

    [HttpGet("home")]      public IActionResult Home()      => Content(PageHtml("الصفحة الرئيسية","منصة اتحاد الغرف التجارية العراقية الرسمية",$"{BaseUrl}/",Logo),"text/html;charset=utf-8");
    [HttpGet("chambers")]  public IActionResult Chambers()  => Content(PageHtml("الغرف التجارية العراقية","دليل جميع الغرف التجارية العراقية في المحافظات",$"{BaseUrl}/chambers",Logo),"text/html;charset=utf-8");
    [HttpGet("members")]   public IActionResult Members()   => Content(PageHtml("أعضاء مجلس الاتحاد","أعضاء مجلس اتحاد الغرف التجارية العراقية من جميع المحافظات",$"{BaseUrl}/members",Logo),"text/html;charset=utf-8");
    [HttpGet("news")]      public IActionResult News()      => Content(PageHtml("أخبار اتحاد الغرف التجارية العراقية","آخر أخبار وإعلانات اتحاد الغرف التجارية العراقية",$"{BaseUrl}/news",Logo),"text/html;charset=utf-8");
    [HttpGet("exhibitions")] public IActionResult Exhibitions() => Content(PageHtml("المعارض التجارية العراقية","المعارض التجارية في العراق — سجّل مشاركتك",$"{BaseUrl}/exhibitions",Logo),"text/html;charset=utf-8");
    [HttpGet("conferences")] public IActionResult Conferences() => Content(PageHtml("المؤتمرات الاقتصادية العراقية","المؤتمرات الاقتصادية والتجارية في العراق",$"{BaseUrl}/conferences",Logo),"text/html;charset=utf-8");
    [HttpGet("traders")]   public IActionResult Traders()   => Content(PageHtml("دليل التجار والشركات العراقية","دليل الشركات والتجار المسجلين بالاتحاد",$"{BaseUrl}/directory",Logo),"text/html;charset=utf-8");
    [HttpGet("lawyers")]   public IActionResult Lawyers()   => Content(PageHtml("دليل المحامين التجاريين","دليل المحامين التجاريين المعتمدين",$"{BaseUrl}/lawyers",Logo),"text/html;charset=utf-8");
    [HttpGet("shipping")] public IActionResult Shipping() => Content(PageHtml("دليل شركات الشحن والنقل","دليل شركات الشحن البري والبحري والجوي واللوجستيات في العراق",$"{BaseUrl}/shipping",Logo),"text/html;charset=utf-8");
    [HttpGet("directory")] public IActionResult Directory() => Content(PageHtml("دليل التجار والشركات العراقية","دليل الشركات والتجار المسجلين بالاتحاد",$"{BaseUrl}/directory",Logo),"text/html;charset=utf-8");
    [HttpGet("agents")]    public IActionResult Agents()    => Content(PageHtml("دليل وكلاء الإخراج الكمركي","دليل وكلاء الإخراج الكمركي المعتمدين",$"{BaseUrl}/customs-agents",Logo),"text/html;charset=utf-8");

    // Individual member/chamber/trader/shipping OG pages
    [HttpGet("members/{id:int}")]
    public async Task<IActionResult> MemberDetail(int id) {
        var m = await _db.Members.FindAsync(id);
        if (m == null) return Content(PageHtml("عضو مجلس الاتحاد","اتحاد الغرف التجارية العراقية",$"{BaseUrl}/members/{id}",Logo),"text/html;charset=utf-8");
        var img = !string.IsNullOrEmpty(m.PhotoUrl) ? $"{BaseUrl}{m.PhotoUrl}" : Logo;
        var title = m.FullName + (m.Title != null ? $" — {m.Title}" : "");
        var desc = (m.ChamberName ?? "") + (m.Bio != null ? $" | {m.Bio.Substring(0, Math.Min(m.Bio.Length,100))}" : "");
        return Content(PageHtml(title, desc, $"{BaseUrl}/members/{id}", img), "text/html;charset=utf-8");
    }

    [HttpGet("chambers/{id:int}")]
    public async Task<IActionResult> ChamberDetail(int id) {
        var c = await _db.Chambers.FindAsync(id);
        if (c == null) return Content(PageHtml("غرفة تجارية","اتحاد الغرف التجارية العراقية",$"{BaseUrl}/chambers/{id}",Logo),"text/html;charset=utf-8");
        var img = !string.IsNullOrEmpty(c.LogoUrl) ? $"{BaseUrl}{c.LogoUrl}" : Logo;
        return Content(PageHtml(c.Name, c.Description ?? $"غرفة تجارة {c.Governorate}", $"{BaseUrl}/chambers/{id}", img), "text/html;charset=utf-8");
    }

    [HttpGet("directory/{id:int}")]
    public async Task<IActionResult> TraderDetail(int id) {
        var t = await _db.TraderDirectory.FindAsync(id);
        if (t == null) return Content(PageHtml("دليل الشركات","اتحاد الغرف التجارية العراقية",$"{BaseUrl}/directory/{id}",Logo),"text/html;charset=utf-8");
        var img = !string.IsNullOrEmpty(t.LogoUrl) ? $"{BaseUrl}{t.LogoUrl}" : Logo;
        return Content(PageHtml(t.TradeName ?? t.CompanyName ?? "", t.Description ?? t.BusinessType ?? "", $"{BaseUrl}/directory/{id}", img), "text/html;charset=utf-8");
    }

    [HttpGet("shipping/{id:int}")]
    public async Task<IActionResult> ShippingDetail(int id) {
        var s = await _db.ShippingCompanies.FindAsync(id);
        if (s == null) return Content(PageHtml("شركة شحن","اتحاد الغرف التجارية العراقية",$"{BaseUrl}/shipping/{id}",Logo),"text/html;charset=utf-8");
        var img = !string.IsNullOrEmpty(s.LogoUrl) ? $"{BaseUrl}{s.LogoUrl}" : Logo;
        return Content(PageHtml(s.CompanyName, s.Description ?? "شركة شحن ونقل", $"{BaseUrl}/shipping/{id}", img), "text/html;charset=utf-8");
    }

    // Registration form OG pages
    [HttpGet("register")]         public IActionResult Register()        => Content(PageHtml("طلب إضافة — اتحاد الغرف التجارية العراقية","قدّم طلب إضافة بياناتك إلى منصة اتحاد الغرف التجارية العراقية",$"{BaseUrl}/register",Logo),"text/html;charset=utf-8");
    [HttpGet("register/chamber")] public IActionResult RegisterChamber() => Content(PageHtml("استمارة إضافة إلى دليل الغرف التجارية","أضف غرفتك التجارية إلى دليل الغرف التجارية العراقية الرسمية",$"{BaseUrl}/register/chamber",Logo),"text/html;charset=utf-8");
    [HttpGet("register/member")]  public IActionResult RegisterMember()  => Content(PageHtml("استمارة إضافة عضو مجلس الاتحاد","أضف بياناتك كعضو في مجلس اتحاد الغرف التجارية العراقية",$"{BaseUrl}/register/member",Logo),"text/html;charset=utf-8");
    [HttpGet("register/trader")]  public IActionResult RegisterTrader()  => Content(PageHtml("استمارة إضافة إلى دليل الشركات","أضف شركتك إلى دليل الشركات التابع لاتحاد الغرف التجارية العراقية",$"{BaseUrl}/register/trader",Logo),"text/html;charset=utf-8");
}
