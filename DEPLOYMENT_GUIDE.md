# Render Deployment Guide for Investors Daily Brief

## Prerequisites
1. Create a Render account at https://render.com
2. Get your API key from https://dashboard.render.com/account/api-keys

## Step 1: Set up MCP for Claude (One-time setup)
1. Copy the file from `C:\Users\mulli\Documents\mcp-render-config.json` to `C:\Users\mulli\.claude\mcp.json`
2. Replace `YOUR_RENDER_API_KEY_HERE` with your actual Render API key
3. Restart Claude

## Step 2: Prepare for Deployment

### Clean up your project (Run these commands):
```powershell
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief-deploy

# Remove all test files and batch files
Remove-Item *.bat -Force
Remove-Item *.md -Force -Exclude README.md
Remove-Item test-*.* -Force
Remove-Item backend\*.bat -Force
Remove-Item backend\test-*.* -Force
Remove-Item backend\old-*.* -Force
Remove-Item frontend\test-*.* -Force
```

### Create production environment file:
```powershell
# In backend folder, create .env.production
cd backend
Copy-Item .env .env.production
```

## Step 3: Deploy to Render

### Option A: Deploy via GitHub (Recommended)
1. Push your code to GitHub:
```powershell
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief-deploy
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/idb-deploy.git
git push -u origin main
```

2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Select the repo with render.yaml
   - Deploy

### Option B: Direct Deploy via Render CLI
```powershell
# Install Render CLI first
npm install -g @render/cli

# Login
render login

# Deploy using render.yaml
render up
```

## Step 4: Configure Environment Variables in Render

After deployment, go to each service in Render Dashboard and add:

### For Backend Service (idb-backend):
- FMP_API_KEY = 4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
- FRED_API_KEY = dca5bb7524d0b194a9963b449e69c655
- MISTRAL_API_KEY = cAi5xeBVN0Om9S63vEWtQMC0HJ4u7U9E
- JWT_SECRET = (Render will auto-generate)

### Frontend will automatically connect to backend

## Step 5: Using MCP with Claude

Once MCP is configured, you can use these commands in Claude:

```
"Set my Render workspace to [YOUR_WORKSPACE_NAME]"
"List my Render services"
"Show me the logs for idb-backend"
"What's the current status of my services?"
"Scale my backend to 2 instances"
"Check the database connection for idb-postgres"
```

## Your URLs After Deployment:
- Frontend: https://idb-frontend.onrender.com
- Backend API: https://idb-backend.onrender.com
- Health Check: https://idb-backend.onrender.com/health

## Total Monthly Cost:
- Frontend (Static): Free
- Backend (Starter): $7/month
- PostgreSQL (Starter): $7/month  
- Redis (Starter): $10/month
- **Total: $24/month**

## Monitoring Commands via MCP:
```
"Show me today's traffic for my dashboard"
"Pull error logs from the last hour"
"What's my current database usage?"
"Show me API response times"
```
