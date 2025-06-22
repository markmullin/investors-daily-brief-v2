@echo off
echo ===============================================
echo   FMP + MISTRAL AI INTEGRATION SETUP
echo ===============================================
echo.

echo [1/5] Stopping any existing backend processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/5] Checking Mistral AI SDK installation...
cd backend
npm list @mistralai/mistralai
if %errorlevel% neq 0 (
    echo Installing Mistral AI SDK...
    npm install @mistralai/mistralai --save
)

echo [3/5] Verifying environment variables...
if not exist .env (
    echo ERROR: .env file not found in backend directory
    echo Please ensure your .env file contains:
    echo FMP_API_KEY=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
    echo MISTRAL_API_KEY=cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E
    pause
    exit /b 1
)

echo [4/5] Starting backend server...
echo Starting backend on http://localhost:5000...
start "Market Dashboard Backend" cmd /c "npm start"
timeout /t 5 >nul

echo [5/5] Running integration test...
cd ..
echo Testing FMP + Mistral AI integration...
timeout /t 3 >nul
node test-complete-fmp-integration.js

echo.
echo ===============================================
echo   SETUP COMPLETE!
echo ===============================================
echo.
echo Backend running at: http://localhost:5000
echo Health check: http://localhost:5000/health
echo AI Analysis: http://localhost:5000/api/ai/ai-analysis
echo.
echo To start frontend:
echo   cd frontend
echo   npm run dev
echo.
pause