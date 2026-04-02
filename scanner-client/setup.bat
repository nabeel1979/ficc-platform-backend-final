@echo off
title FICC Scanner Setup
color 1F
cls

echo.
echo  ==========================================
echo   FICC Scanner - Installation
echo   Union of Iraqi Commercial Chambers
echo  ==========================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Python not found - Downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' -OutFile '%TEMP%\python_setup.exe'"
    echo  [*] Installing Python...
    %TEMP%\python_setup.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del %TEMP%\python_setup.exe
    set "PATH=%PATH%;C:\Python311;C:\Python311\Scripts"
    echo  [OK] Python installed
) else (
    echo  [OK] Python found
)

echo.
echo  [*] Installing required packages...
python -m pip install --upgrade pip --quiet
python -m pip install pywin32 requests Pillow wia_scan pystray --quiet
echo  [OK] Packages installed

echo.
echo  [*] Creating Desktop shortcut...
set SCRIPT_DIR=%~dp0
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\FICC Scanner.lnk'); $SC.TargetPath = 'python'; $SC.Arguments = '\"%SCRIPT_DIR%scanner.py\"'; $SC.WorkingDirectory = '%SCRIPT_DIR%'; $SC.IconLocation = 'shell32.dll,23'; $SC.Save()"
echo  [OK] Desktop shortcut created

echo.
echo  ==========================================
echo   Installation Complete!
echo   Run: FICC Scanner (on Desktop)
echo  ==========================================
echo.

set /p LAUNCH=Launch now? (y/n): 
if /i "%LAUNCH%"=="y" (
    start "" python "%SCRIPT_DIR%scanner.py"
)

pause
