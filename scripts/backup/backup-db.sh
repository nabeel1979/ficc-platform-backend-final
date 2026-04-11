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

# ===================================================
# 🔗 Push إلى GitHub (النسخة الأخيرة فقط)
# ===================================================
GIT_REPO="/root/.openclaw/workspace/ficc-platform"
GIT_BACKUP_DIR="$GIT_REPO/database-backups"

if [ -d "$GIT_REPO/.git" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📤 جاري Push للـ GitHub..." >> "$LOG_FILE"
  
  # نسخ الملف الأخير
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/FICCPlatform_*.bak 2>/dev/null | head -1)
  if [ -f "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" "$GIT_BACKUP_DIR/"
    
    # Git operations
    cd "$GIT_REPO"
    git add database-backups/FICCPlatform_*.bak 2>/dev/null
    git commit -m "Auto: Daily database backup $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
    
    if git push origin main 2>/dev/null; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ تم Push للـ GitHub بنجاح" >> "$LOG_FILE"
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ فشل Push للـ GitHub (network issue)" >> "$LOG_FILE"
    fi
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Git repository غير موجود" >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ اكتمل النسخ الاحتياطي!" >> "$LOG_FILE"

# ===================================================
# ☁️ Upload إلى Cloudflare R2 (النسخة الأخيرة فقط)
# ===================================================
R2_ACCOUNT_ID=""
R2_ACCESS_KEY=""
R2_SECRET_KEY=""
R2_BUCKET="ficcmedia"
R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"

if [ ! -z "$R2_ACCESS_KEY" ] && [ ! -z "$R2_SECRET_KEY" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ☁️ جاري Upload للـ Cloudflare R2..." >> "$LOG_FILE"
  
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/FICCPlatform_*.bak 2>/dev/null | head -1)
  BACKUP_FILENAME=$(basename "$LATEST_BACKUP")
  
  if [ -f "$LATEST_BACKUP" ]; then
    # استخدام AWS CLI للـ Upload (لو متوفر)
    if command -v aws &> /dev/null; then
      aws s3 cp "$LATEST_BACKUP" "s3://$R2_BUCKET/backups/$BACKUP_FILENAME" \
        --endpoint-url "$R2_ENDPOINT" \
        --region auto \
        2>/dev/null && \
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ تم Upload للـ R2 بنجاح" >> "$LOG_FILE" || \
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ فشل Upload للـ R2" >> "$LOG_FILE"
    else
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ AWS CLI غير مثبت — تخطي R2 Upload" >> "$LOG_FILE"
    fi
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ R2 credentials غير معرّفة — تخطي Upload" >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========================================" >> "$LOG_FILE"
