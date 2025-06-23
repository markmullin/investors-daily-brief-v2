@echo off
cd /d "c:\users\win10user\documents\financial-software\investors-daily-brief"

echo ================================================================
echo 🚀 COMMITTING AND DEPLOYING FUNDAMENTALS FIXES
echo ================================================================
echo.

echo Changes being deployed:
echo ✅ Fixed getFundamentals() API endpoint in frontend/src/services/api.js
echo ✅ API now calls /api/edgar/fundamentals/ instead of /api/market/data
echo ✅ BRK.B ticker format handled in backend normalizeSymbolForFMP()
echo ✅ Added getInsights() method for KeyInsights component
echo.

echo Adding all changes...
git add .

echo Committing changes...
git commit -m "Fix: Stock Fundamentals API endpoint for production deployment

- Frontend getFundamentals() now calls /api/edgar/fundamentals/:symbol instead of /api/market/data
- This should resolve 'Fundamentals Unavailable' error in production
- Added missing getInsights() method for KeyInsights component
- BRK.B ticker format already handled correctly in backend
- Backend already configured for 20 news articles"

echo Pushing to GitHub to trigger Render deployment...
git push origin main

echo.
echo ================================================================
echo ✅ DEPLOYMENT TRIGGERED
echo ================================================================
echo.
echo Your Render deployment should start now at:
echo 🔗 https://dashboard.render.com/web/srv-yourserviceid
echo.
echo Test after deployment completes (~5 minutes):
echo 🧪 Backend API: https://investors-daily-brief.onrender.com/api/edgar/fundamentals/SNOW
echo 🧪 Frontend: Search SNOW → Fundamentals tab should show charts
echo.
echo ================================================================
pause
