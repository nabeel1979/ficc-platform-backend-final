# FICC Platform Backend - Setup Guide

## خطوات التثبيت على سيرفر جديد

### 1️⃣ نسخ ملف الإعدادات

```bash
# انسخ الملف
cp appsettings.TEMPLATE.json appsettings.json
```

### 2️⃣ تحديث معلومات الاتصال

**افتح `appsettings.json` وعدّل:**

```json
"DefaultConnection": "Server=YOUR_SERVER_NAME;Database=YOUR_DATABASE_NAME;User Id=YOUR_USERNAME;Password=YOUR_PASSWORD;TrustServerCertificate=true;"
```

**المتغيرات:**
- `YOUR_SERVER_NAME`: اسم السيرفر (مثل: `localhost\SQLEXPRESS`)
- `YOUR_DATABASE_NAME`: اسم قاعدة البيانات (مثل: `FICCPlatform`)
- `YOUR_USERNAME`: اسم المستخدم (مثل: `sa`)
- `YOUR_PASSWORD`: كلمة السر

### 3️⃣ تحديث Secret Key

```json
"Secret": "أضيف مفتاح سري عشوائي 32 حرف على الأقل"
```

### 4️⃣ تحديث CORS Origins

إذا كان السيرفر مختلف، حدّث:

```json
"AllowedOrigins": [
  "http://your-frontend-url",
  "https://your-domain.com"
]
```

### 5️⃣ تشغيل المشروع

```bash
dotnet run
```

---

## ⚠️ أمان مهم

- **لا تنسخ `appsettings.json` على GitHub!**
- احفظها محلياً فقط
- غيّر كلمة السر في السيرفر الجديد
- استخدم مفتاح سري قوي

---

## قاعدة البيانات

الـ migrations موجودة في مجلد `Migrations/`

```bash
# تطبيق الـ migrations
dotnet ef database update
```

---

## المزيد من المساعدة

راجع المستندات الرسمية في GitHub.
