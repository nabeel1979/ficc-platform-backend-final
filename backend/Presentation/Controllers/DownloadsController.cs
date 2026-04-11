using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace FICCPlatform.Controllers;

[ApiController]
[Route("api/downloads")]
public class DownloadsController : ControllerBase {

    [HttpGet("scanner-setup")]
    public IActionResult GetScannerSetup() {
        try {
            // في Docker: /app/../FICC-Scanner-Source.zip = ملف خارج Container
            // الحل: اعتمد على GitHub بدل الملف المحلي
            return Redirect("https://github.com/nabeel1979/ficc-platform/raw/main/FICC-Scanner-Source.zip");
        } catch (Exception ex) {
            return BadRequest(new { message = $"خطأ: {ex.Message}" });
        }
    }

    [HttpGet("scanner-setup-windows")]
    public IActionResult GetScannerSetupWindows() {
        try {
            // الحل الأفضل: احول المستخدم لـ GitHub لتحميل الملف
            // من هناك يقدر يبني الـ Setup.exe بنفسه
            return Redirect("https://github.com/nabeel1979/ficc-platform/archive/refs/heads/main.zip");
        } catch (Exception ex) {
            return BadRequest(new { message = $"خطأ: {ex.Message}" });
        }
    }

    [HttpGet("scanner-instructions")]
    public IActionResult GetInstructions() {
        return Ok(new {
            title = "تثبيت FICC Scanner",
            steps = new[] {
                new { step = 1, title = "تحميل الملف", description = "انقر على 'تحميل FICC Scanner'" },
                new { step = 2, title = "التثبيت", description = "قم بتشغيل ملف الإعداد FICC-Scanner-Setup.exe" },
                new { step = 3, title = "التشغيل", description = "ابحث عن 'FICC Scanner' في قائمة البرامج" },
                new { step = 4, title = "الاتصال", description = "سيتم الاتصال تلقائياً بالموقع" }
            },
            download = "/api/downloads/scanner-setup-windows",
            support = "https://ficc.iq/help"
        });
    }
}
