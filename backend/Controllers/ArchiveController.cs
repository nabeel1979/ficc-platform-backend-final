using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;
using System.IO;

namespace FICCPlatform.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ArchiveController : ControllerBase {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        
        public ArchiveController(HttpClient http, IConfiguration config) {
            _http = http;
            _config = config;
        }

        private (string user, string pass) GetCredentials() {
            try {
                var credsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config", "archive-creds.json");
                if (File.Exists(credsPath)) {
                    var json = File.ReadAllText(credsPath);
                    using var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;
                    var user = root.GetProperty("archiving_user").GetString();
                    var pass = root.GetProperty("archiving_pass").GetString();
                    return (user, pass);
                }
            } catch { }
            return ("", "");
        }

        [HttpGet("reports/{year}")]
        public async Task<IActionResult> GetReports(int year) {
            try {
                var (user, pass) = GetCredentials();
                if (string.IsNullOrEmpty(user)) {
                    return BadRequest(new { error = "بيانات الدخول غير متوفرة" });
                }

                var client = new HttpClientHandler { UseCookies = true };
                using var handler = client;
                using var httpClient = new HttpClient(handler);

                // دخول نظام الأرشفة
                var loginContent = new StringContent(
                    $"UserName={user}&Password={pass}",
                    Encoding.UTF8,
                    "application/x-www-form-urlencoded");
                
                var loginResp = await httpClient.PostAsync(
                    "https://archiving.gcc.iq/Default.aspx",
                    loginContent);

                // جلب التقارير
                var reportsResp = await httpClient.GetAsync(
                    $"https://archiving.gcc.iq/Reports.aspx?year={year}");

                var content = await reportsResp.Content.ReadAsStringAsync();
                
                return Ok(new {
                    message = $"تم جلب تقارير سنة {year}",
                    year = year,
                    status = reportsResp.StatusCode.ToString(),
                    preview = content.Substring(0, Math.Min(1000, content.Length))
                });
            } catch (Exception e) {
                return BadRequest(new { error = e.Message });
            }
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncReports() {
            // مزامنة التقارير للسنة الحالية
            var year = DateTime.Now.Year;
            return await GetReports(year);
        }
    }
}
