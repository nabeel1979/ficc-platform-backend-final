#!/bin/bash
# ===================================================
# FICC Platform — Database Backup Script
# ===================================================
# التشغيل: يدوياً أو عبر cron كل 6 ساعات
# الحفظ: /backups/ficc/ + آخر 7 نسخ فقط
# ===================================================

DB_HOST="ficc-sqlserver"
DB_USER="sa"
DB_PASS="FICCStrongPassword123!"
DB_NAME="FICCPlatform"
BACKUP_DIR="/backups/ficc"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="$BACKUP_DIR/FICCPlatform_$DATE.bak"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 بدء النسخ الاحتياطي..." >> "$LOG_FILE"

# تنفيذ النسخ الاحتياطي
docker exec $DB_HOST /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U "$DB_USER" -P "$DB_PASS" -C \
  -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'/var/opt/mssql/backup/FICCPlatform_$DATE.bak' WITH NOFORMAT, NOINIT, NAME = 'FICC Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10" \
  >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  # نسخ الملف من الـ container
  docker cp $DB_HOST:/var/opt/mssql/backup/FICCPlatform_$DATE.bak "$BACKUP_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ نجح النسخ الاحتياطي: $BACKUP_FILE" >> "$LOG_FILE"
  echo "✅ FICCPlatform_$DATE.bak"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ فشل النسخ الاحتياطي!" >> "$LOG_FILE"
  echo "❌ فشل النسخ الاحتياطي"
  exit 1
fi

# حذف النسخ القديمة — الاحتفاظ بآخر 7 فقط
cd "$BACKUP_DIR"
ls -t FICCPlatform_*.bak 2>/dev/null | tail -n +8 | xargs rm -f
COUNT=$(ls FICCPlatform_*.bak 2>/dev/null | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🗃️ عدد النسخ المحفوظة: $COUNT" >> "$LOG_FILE"
echo "🗃️ النسخ المحفوظة: $COUNT"
