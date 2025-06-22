@echo off
echo ===============================================
echo   DIAGNOSING FMP + MISTRAL INTEGRATION ISSUES
echo ===============================================
echo.

echo [1/4] Installing required dependencies...
cd backend
npm install axios --save
if %errorlevel% neq 0 (
    echo Failed to install axios, continuing anyway...
)

echo [2/4] Running FMP news source investigation...
cd ..
echo.
echo === FMP NEWS INVESTIGATION ===
node investigate-fmp-news.js
echo.

echo [3/4] Running Mistral API debug test...
echo.
echo === MISTRAL API DEBUG ===
node debug-mistral-api.js
echo.

echo [4/4] Testing current integration...
echo.
echo === CURRENT INTEGRATION TEST ===
node test-complete-fmp-integration.js
echo.

echo ===============================================
echo   DIAGNOSIS COMPLETE
echo ===============================================
echo.
echo Check the output above for:
echo - FMP news source quality
echo - Mistral API working patterns
echo - Current integration status
echo.
pause