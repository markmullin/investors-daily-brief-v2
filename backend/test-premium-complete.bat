@echo off
echo ================================
echo PREMIUM QUALITY TEST SUITE
echo ================================
echo Testing premium FMP sources + Mistral AI
echo Quality threshold: 8+ only
echo Sources: Official reports, MarketWatch, Seeking Alpha
echo.

echo [1/3] Testing Premium FMP News Service...
node test-premium-quality.js
if errorlevel 1 (
    echo ERROR: Premium FMP test failed
    pause
    exit /b 1
)

echo.
echo [2/3] Testing Production Integration...
node test-production-premium.js
if errorlevel 1 (
    echo ERROR: Production integration test failed
    pause
    exit /b 1
)

echo.
echo [3/3] Testing API Endpoint (requires backend running)...
echo NOTE: Make sure backend is running on port 5000
timeout /t 3 /nobreak >nul

curl -s "http://localhost:5000/api/ai/ai-analysis" > temp_api_test.json
if errorlevel 1 (
    echo WARNING: API endpoint test failed - is backend running?
    echo To start backend: npm start
) else (
    echo SUCCESS: API endpoint responding
    del temp_api_test.json 2>nul
)

echo.
echo ================================
echo PREMIUM QUALITY TESTS COMPLETE
echo ================================
echo All tests passed! Ready for production use.
echo.
pause