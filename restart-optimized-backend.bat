@echo off
echo.
echo =====================================================
echo   STREAMLINED OPTIMIZATION RESTART SCRIPT
echo   Fixing timeout issues and loading optimizations
echo =====================================================
echo.

cd /d "c:\users\win10user\documents\financial-software\investors-daily-brief"

echo [1/5] Stopping any existing backend processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/5] Clearing any cached modules...
if exist "backend\node_modules\.cache" (
    rmdir /s /q "backend\node_modules\.cache"
    echo Cache cleared
)

echo [3/5] Starting optimized backend server...
cd backend
start "Optimized Backend" cmd /k "echo STREAMLINED BACKEND STARTING... & npm start"
cd ..

echo [4/5] Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo [5/5] Testing optimizations...
echo.
echo Testing streamlined services...

curl -s "http://localhost:5000/api/performance-status" > temp_performance.json 2>nul
if exist temp_performance.json (
    echo ✅ Backend is responding
    del temp_performance.json
) else (
    echo ❌ Backend not responding yet, please wait...
)

echo.
echo =====================================================
echo   VERIFICATION TESTS
echo =====================================================
echo.
echo Run these tests in your browser:
echo.
echo 1. Backend Health:
echo    http://localhost:5000/api/verify/health-fast
echo.
echo 2. Optimization Test:
echo    http://localhost:5000/api/verify/verify-optimizations
echo.
echo 3. Performance Status:
echo    http://localhost:5000/api/performance-status
echo.
echo 4. Your Dashboard:
echo    http://localhost:5173
echo.
echo =====================================================
echo   EXPECTED RESULTS
echo =====================================================
echo.
echo ✅ AI analysis should complete in ^<10 seconds
echo ✅ No more "operation was aborted" errors
echo ✅ Daily Brief should load without timeouts
echo ✅ Console errors should be minimal
echo.
echo If you still see issues:
echo 1. Check the backend terminal for error messages
echo 2. Test the verification endpoints above
echo 3. Restart frontend: npm run dev (in another terminal)
echo.
echo Press any key to open browser tests...
pause >nul

start "Backend Test" "http://localhost:5000/api/verify/verify-optimizations"
timeout /t 2 /nobreak >nul
start "Dashboard" "http://localhost:5173"

echo.
echo ✅ Restart complete! Check browser for test results.
echo.
pause
