@echo off
echo ========================================
echo  FICC Platform - Windows Startup
echo  اتحاد الغرف التجارية العراقية
echo ========================================

echo.
echo [1/2] Starting Backend (ASP.NET Core)...
cd backend
start "FICC Backend" cmd /k "dotnet run"
cd ..

timeout /t 5

echo.
echo [2/2] Starting Frontend (React)...
cd frontend
start "FICC Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo  Swagger:  http://localhost:5000/swagger
echo ========================================
pause
