@echo off
echo 🔨 Building frontend with all API fixes...

npm run build

echo ✅ Build complete!
echo 📤 Committing and pushing changes...

git add .
git commit -m "Fix: Update all hardcoded localhost URLs to use production API"
git push origin main

echo 🚀 Deployment complete! 
echo ⏳ Render will auto-deploy in 2-3 minutes.
echo 🌐 Check: https://investors-daily-brief.onrender.com

pause