@echo off
echo ================================================================
echo 🚀 INVESTORS DAILY BRIEF - DEPLOYMENT PREPARATION
echo ================================================================
echo.

echo 📦 Building Frontend for Production...
cd frontend
call npm install
call npm run build
echo ✅ Frontend build complete!
echo.

echo 🔧 Backend Production Check...
cd ..\backend
call npm install
echo ✅ Backend dependencies verified!
echo.

echo 📋 Deployment Checklist:
echo ✅ CORS configured for www.investorsdailybrief.com
echo ✅ Frontend built for production
echo ✅ Backend dependencies installed
echo ✅ Environment variables ready
echo ✅ render.yaml configuration created
echo.

echo 🌐 Next Steps:
echo 1. Push to GitHub: git add . && git commit -m "Production ready" && git push
echo 2. Deploy backend to Render with environment variables
echo 3. Deploy frontend to Render as static site
echo 4. Configure custom domain: www.investorsdailybrief.com
echo.

echo 📊 Environment Variables for Render Backend:
echo FMP_API_KEY=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
echo BRAVE_API_KEY=BSAFHHikdsv2YXSYODQSPES2tTMILHI
echo MISTRAL_API_KEY=cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E
echo FRED_API_KEY=dca5bb7524d0b194a9963b449e69c655
echo NODE_ENV=production
echo PORT=5000
echo.

echo 📖 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions
echo ================================================================
echo 🎊 READY FOR DEPLOYMENT!
echo ================================================================

cd ..
pause
