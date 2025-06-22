@echo off
echo ===============================================
echo   PREMIUM FMP QUALITY 8+ INTEGRATION TEST
echo   Official Reports + MarketWatch + Seeking Alpha
echo ===============================================
echo.

echo [1/4] Ensuring backend dependencies...
cd backend
npm list @mistralai/mistralai >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Mistral SDK...
    npm install @mistralai/mistralai --save
)

echo [2/4] Testing premium news service...
echo Testing: Official reports, MarketWatch, Seeking Alpha (Quality 8+ only)
node test-premium-quality.js
echo.

echo [3/4] Starting backend server...
start "Premium Backend" cmd /c "npm start"
timeout /t 5 >nul

echo [4/4] Testing complete integration...
cd ..
echo Testing full premium integration...
node test-complete-fmp-integration.js

echo.
echo ===============================================
echo   PREMIUM INTEGRATION RESULTS
echo ===============================================
echo.
echo EXPECTED RESULTS:
echo ✅ Using FMP Premium: YES
echo ✅ Using Real Mistral AI: YES 
echo ✅ Quality Sources: Official Reports, MarketWatch, Seeking Alpha
echo ✅ Quality Threshold: 8+ only
echo ✅ Content Focus: Professional daily market brief
echo.
echo PREMIUM SOURCES ONLY:
echo - Apple/Microsoft/Google Official Reports
echo - MarketWatch financial analysis
echo - Seeking Alpha investment insights
echo - Benzinga premium coverage
echo.
echo NO LOW-QUALITY SOURCES:
echo ❌ No YouTube, Reddit, or generic press releases
echo ❌ No globenewswire spam
echo ❌ No legal/litigation alerts
echo ❌ Quality threshold enforced at 8+
echo.
pause