# منصة اتحاد الغرف التجارية العراقية (FICC Platform)

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS (RTL)
- **Backend:** ASP.NET Core 8 Web API (C#)
- **Database:** SQL Server

## الموديولات
- 🏛️ الغرف التجارية
- 👥 الأعضاء والشركات
- 📋 دليل التجار والشركات
- 🎪 المعارض التجارية
- 🎤 المؤتمرات والفعاليات
- 📰 الأخبار والإعلانات
- 📄 الشهادات
- 📋 الطلبات والخدمات
- 🔐 لوحة تحكم إدارية

## الإعداد

### 1. قاعدة البيانات
```sql
-- شغّل ملف schema.sql على SQL Server
sqlcmd -S YOUR_SERVER -i schema.sql
```

### 2. الـ Backend (ASP.NET Core)
```bash
cd backend
# عدّل appsettings.json (ConnectionString + JwtSettings)
dotnet restore
dotnet run
# يشتغل على: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### 3. الـ Frontend (React)
```bash
cd frontend
npm install
npm run dev
# يشتغل على: http://localhost:5173
```

## البيئة المطلوبة
- .NET 8 SDK
- Node.js 18+
- SQL Server 2019+

## API Endpoints
| Endpoint | الوصف |
|---|---|
| GET /api/chambers | جميع الغرف |
| GET /api/members | جميع الأعضاء |
| GET /api/traderdirectory | دليل التجار |
| GET /api/exhibitions | المعارض |
| GET /api/conferences | المؤتمرات |
| GET /api/news | الأخبار |
| POST /api/auth/login | تسجيل الدخول |

## الألوان
- **أخضر:** #1a5c1a
- **ذهبي:** #c8a400
