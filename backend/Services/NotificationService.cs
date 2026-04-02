using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

namespace FICCPlatform.Services;

public class NotificationService {
    private readonly IConfiguration _cfg;
    private readonly ILogger<NotificationService> _log;

    public NotificationService(IConfiguration cfg, ILogger<NotificationService> log) {
        _cfg = cfg; _log = log;
    }

    public async Task<bool> SendEmail(string toEmail, string subject, string body) {
        // Try Brevo HTTP API first (reliable)
        var brevoKey = _cfg["Brevo:ApiKey"];
        if (!string.IsNullOrEmpty(brevoKey) && !brevoKey.Contains("YOUR_BREVO")) {
            return await SendViaBrevo(toEmail, subject, body, brevoKey);
        }

        // Try ZeptoMail HTTP API
        var zeptoKey = _cfg["ZeptoMail:ApiKey"];
        if (!string.IsNullOrEmpty(zeptoKey)) {
            return await SendViaZeptoMail(toEmail, subject, body, zeptoKey);
        }

        // Fallback: SMTP (may be blocked on some hosts)
        try {
            var smtp = _cfg["Email:SmtpHost"];
            var port = int.Parse(_cfg["Email:SmtpPort"] ?? "587");
            var user = _cfg["Email:Username"];
            var pass = _cfg["Email:Password"];
            var from = _cfg["Email:From"] ?? user;
            if (string.IsNullOrEmpty(smtp) || string.IsNullOrEmpty(user)) {
                _log.LogWarning("Email not configured. Would send to {Email}", toEmail);
                return false;
            }
            using var client = new SmtpClient(smtp, port) {
                EnableSsl = true,
                Credentials = new NetworkCredential(user, pass)
            };
            var msg = new MailMessage(from!, toEmail, subject, body) { IsBodyHtml = true };
            await client.SendMailAsync(msg);
            _log.LogInformation("Email sent via SMTP to {Email}", toEmail);
            return true;
        } catch (Exception ex) {
            _log.LogError(ex, "SMTP email send failed");
            return false;
        }
    }

    private async Task<bool> SendViaZeptoMail(string toEmail, string subject, string htmlBody, string apiKey) {
        try {
            var fromEmail = _cfg["ZeptoMail:From"] ?? _cfg["Email:Username"] ?? "noreply@ficc.iq";
            var fromName  = _cfg["ZeptoMail:FromName"] ?? _cfg["Email:FromName"] ?? "اتحاد الغرف التجارية العراقية";
            var payload = new {
                from = new { address = fromEmail, name = fromName },
                to = new[] { new { email_address = new { address = toEmail } } },
                subject = subject,
                htmlbody = htmlBody
            };
            using var http = new HttpClient();
            // apiKey قد يحتوي بالفعل على "Zoho-enczapikey" — نتجنب التكرار
            var authHeader = apiKey.StartsWith("Zoho-enczapikey") ? apiKey : $"Zoho-enczapikey {apiKey}";
            http.DefaultRequestHeaders.Add("Authorization", authHeader);
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var resp = await http.PostAsync("https://api.zeptomail.com/v1.1/email", content);
            var respBody = await resp.Content.ReadAsStringAsync();
            if (resp.IsSuccessStatusCode)
                _log.LogInformation("ZeptoMail send to {Email}: {Status}", toEmail, resp.StatusCode);
            else
                _log.LogError("ZeptoMail failed to {Email}: {Status} — {Body}", toEmail, resp.StatusCode, respBody);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "ZeptoMail send failed");
            return false;
        }
    }

    private async Task<bool> SendViaBrevo(string toEmail, string subject, string htmlBody, string apiKey) {
        try {
            var fromEmail = _cfg["Email:Username"] ?? "noreply.gcc.iq@gmail.com";
            var fromName  = "اتحاد الغرف التجارية العراقية";

            var payload = new {
                sender = new { name = fromName, email = fromEmail },
                to = new[] { new { email = toEmail } },
                subject = subject,
                htmlContent = htmlBody
            };

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("api-key", apiKey);
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var resp = await http.PostAsync("https://api.brevo.com/v3/smtp/email", content);
            var respBody = await resp.Content.ReadAsStringAsync();
            _log.LogInformation("Brevo send to {Email}: {Status} {Body}", toEmail, resp.StatusCode, respBody);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "Brevo email send failed");
            return false;
        }
    }

    // Send OTP via Twilio Direct SMS (Alphanumeric Sender "FICC")
    // Works for Iraq +9647 — bypasses Verify geo-block
        // تحويل رقم عراقي إلى صيغة دولية
    private static string NormalizeIraqiPhone(string phone) {
        phone = phone.Trim().Replace(" ", "").Replace("-", "");
        if (phone.StartsWith("00964")) return "+" + phone.Substring(2);
        if (phone.StartsWith("0964"))  return "+" + phone.Substring(1);
        if (phone.StartsWith("+964"))  return phone;
        if (phone.StartsWith("07"))    return "+964" + phone.Substring(1);
        if (phone.StartsWith("7"))     return "+964" + phone;
        return phone;
    }

    // إرسال OTP عبر واتساب (UltraMsg)
    public async Task<bool> SendWhatsAppOtp(string phone, string otp) {
        try {
            var instance = _cfg["UltraMsg:Instance"] ?? "instance167281";
            var token    = _cfg["UltraMsg:Token"] ?? "ilgqrh6v728bosrh";
            var url = $"https://api.ultramsg.com/{instance}/messages/chat";
            using var http = new HttpClient();
            var body = $"🏛️ *اتحاد الغرف التجارية العراقية*\n\nرمز التحقق: *{otp}*\n\nصالح 10 دقائق — لا تشاركه مع أحد ✅";
            var resp = await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"] = token,
                ["to"]    = NormalizeIraqiPhone(phone),
                ["body"]  = body
            }));
            var respBody = await resp.Content.ReadAsStringAsync();
            _log.LogInformation("UltraMsg WhatsApp OTP to {Phone}: {Status} {Body}", phone, resp.StatusCode, respBody);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "UltraMsg WhatsApp OTP send failed");
            return false;
        }
    }

    public async Task<bool> SendTwilioSms(string phone, string otp) {
        try {
            var sid   = _cfg["Twilio:AccountSid"];
            var token = _cfg["Twilio:AuthToken"];
            if (string.IsNullOrEmpty(sid) || string.IsNullOrEmpty(token)) return false;

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json";
            using var http = new HttpClient();
            http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{sid}:{token}"))
            );
            var body = $"اتحاد الغرف التجارية العراقية\nرمز التحقق: {otp}\nصالح 10 دقائق\nلا تشاركه مع أحد";
            var resp = await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["To"]   = NormalizeIraqiPhone(phone),
                ["From"] = _cfg["Twilio:From"] ?? _cfg["Twilio__From"] ?? "FICC-Iraq",
                ["Body"] = body
            }));
            var respBody = await resp.Content.ReadAsStringAsync();
            _log.LogInformation("Twilio SMS to {Phone}: {Status} {Body}", phone, resp.StatusCode, respBody);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "Twilio SMS send failed");
            return false;
        }
    }

    // Send general SMS (not OTP) via Twilio
    public async Task<bool> SendSmsText(string phone, string message) {
        try {
            var sid   = _cfg["Twilio:AccountSid"];
            var token = _cfg["Twilio:AuthToken"];
            if (string.IsNullOrEmpty(sid) || string.IsNullOrEmpty(token)) return false;
            var url = $"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json";
            using var http = new HttpClient();
            http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{sid}:{token}"))
            );
            var resp = await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["To"]   = NormalizeIraqiPhone(phone),
                ["From"] = _cfg["Twilio:From"] ?? "FICC-Iraq",
                ["Body"] = message
            }));
            _log.LogInformation("SMS to {Phone}: {Status}", phone, resp.StatusCode);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "SMS send failed");
            return false;
        }
    }

    // Legacy: Twilio Verify (blocked for Iraq +9647 — use SendTwilioSms instead)
    public async Task<bool> SendTwilioVerify(string phone) {
        return await SendTwilioSms(phone, GenerateOtp());
    }

    public async Task<bool> CheckTwilioVerify(string phone, string code) {
        // Verify is now handled locally via OtpCodes table
        return false;
    }

    // Generate local OTP (for email)
    public string GenerateOtp(int length = 6) {
        var rng = new Random();
        return string.Concat(Enumerable.Range(0, length).Select(_ => rng.Next(0, 10)));
    }

    public string OtpEmailHtml(string otp, string purpose) {
        return $"<div dir='rtl' style='font-family:Cairo,Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #dde3ed;border-radius:16px;'><h2 style='color:#2C3E6B;'>اتحاد الغرف التجارية العراقية</h2><p style='color:#444;font-size:16px;'>{purpose}</p><div style='background:#EEF2FF;border-radius:12px;padding:20px;text-align:center;'><p style='color:#888;font-size:13px;margin:0 0 8px;'>رمز التحقق</p><span style='font-size:36px;font-weight:800;color:#2C3E6B;letter-spacing:8px;'>{otp}</span><p style='color:#888;font-size:12px;margin:8px 0 0;'>صالح 10 دقائق</p></div></div>";
    }
}
