@echo off
cd /d "%~dp0"
echo Starting FICC Scanner...
python scanner.py
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Could not start scanner.
    echo Make sure Python is installed.
    pause
)
