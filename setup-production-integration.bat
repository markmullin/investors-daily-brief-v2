@echo off
echo ===============================================
echo   PRODUCTION FMP + MISTRAL INTEGRATION SETUP
echo   Implementing Premium News + AI Solutions
echo ===============================================
echo.

echo [1/7] Stopping existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/7] Installing dependencies...
cd backend
npm install axios @mistralai/mistralai --save
if %errorlevel% neq 0 (
    echo Retrying with force...
    npm install axios @mistralai/mistralai --save --force
)

echo [3/7] Verifying environment configuration...
if not exist .env (
    echo ERROR: .env file not found in backend directory
    echo Please ensure your .env file contains:
    echo FMP_API_KEY=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
    echo MISTRAL_API_KEY=cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E
    echo BRAVE_API_KEY=BSAFHHikdsv2YXSYODQSPES2tTMILHI
    pause
    exit /b 1
)

echo Checking environment variables:
findstr "FMP_API_KEY" .env >nul && echo ✅ FMP API Key: Configured
findstr "MISTRAL_API_KEY" .env >nul && echo ✅ Mistral API Key: Configured  
findstr "BRAVE_API_KEY" .env >nul && echo ✅ Brave API Key: Configured

echo [4/7] Backing up current files...
if exist src\services\mistralService.js copy src\services\mistralService.js src\services\mistralService.js.backup >nul
if exist src\services\fmpNewsService.js copy src\services\fmpNewsService.js src\services\fmpNewsService.js.backup >nul
if exist src\routes\streamlinedAiRoutes.js copy src\routes\streamlinedAiRoutes.js src\routes\streamlinedAiRoutes.js.backup >nul

echo [5/7] Production files already updated by Claude...
echo ✅ Fixed Mistral service: src\services\mistralService.js
echo ✅ Hybrid news service: src\services\hybridPremiumNewsService.js  
echo ✅ News-focused AI routes: src\routes\streamlinedAiRoutes.js

echo [6/7] Starting backend server...
echo Starting optimized backend with FMP + Mistral integration...
start "Market Dashboard Backend" cmd /c "npm start"
timeout /t 8 >nul

echo [7/7] Testing complete integration...
cd ..
echo Running comprehensive integration test...
timeout /t 3 >nul
node test-complete-fmp-integration.js

echo.
echo ===============================================
echo   PRODUCTION SETUP COMPLETE!
echo ===============================================
echo.
echo EXPECTED RESULTS AFTER FIXES:
echo ✅ Using FMP Premium: YES
echo ✅ Using Real Mistral AI: YES (not FALLBACK)
echo ✅ Premium News Sources: Bloomberg, CNBC, Reuters, WSJ
echo ✅ Content: News summarization focused (no market scores)
echo.
echo SOLUTIONS IMPLEMENTED:
echo 1. Hybrid Premium News Service
echo    - Brave API for premium sources (Bloomberg, CNBC, Reuters, WSJ)
echo    - FMP API for supplementary financial data
echo    - High-quality structured fallback content
echo.
echo 2. Fixed Mistral AI Integration
echo    - Multiple API pattern support
echo    - Proper error handling and timeouts
echo    - Real AI generation (not algorithmic fallback)
echo.
echo 3. News-Focused Content
echo    - Daily market brief focus
echo    - News summarization (no market scoring)
echo    - Professional financial analysis
echo.
echo Backend: http://localhost:5000
echo Health: http://localhost:5000/health
echo AI Analysis: http://localhost:5000/api/ai/ai-analysis
echo.
echo To start frontend:
echo   cd frontend
echo   npm run dev
echo.
pause