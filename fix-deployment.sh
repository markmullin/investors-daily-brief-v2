#!/bin/bash

echo "======================================"
echo "FIXING DEPLOYMENT - CORRECT DIRECTORY"
echo "======================================"
echo ""

# Make absolutely sure we're in the CORRECT directory
cd /c/Users/mulli/Documents/financial-software/investors-daily-brief-deploy
echo "Current directory: $(pwd)"
echo ""

# Check if beaService.js exists
if [ -f "backend/src/services/beaService.js" ]; then
    echo "✓ beaService.js found in correct location"
else
    echo "✗ WARNING: beaService.js not found!"
fi
echo ""

# Remove and re-add remote to be sure
echo "Resetting remote repository..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/markmullin/investors-daily-brief-v2.git

# Configure git
git config user.email "mullinmark05@gmail.com"
git config user.name "Mark Mullin"

# Show what we're about to commit
echo "Files to be deployed:"
git status --short
echo ""

# Stage everything
echo "Staging all files from deploy directory..."
git add -A

# Make sure beaService.js is included
git add backend/src/services/beaService.js 2>/dev/null

# Commit with clear message
echo "Creating deployment commit..."
git commit -m "DEPLOY V2: Complete codebase from investors-daily-brief-deploy directory with all fixes"

# Force push to completely replace remote
echo ""
echo "Force pushing to GitHub (replacing old code)..."
git push origin main --force

echo ""
echo "======================================"
echo "DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "✓ Code from investors-daily-brief-deploy is now on GitHub"
echo "✓ Old code has been replaced"
echo ""
echo "Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'Manual Deploy' → 'Deploy latest commit' on backend service"
echo "3. Wait for backend to finish"
echo "4. Click 'Manual Deploy' → 'Deploy latest commit' on frontend service"
echo "5. Check https://investorsdailybrief.com"
echo ""
