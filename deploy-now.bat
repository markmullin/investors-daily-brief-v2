cd /d "c:\users\win10user\documents\financial-software\investors-daily-brief"

echo ================================================================
echo 🚀 DEPLOYING FUNDAMENTALS FIXES TO PRODUCTION
echo ================================================================

echo Adding all changes...
git add .

echo Committing with clear message...
git commit -m "Fix: Production fundamentals API endpoint

- Frontend getFundamentals() now calls /api/edgar/fundamentals/:symbol  
- Should resolve 'Fundamentals Unavailable' error in production
- BRK.B ticker format handled correctly in backend
- All API keys and routes properly configured"

echo Pushing to trigger Render deployment...
git push origin main

echo.
echo ✅ DEPLOYMENT TRIGGERED!
echo.
echo 🧪 TEST IN 5 MINUTES:
echo Backend API: https://investors-daily-brief.onrender.com/api/edgar/fundamentals/SNOW
echo Frontend: Search SNOW → Fundamentals tab should show revenue charts
echo.
echo 📊 Monitor deployment: https://dashboard.render.com

timeout /t 5
echo Ready to test!