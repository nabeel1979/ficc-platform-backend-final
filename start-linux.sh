#!/bin/bash
echo "========================================"
echo " FICC Platform - Linux Startup"
echo " اتحاد الغرف التجارية العراقية"
echo "========================================"

# Start Backend
echo "[1/2] Starting Backend (ASP.NET Core)..."
cd backend
dotnet run &
BACKEND_PID=$!
cd ..

sleep 5

# Start Frontend
echo "[2/2] Starting Frontend (React)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo " Backend:  http://localhost:5000"
echo " Frontend: http://localhost:5173"
echo " Swagger:  http://localhost:5000/swagger"
echo "========================================"
echo " Press Ctrl+C to stop all services"
echo "========================================"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
