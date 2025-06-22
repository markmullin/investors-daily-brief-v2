@echo off
echo.
echo ========================================
echo   STREAMLINED OPTIMIZATION RESTART
echo   Loading performance fixes...
echo ========================================
echo.

cd /d "c:\users\win10user\documents\financial-software\investors-daily-brief\backend"

echo [1/3] Stopping any existing backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting STREAMLINED backend with optimizations...
echo.
echo Expected startup messages:
echo - "STREAMLINED OPTIMIZED routes"
echo - "VERIFICATION routes loaded"
echo - "STREAMLINED AI routes loaded"
echo.

start "STREAMLINED Backend" cmd /k "npm start"

echo [3/3] Waiting for startup...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   TESTING OPTIMIZATIONS
echo ========================================
echo.
echo Opening verification tests...

start "Verify Optimizations" "http://localhost:5000/api/verify/verify-optimizations"
timeout /t 2 /nobreak >nul
start "Health Check" "http://localhost:5000/health"
timeout /t 2 /nobreak >nul
start "Dashboard" "http://localhost:5173"

echo.
echo ✅ If backend shows "STREAMLINED OPTIMIZED routes loaded"
echo    then optimizations are working!
echo.
echo ❌ If you see old messages, the backend needs a full restart.
echo.
pause
