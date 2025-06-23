@echo off
cd /d "c:\users\win10user\documents\financial-software\investors-daily-brief"
echo Checking git status...
git status
echo.
echo Current git log:
git log --oneline -5
echo.
echo If there are changes to commit, run:
echo git add .
echo git commit -m "Fix: Stock Fundamentals API endpoint for production"
echo git push origin main
pause
