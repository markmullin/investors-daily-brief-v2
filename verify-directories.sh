#!/bin/bash

echo "======================================"
echo "VERIFYING DEPLOYMENT DIRECTORIES"
echo "======================================"
echo ""

# Check OLD directory
echo "OLD Directory (should NOT be used):"
echo "Location: /c/Users/mulli/Documents/financial-software/investors-daily-brief"
cd /c/Users/mulli/Documents/financial-software/investors-daily-brief 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Git Remote: $(git remote get-url origin 2>/dev/null)"
    echo "Last Commit: $(git log -1 --pretty=format:'%h - %s' 2>/dev/null)"
    echo ""
fi

# Check NEW directory
echo "NEW Directory (SHOULD be deployed):"
echo "Location: /c/Users/mulli/Documents/financial-software/investors-daily-brief-deploy"
cd /c/Users/mulli/Documents/financial-software/investors-daily-brief-deploy
if [ $? -eq 0 ]; then
    echo "Git Remote: $(git remote get-url origin 2>/dev/null)"
    echo "Last Commit: $(git log -1 --pretty=format:'%h - %s' 2>/dev/null)"
    
    # Check for key files
    echo ""
    echo "Key Files Check:"
    [ -f "backend/src/services/beaService.js" ] && echo "✓ beaService.js exists" || echo "✗ beaService.js MISSING"
    [ -f "render.yaml" ] && echo "✓ render.yaml exists" || echo "✗ render.yaml MISSING"
    [ -f "backend/package.json" ] && echo "✓ backend/package.json exists" || echo "✗ backend/package.json MISSING"
    [ -f "frontend/package.json" ] && echo "✓ frontend/package.json exists" || echo "✗ frontend/package.json MISSING"
fi

echo ""
echo "======================================"
echo "ACTION REQUIRED:"
echo "======================================"
echo "Run this command to deploy the CORRECT directory:"
echo "cd /c/Users/mulli/Documents/financial-software/investors-daily-brief-deploy && ./fix-deployment.sh"
echo ""
