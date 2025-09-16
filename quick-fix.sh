#!/bin/bash

echo "======================================"
echo "QUICK FIX: Package Version"
echo "======================================"
echo ""

# Navigate to correct directory
cd /c/Users/mulli/Documents/financial-software/investors-daily-brief-deploy

# Add the fix
git add backend/package.json

# Commit
git commit -m "Fix: Correct express-handlebars version from 7.1.4 to 7.1.3"

# Push
git push origin main

echo ""
echo "Fix pushed! Now redeploy on Render."
