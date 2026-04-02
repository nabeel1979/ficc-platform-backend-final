# طريقة التشغيل — FICC Platform

## الطريقة 1: تشغيل يدوي (Windows أو Linux)

### المتطلبات
- .NET 8 SDK: https://dotnet.microsoft.com/download
- Node.js 18+: https://nodejs.org
- SQL Server (أو SQL Server Express): https://www.microsoft.com/sql-server

### الخطوات

#### 1. إعداد قاعدة البيانات
```sql
-- شغّل بـ SQL Server Management Studio أو sqlcmd
sqlcmd -S localhost -U sa -P YourPassword -i schema.sql
sqlcmd -S localhost -U sa -P YourPassword -i schema_forms.sql
sqlcmd -S localhost -U sa -P YourPassword -i schema_directories.sql
```

#### 2. إعداد الـ Backend
```
cd backend
-- عدّل appsettings.json:
-- Server=localhost;Database=FICCPlatform;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
dotnet restore
dotnet run
```

#### 3. إعداد الـ Frontend
```
cd frontend
npm install
npm run dev
```

### Windows: شغّل start-windows.bat مباشرة
### Linux/Mac: شغّل ./start-linux.sh

---

## الطريقة 2: Docker (الأسهل — يشتغل على Windows و Linux)

### المتطلبات
- Docker Desktop: https://www.docker.com/products/docker-desktop

### التشغيل
```bash
docker-compose up -d
```

### الروابط
- **الموقع:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Swagger:** http://localhost:5000/swagger

### إيقاف التشغيل
```bash
docker-compose down
```

---

## الروابط بعد التشغيل
| الخدمة | Windows/Linux | Docker |
|---|---|---|
| الموقع | http://localhost:5173 | http://localhost:3000 |
| API | http://localhost:5000 | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger | http://localhost:5000/swagger |

## دخول المدير
- **اسم المستخدم:** admin
- **كلمة المرور:** Admin@123 (غيّرها أول دخول!)
