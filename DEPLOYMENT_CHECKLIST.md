# Deployment Checklist for Render

## Pre-Deployment Checklist

### ✅ GitHub Repository Setup
- [x] Repository created: `markmullin/investors-daily-brief-v2`
- [x] `.gitignore` configured to exclude sensitive files
- [x] `README.md` updated with deployment instructions
- [x] `render.yaml` configured for Render services
- [ ] Code pushed to GitHub (run `DEPLOY_TO_GITHUB.bat`)

### ✅ Files Ready for Deployment
- [x] Backend source code in `/backend/src`
- [x] Frontend source code in `/frontend/src`
- [x] Package.json files with correct scripts
- [x] Environment configuration files (without secrets)
- [x] Production build configuration

### 📋 Render Configuration Required

#### Backend Service (`investors-daily-brief`)
- [ ] Update GitHub repo to: `markmullin/investors-daily-brief-v2`
- [ ] Set branch to: `main`
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `cd backend && npm start`
- [ ] Region: Ohio (keep existing)

#### Frontend Service (`investors-daily-brief-frontend`)
- [ ] Update GitHub repo to: `markmullin/investors-daily-brief-v2`
- [ ] Set branch to: `main`
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Publish Directory: `frontend/dist`
- [ ] Custom domain: investorsdailybrief.com (already configured)

### 🔑 Environment Variables (Backend)
Verify these are set in Render Dashboard:

- [ ] `FMP_API_KEY` - Your Financial Modeling Prep API key
- [ ] `FRED_API_KEY` - Your FRED API key
- [ ] `MISTRAL_API_KEY` - Your Mistral AI API key
- [ ] `EOD_HISTORICAL_API_KEY` - Your EOD Historical API key
- [ ] `BRAVE_API_KEY` - Your Brave Search API key
- [ ] `REDIS_URL` - From existing Redis service
- [ ] `DATABASE_URL` - From existing PostgreSQL
- [ ] `JWT_SECRET` - Auto-generated or custom
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `5000`
- [ ] `FRONTEND_URL` - Set to `https://investorsdailybrief.com`

### 📝 Post-Deployment Verification

- [ ] Backend health check: https://investors-daily-brief.onrender.com/api/health
- [ ] Frontend loads: https://investorsdailybrief.com
- [ ] API endpoints responding
- [ ] Real-time data updating
- [ ] AI features working (if configured)

### 🚨 Troubleshooting

If deployment fails:
1. Check Render deployment logs
2. Verify all environment variables
3. Check GitHub repository has latest code
4. Ensure build commands are correct
5. Review error messages in logs

### 💡 Tips

- Keep the old services running until new deployment is verified
- You can use Render's preview environments for testing
- Monitor logs during first 10 minutes after deployment
- Have a rollback plan ready if needed

## Quick Deploy Steps

1. **Run the deployment script:**
   ```cmd
   DEPLOY_TO_GITHUB.bat
   ```

2. **Update Render services:**
   - Go to https://dashboard.render.com
   - Update each service's GitHub repository
   - Trigger manual deploy

3. **Monitor deployment:**
   - Watch deployment logs
   - Test functionality
   - Verify custom domain works

## Support Resources

- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com
- GitHub Repository: https://github.com/markmullin/investors-daily-brief-v2
