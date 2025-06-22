@echo off
echo ================================================================
echo 🚀 GITHUB REPOSITORY SETUP - INVESTORS DAILY BRIEF
echo ================================================================
echo.

echo 📋 Setting up Git repository...
cd c:\users\win10user\documents\financial-software\investors-daily-brief

echo 🔧 Initializing Git...
git init

echo 📦 Adding all files...
git add .

echo 💾 Creating initial commit...
git commit -m "Initial commit - Production-ready Investors Daily Brief dashboard"

echo.
echo ================================================================
echo 🌐 NEXT STEPS:
echo ================================================================
echo 1. Go to: https://github.com/new
echo 2. Repository name: investors-daily-brief
echo 3. Don't initialize with README
echo 4. Click "Create repository"
echo 5. Copy the repository URL
echo 6. Run these commands:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/investors-daily-brief.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 7. Then return to Render to deploy!
echo ================================================================

pause
