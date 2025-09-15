#!/bin/bash

echo "======================================"
echo "Deploying to GitHub Repository"
echo "======================================"
echo ""

# Add all changes
echo "Staging all files..."
git add .

# Commit the changes
echo "Creating commit..."
git commit -m "Deploy Investors Daily Brief V2 - Production ready codebase with all features"

# Change remote to new repository
echo "Updating remote repository..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/markmullin/investors-daily-brief-v2.git

# Push to main branch
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "======================================"
echo "Deployment to GitHub Complete!"
echo "======================================"
echo ""
echo "Repository: https://github.com/markmullin/investors-daily-brief-v2"
echo ""
echo "Next Steps:"
echo "1. Go to your Render Dashboard"
echo "2. Update both services to use the new repository"
echo "3. Trigger a manual deploy"
echo ""
