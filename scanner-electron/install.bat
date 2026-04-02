@echo off
chcp 65001 >nul
title FICC Scanner - تثبيت

echo.
echo ████████████████████████████████████████
echo █                                      █
echo █      🏛️  FICC Scanner v21            █
echo █   اتحاد الغرف التجارية العراقية      █
echo █                                      █
echo ████████████████████████████████████████
echo.

:: تحقق من Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مثبت!
    echo 🔗 يرجى تحميل Node.js من: https://nodejs.org
    echo    اختر LTS version
    pause
    start https://nodejs.org
    exit /b 1
)

echo ✅ Node.js موجود
echo.
echo 📦 جاري تثبيت المتطلبات...
echo.

call npm install --silent

if errorlevel 1 (
    echo ❌ فشل التثبيت!
    pause
    exit /b 1
)

echo.
echo ✅ تم التثبيت بنجاح!
echo.
echo 🚀 جاري تشغيل FICC Scanner...
echo.

:: إنشاء اختصار على سطح المكتب
set DESKTOP=%USERPROFILE%\Desktop
set SCRIPT_DIR=%~dp0

echo @echo off > "%DESKTOP%\FICC Scanner.bat"
echo cd /d "%SCRIPT_DIR%" >> "%DESKTOP%\FICC Scanner.bat"
echo start npm start >> "%DESKTOP%\FICC Scanner.bat"
echo exit >> "%DESKTOP%\FICC Scanner.bat"

echo ✅ تم إنشاء اختصار "FICC Scanner" على سطح المكتب!
echo.

:: تشغيل البرنامج
start npm start

echo.
echo ████████████████████████████████████████
echo █  ✅ FICC Scanner جاهز للاستخدام!    █
echo █  🌐 افتح ficc.iq وابدأ المسح        █
echo ████████████████████████████████████████
echo.
timeout /t 3 >nul
