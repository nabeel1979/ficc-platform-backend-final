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

        // Try ZeptoMail HTTP API + Zoho SMTP fallback
        var zeptoKey = _cfg["ZeptoMail:ApiKey"];
        if (!string.IsNullOrEmpty(zeptoKey)) {
            var sent = await SendViaZeptoMail(toEmail, subject, body, zeptoKey);
            if (sent) return true;
            // fallback to Zoho SMTP if ZeptoMail fails
        }

        // Zoho SMTP fallback
        var zohoUser = _cfg["Zoho:Username"] ?? _cfg["Email:Username"];
        var zohoPass = _cfg["Zoho:Password"] ?? _cfg["Email:Password"];
        if (!string.IsNullOrEmpty(zohoUser) && !string.IsNullOrEmpty(zohoPass)) {
            try {
                using var client = new SmtpClient("smtp.zoho.com", 587) {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(zohoUser, zohoPass)
                };
                var fromName = _cfg["ZeptoMail:FromName"] ?? "اتحاد الغرف التجارية العراقية";
                var msg = new MailMessage {
                    From = new MailAddress(zohoUser, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                msg.To.Add(toEmail);
                await client.SendMailAsync(msg);
                _log.LogInformation("Zoho SMTP sent to {Email}", toEmail);
                return true;
            } catch (Exception ex) {
                _log.LogError(ex, "Zoho SMTP failed");
            }
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
            var normalizedPhone = NormalizeIraqiPhone(phone);
            using var http = new HttpClient();

            // رسالة 1: الإشعار — بدون ذكر المرسل
            await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"] = token, ["to"] = normalizedPhone,
                ["body"]  = "رمز التحقق الخاص بك (صالح 10 دقائق):"
            }));
            await Task.Delay(800);

            // رسالة 2: الرمز فقط - قابل للنسخ
            var resp = await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"] = token, ["to"] = normalizedPhone,
                ["body"]  = otp
            }));
            _log.LogInformation("UltraMsg WhatsApp OTP to {Phone}: {Status}", phone, resp.StatusCode);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "UltraMsg WhatsApp OTP send failed");
            return false;
        }
    }

    // إرسال صورة مع نص عبر UltraMsg
    public async Task<bool> SendWhatsAppImage(string phone, string imageUrl, string caption) {
        try {
            var instance = _cfg["UltraMsg:Instance"] ?? "instance167281";
            var token    = _cfg["UltraMsg:Token"] ?? "ilgqrh6v728bosrh";
            var url = $"https://api.ultramsg.com/{instance}/messages/image";
            using var http = new HttpClient();
            var resp = await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"]   = token,
                ["to"]      = NormalizeIraqiPhone(phone),
                ["image"]   = imageUrl,
                ["caption"] = caption
            }));
            var respBody = await resp.Content.ReadAsStringAsync();
            _log.LogInformation("UltraMsg Image to {Phone}: {Status}", phone, resp.StatusCode);
            return resp.IsSuccessStatusCode;
        } catch (Exception ex) {
            _log.LogError(ex, "UltraMsg Image send failed");
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

    // إشعار العميل عند الحجب
    public async Task NotifyClientBlock(string contact, string reason = "")
    {
        var isEmail = contact.Contains('@');
        var waMsg = "عزيزنا المتابع،\n\nنأسف لإبلاغك أنه تم تعليق وصولك مؤقتاً إلى منصة اتحاد الغرف التجارية العراقية.\n\nالسبب: تجاوز عدد المحاولات المسموح بها.\n\nللاستفسار وإلغاء التعليق:\n📞 5366\n✉️ info@ficc.iq\n\nاتحاد الغرف التجارية العراقية 🏛️";

        var htmlMsg = $@"<div dir='rtl' style='font-family:Cairo,Arial,sans-serif;max-width:600px;margin:auto;'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:28px;text-align:center;border-radius:16px 16px 0 0;'>
    <img src='https://ficc.iq/logo.png' height='50' style='margin-bottom:10px;' onerror='this.style.display=&quot;none&quot;'/>
    <h2 style='color:#FFC72C;margin:0;font-size:20px;'>اتحاد الغرف التجارية العراقية</h2>
    <p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;'>Federation of Iraqi Chambers of Commerce</p>
  </div>
  <div style='background:#fff;padding:28px;border:1px solid #e2e8f0;'>
    <div style='background:#FEF2F2;border-right:4px solid #dc2626;padding:16px;border-radius:8px;margin-bottom:20px;'>
      <h3 style='color:#dc2626;margin:0 0 8px;font-size:16px;'>⚠️ تم تعليق وصولك مؤقتاً</h3>
      <p style='color:#7f1d1d;margin:0;font-size:13px;'>تجاوز عدد المحاولات المسموح بها</p>
    </div>
    <p style='color:#444;font-size:14px;line-height:1.8;'>عزيزنا المتابع،</p>
    <p style='color:#444;font-size:14px;line-height:1.8;'>نأسف لإبلاغك أنه تم تعليق وصولك إلى المنصة مؤقتاً بسبب تجاوز عدد المحاولات المسموح بها.</p>
    <p style='color:#444;font-size:14px;line-height:1.8;'>سيُفك التعليق تلقائياً خلال <b>ساعة واحدة</b>. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل معنا:</p>
    <div style='background:#F8F9FA;border-radius:10px;padding:16px;margin:16px 0;text-align:center;'>
      <p style='margin:0 0 6px;font-size:14px;'>📞 الرقم المختصر: <b style='color:#2C3E6B;font-size:18px;'>5366</b></p>
      <p style='margin:0;font-size:13px;color:#666;'>✉️ info@ficc.iq</p>
    </div>
  </div>
  <div style='background:#F5F7FA;padding:14px;text-align:center;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;'>
    <p style='color:#888;font-size:11px;margin:0;'>© 2026 اتحاد الغرف التجارية العراقية | ficc.iq</p>
  </div>
</div>";

        if (isEmail)
            await SendEmail(contact, "⚠️ تم تعليق وصولك مؤقتاً | اتحاد الغرف التجارية العراقية", htmlMsg);
        else {
            var phone = NormalizeIraqiPhone(contact);
            var url = $"https://api.ultramsg.com/{(_cfg["UltraMsg:Instance"] ?? "instance167281")}/messages/chat";
            using var http2 = new HttpClient();
            await http2.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"] = _cfg["UltraMsg:Token"] ?? "ilgqrh6v728bosrh",
                ["to"] = phone, ["body"] = waMsg
            }));
        }
    }

    // إشعار العميل عند فك الحجب
    public async Task NotifyClientUnblock(string contact)
    {
        var isEmail = contact.Contains('@');
        var waMsg = "عزيزنا المتابع،\n\nيسعدنا إبلاغك أنه تم رفع التعليق عن حسابك على منصة اتحاد الغرف التجارية العراقية.\n\nيمكنك الآن الوصول إلى المنصة بشكل طبيعي.\n\n🔗 ficc.iq\n\nاتحاد الغرف التجارية العراقية 🏛️";

        var htmlMsg = $@"<div dir='rtl' style='font-family:Cairo,Arial,sans-serif;max-width:600px;margin:auto;'>
  <div style='background:linear-gradient(135deg,#2C3E6B,#4A6FA5);padding:28px;text-align:center;border-radius:16px 16px 0 0;'>
    <img src='https://ficc.iq/logo.png' height='50' style='margin-bottom:10px;' onerror='this.style.display=&quot;none&quot;'/>
    <h2 style='color:#FFC72C;margin:0;font-size:20px;'>اتحاد الغرف التجارية العراقية</h2>
    <p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;'>Federation of Iraqi Chambers of Commerce</p>
  </div>
  <div style='background:#fff;padding:28px;border:1px solid #e2e8f0;'>
    <div style='background:#F0FDF4;border-right:4px solid #16a34a;padding:16px;border-radius:8px;margin-bottom:20px;'>
      <h3 style='color:#16a34a;margin:0 0 8px;font-size:16px;'>✅ تم رفع التعليق عن حسابك</h3>
      <p style='color:#14532d;margin:0;font-size:13px;'>يمكنك الوصول إلى المنصة بشكل طبيعي الآن</p>
    </div>
    <p style='color:#444;font-size:14px;line-height:1.8;'>عزيزنا المتابع،</p>
    <p style='color:#444;font-size:14px;line-height:1.8;'>يسعدنا إبلاغك أنه تم رفع التعليق عن حسابك، ويمكنك الآن استخدام خدمات منصة اتحاد الغرف التجارية العراقية بشكل طبيعي.</p>
    <div style='text-align:center;margin:20px 0;'>
      <a href='https://ficc.iq/subscribe' style='background:#2C3E6B;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;'>
        🔗 الدخول إلى المنصة
      </a>
    </div>
  </div>
  <div style='background:#F5F7FA;padding:14px;text-align:center;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;'>
    <p style='color:#888;font-size:11px;margin:0;'>© 2026 اتحاد الغرف التجارية العراقية | ficc.iq</p>
  </div>
</div>";

        if (isEmail)
            await SendEmail(contact, "✅ تم رفع التعليق عن حسابك | اتحاد الغرف التجارية العراقية", htmlMsg);
        else {
            var phone = NormalizeIraqiPhone(contact);
            var url = $"https://api.ultramsg.com/{(_cfg["UltraMsg:Instance"] ?? "instance167281")}/messages/chat";
            using var http = new HttpClient();
            await http.PostAsync(url, new FormUrlEncodedContent(new Dictionary<string,string>{
                ["token"] = _cfg["UltraMsg:Token"] ?? "ilgqrh6v728bosrh",
                ["to"] = phone, ["body"] = waMsg
            }));
        }
    }
}
