# Database Backups — قاعدة البيانات

## 📋 الملفات المحفوظة

### آخر نسخة احتياطية:
- **FICCPlatform_2026-04-11_09-03.bak** (18MB)
  - التاريخ: 2026-04-11 09:03 UTC
  - الحجم: 18 MB
  - الحالة: ✅ صحيح

---

## 🔄 دورة النسخ الاحتياطية

**الجدول الزمني:**
- ✅ كل 6 ساعات (تلقائياً على الـ Server)
- ✅ يومياً (نسخة يدوية تُرفع للـ GitHub)
- ✅ يومياً (نسخة backup في `/backups/` folder)

**المدة المحفوظة:**
- Server: 21+ ملف (من 2026-04-03)
- GitHub: آخر نسخة فقط
- `/backups/`: 7 أيام

---

## 💾 استرجاع النسخة

### في Windows Server:

```sql
-- افتح SQL Server Management Studio
-- انقر بيمين على قاعدة البيانات
-- Select: Restore Database...
-- Select Device: اختر الـ .bak file
-- OK
```

### في Docker:

```bash
docker cp database-backups/FICCPlatform_2026-04-11_09-03.bak ficc-sqlserver:/var/opt/mssql/backup/

docker exec ficc-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P PASSWORD \
  -Q "RESTORE DATABASE [FICCPlatform] FROM DISK = '/var/opt/mssql/backup/FICCPlatform_2026-04-11_09-03.bak' WITH REPLACE"
```

---

## 📊 معلومات قاعدة البيانات

| الخاصية | القيمة |
|--------|--------|
| **Database Name** | FICCPlatform |
| **Server** | SQL Server 2022 |
| **Size** | ~18 MB |
| **Tables** | 45+ |
| **Backups Schedule** | كل 6 ساعات |

---

## ⚠️ تنبيهات الأمان

- ✅ النسخ الاحتياطية **آمنة محلياً**
- ✅ النسخ الاحتياطية **محفوظة بـ GitHub**
- ✅ النسخ الاحتياطية **محدثة يومياً**
- ⚠️ الملفات الكبيرة قد تحتاج وقت لـ restore

---

## 📅 آخر تحديث

```
2026-04-11 11:41 UTC
Backup: FICCPlatform_2026-04-11_09-03.bak
Status: ✅ محدث
```

---

**نسخ احتياطية آمنة!** 🛡️
