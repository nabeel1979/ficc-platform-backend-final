# CREDENTIALS.md — معلومات التكوين

⚠️ **هذا الملف لا يحتوي على credentials حقيقية — احفظ credentials السيرفر في مكان آمن**

## إعداد قاعدة البيانات
```
Server: ficc-sqlserver,1433
Database: FICCPlatform
User: sa
Password: *** (حدده في docker-compose.yml أو env variables)
```

## JWT
```
Secret: *** (حدده في appsettings.json — يجب أن يكون 32+ حرف)
Issuer: FICCPlatform
Audience: FICCPlatformUsers
```

## خدمات البريد والـ SMS
- **ZeptoMail:** احصل على API key من https://www.zeptomail.com
- **Twilio:** احصل على credentials من https://console.twilio.com
- **Zoho SMTP:** يمكن استخدامه كـ fallback

## تغيير الـ Credentials
عدّل `backend/appsettings.json` أو مرّر env variables في `docker-compose.yml`

## الوصول للأدمن
- **URL:** http://localhost:5173/admin
- **Username:** admin
- **Password:** Admin@2026 (غيّرها بعد أول دخول!)
