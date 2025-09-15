# Deployment Instructions for Render

## Repository
GitHub Repository: https://github.com/markmullin/investors-daily-brief-v2

## Steps to Deploy on Render

### 1. Connect GitHub Repository
1. Go to your Render Dashboard at https://dashboard.render.com
2. Click on the "investors-daily-brief" service (backend)
3. Go to Settings → Build & Deploy
4. Update the GitHub repository to: `markmullin/investors-daily-brief-v2`
5. Set the branch to: `main`

### 2. Update Frontend Service
1. Click on the "investors-daily-brief-frontend" service
2. Go to Settings → Build & Deploy
3. Update the GitHub repository to: `markmullin/investors-daily-brief-v2`
4. Set the branch to: `main`

### 3. Environment Variables (Backend)
Make sure these are set in the backend service:
- FMP_API_KEY
- FRED_API_KEY
- MISTRAL_API_KEY (if using AI features)
- EOD_HISTORICAL_API_KEY
- BRAVE_API_KEY
- REDIS_URL (from existing Redis service)
- DATABASE_URL (from existing PostgreSQL)
- JWT_SECRET
- NODE_ENV=production
- PORT=5000
- FRONTEND_URL=https://investorsdailybrief.com

### 4. Update Build Settings

#### Backend Service:
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`

#### Frontend Service:
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist`

### 5. Redeploy
1. After updating the repository, click "Manual Deploy" → "Deploy latest commit"
2. Monitor the deployment logs for any errors

### 6. Custom Domain (Already Configured)
The domain investorsdailybrief.com should already be connected to your frontend service.

## Alternative: Blueprint Deployment

If you want to create fresh services instead:

1. Go to Blueprints in Render Dashboard
2. Click "New Blueprint Instance"
3. Connect the `markmullin/investors-daily-brief-v2` repository
4. Render will detect the `render.yaml` file
5. Review and create the services

## Monitoring After Deployment

1. Check the service logs for any errors
2. Visit https://investorsdailybrief.com to verify the frontend
3. Test API endpoints at https://investors-daily-brief.onrender.com/api/health

## Rollback if Needed

If issues occur:
1. Go to the service's Deploys tab
2. Find the previous working deployment
3. Click "Rollback to this deploy"

## Support

For any issues:
1. Check the deployment logs in Render Dashboard
2. Verify all environment variables are set correctly
3. Ensure the GitHub repository has the latest code
