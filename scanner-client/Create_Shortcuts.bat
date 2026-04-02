@echo off
REM Create Desktop Shortcuts for FICC Platform

setlocal enabledelayedexpansion

REM Get the current directory
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"

REM Create VBS script for shortcut creation
(
echo Set oWS = WScript.CreateObject("WScript.Shell"^)
echo Set oLink = oWS.CreateShortcut("%DESKTOP%\FICC Correspondence.lnk"^)
echo oLink.TargetPath = "%SCRIPT_DIR%open_correspondence.bat"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
echo oLink.Description = "FICC Correspondence System"
echo oLink.Save
echo.
echo Set oLink = oWS.CreateShortcut("%DESKTOP%\FICC Scanner.lnk"^)
echo oLink.TargetPath = "%SCRIPT_DIR%run.bat"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
echo oLink.Description = "FICC Scanner - Document Scanning"
echo oLink.Save
) > create_shortcuts.vbs

REM Run the VBS script
cscript.exe create_shortcuts.vbs

REM Delete the VBS script
del create_shortcuts.vbs

echo ✅ تم إنشاء الاختصارات على سطح المكتب
echo - FICC Correspondence (فتح الموقع مباشرة)
echo - FICC Scanner (برنامج المسح)
pause
