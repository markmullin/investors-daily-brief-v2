@echo off
echo ========================================
echo DASHBOARD STARTUP & VERIFICATION GUIDE
echo ========================================
echo This will get your premium AI dashboard running flawlessly!
echo.

echo [STEP 1] Stopping any existing backend processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [STEP 2] Starting backend with premium services...
echo Starting on port 5000...
start /B cmd /c "cd /d %cd% && npm start > startup.log 2>&1"

echo [STEP 3] Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo [STEP 4] Testing backend health...
curl -s "http://localhost:5000/health" > health_check.json
if errorlevel 1 (
    echo ERROR: Backend not responding
    echo Check startup.log for errors
    type startup.log
    pause
    exit /b 1
)

echo SUCCESS: Backend is running!

echo [STEP 5] Testing premium AI service...
node test-api-route-direct.js

echo [STEP 6] Testing general financial news...
node test-general-financial-news.js

echo.
echo ========================================
echo DASHBOARD READY!
echo ========================================
echo.
echo Next steps:
echo 1. Start the frontend: cd ../frontend && npm run dev
echo 2. Open browser: http://localhost:5173
echo 3. Navigate to AI Analysis section
echo 4. See premium MarketWatch/Seeking Alpha content!
echo.
echo Backend URL: http://localhost:5000
echo API Endpoint: http://localhost:5000/api/ai/ai-analysis
echo Health Check: http://localhost:5000/health
echo.
echo If you see any issues, check startup.log
echo.
pause