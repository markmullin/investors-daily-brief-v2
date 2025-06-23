@echo off
echo ================================================================
echo 🔧 FIXING GIT REMOTE - INVESTORS DAILY BRIEF
echo ================================================================
echo.

cd c:\Users\win10user\Documents\financial-software\investors-daily-brief

echo 🗑️ Removing incorrect remote origin...
git remote remove origin

echo ✅ Adding correct remote origin...
git remote add origin https://github.com/markmullin/investors-daily-brief.git

echo 📤 Pushing to correct repository...
git push -u origin main

echo.
echo ================================================================
echo ✅ SUCCESS! Your code is now in the correct repository:
echo https://github.com/markmullin/investors-daily-brief
echo.
echo 🚀 Next: Go back to Render and select this repository for deployment!
echo ================================================================

pause
