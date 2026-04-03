# FICC Platform — Windows Server Setup Guide

## المتطلبات الأساسية

### 1. .NET 8 SDK
- رابط التحميل: https://dotnet.microsoft.com/en-us/download/dotnet/8.0
- نسخة: .NET 8.0 SDK (x64) — Windows

### 2. Node.js
- رابط التحميل: https://nodejs.org/en/download
- نسخة: v20 LTS أو أحدث

### 3. SQL Server
- رابط التحميل: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- نسخة: SQL Server 2019/2022 (Developer أو Express)
- أو: Docker Desktop + SQL Server image

### 4. Docker Desktop (اختياري)
- رابط التحميل: https://www.docker.com/products/docker-desktop
- يُستخدم لتشغيل SQL Server كـ container

---

## طريقة التشغيل على ويندوز (بدون Docker)

### الخطوة 1: إنشاء قاعدة البيانات
```sql
CREATE DATABASE FICCPlatform;
```

### الخطوة 2: إعداد Backend
```bash
cd backend
# تعديل appsettings.json
# ConnectionStrings__DefaultConnection = Server=localhost;Database=FICCPlatform;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;

dotnet restore
dotnet ef database update   # تطبيق الـ migrations
dotnet run
```

### الخطوة 3: إعداد Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## المتغيرات البيئية المطلوبة (appsettings.json أو Environment Variables)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FICCPlatform;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Secret": "FICCPlatformSuperSecretJwtKey2026IraqChambers",
    "Issuer": "FICCPlatform",
    "Audience": "FICCPlatformUsers",
    "ExpiryDays": 7
  },
  "UltraMsg": {
    "Instance": "instance167281",
    "Token": "YOUR_ULTRAMSG_TOKEN"
  },
  "ZeptoMail": {
    "ApiKey": "YOUR_ZEPTO_API_KEY",
    "From": "noreply@ficc.iq",
    "FromName": "اتحاد الغرف التجارية العراقية"
  }
}
```

---

## طريقة التشغيل بـ Docker على ويندوز

```bash
# تأكد Docker Desktop شغّال
docker compose up -d
```

---

## الروابط الافتراضية

| الخدمة | الرابط |
|--------|--------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Swagger | http://localhost:5000/swagger |

---

## ملاحظات مهمة
- تأكد من تفعيل SQL Server Authentication
- تأكد من فتح Port 1433 في الـ Firewall
- ملف الـ uploads يُخزن في: `backend/wwwroot/uploads/`
- أي مشكلة: راجع `docker logs ficc-backend`

---

## النسخ الاحتياطي التلقائي (Automated Backup)

### الجدول الزمني
- كل **6 ساعات** تلقائياً
- يُحتفظ بـ **آخر 7 نسخ** فقط
- الملفات: `/backups/ficc/FICCPlatform_YYYY-MM-DD_HH-MM.bak`
- السجل: `/backups/ficc/backup.log`

### تشغيل يدوي
```bash
/root/backup-db.sh
```

### على ويندوز — مجدول عبر Task Scheduler
```powershell
# إنشاء مهمة مجدولة
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\ficc\backup-db.ps1"
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 6) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "FICC DB Backup" -Action $action -Trigger $trigger -RunLevel Highest
```
