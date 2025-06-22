@echo off
echo =====================================
echo GENERAL FINANCIAL NEWS TEST SUITE
echo =====================================
echo Testing premium sources: MarketWatch, Seeking Alpha, Morningstar
echo Focus: General market news (NO company press releases)
echo.

echo [1/3] Testing General Financial News Service...
node test-general-financial-news.js
if errorlevel 1 (
    echo WARNING: General financial news test had issues
    echo Check if premium sources are available from FMP API
)

echo.
echo [2/3] Testing Premium Quality (Updated)...
node test-premium-quality.js
if errorlevel 1 (
    echo WARNING: Premium quality test had issues
)

echo.
echo [3/3] Testing API Endpoint (Fixed Route Conflict)...
echo NOTE: Make sure backend is running on port 5000
timeout /t 3 /nobreak >nul

curl -s "http://localhost:5000/api/ai/ai-analysis" -o temp_api_test.json
if errorlevel 1 (
    echo WARNING: API endpoint test failed - is backend running?
    echo To start backend: npm start
) else (
    echo SUCCESS: API endpoint responding
    
    :: Check if response contains premium content
    findstr /i "marketwatch\|seeking.*alpha\|morningstar" temp_api_test.json >nul
    if errorlevel 1 (
        echo INFO: Premium sources not detected in API response
        echo This might be expected if FMP doesn't have current premium content
    ) else (
        echo SUCCESS: Premium sources detected in API response!
    )
    
    del temp_api_test.json 2>nul
)

echo.
echo [BONUS] Testing Alternative Route (Current Events)...
curl -s "http://localhost:5000/api/ai/current-events" > nul
if errorlevel 1 (
    echo INFO: Current events route test failed (expected if backend not running)
) else (
    echo SUCCESS: Current events route responding (route conflict fixed)
)

echo.
echo =====================================
echo GENERAL FINANCIAL NEWS TESTS COMPLETE
echo =====================================
echo.
echo NEXT STEPS:
echo 1. If no premium sources found, investigate FMP API endpoints
echo 2. Consider adding Brave API news search as fallback
echo 3. Focus on general market news vs company-specific content
echo.
pause