# HuggingFace Deployment Guide

## Step 1: Create HuggingFace Account
1. Go to https://huggingface.co
2. Sign up (free)
3. Verify email

## Step 2: Create Your Space
1. Go to https://huggingface.co/new-space
2. Fill in:
   - Owner: Your username
   - Space name: `investors-daily-brief-ai`
   - License: MIT
   - Select SDK: **Docker**
   - Docker template: Blank
   - Hardware: **T4 small - FREE**
   - Space visibility: Public

## Step 3: Upload Your Files
1. Your Space will open with a Git URL
2. Clone it locally:
```bash
git clone https://huggingface.co/spaces/YOUR_USERNAME/investors-daily-brief-ai
cd investors-daily-brief-ai
```

3. Copy these files from `huggingface-deployment` folder:
   - Dockerfile
   - nginx.conf
   - start.sh

4. Push to HuggingFace:
```bash
git add .
git commit -m "Deploy Ollama with AI models"
git push
```

## Step 4: Wait for Build
- HuggingFace will build your Docker image
- This takes 10-15 minutes (downloading models)
- You'll see build logs in the Space

## Step 5: Get Your URL
Once running, your AI endpoint will be:
```
https://YOUR_USERNAME-investors-daily-brief-ai.hf.space
```

## Step 6: Update Backend Code
Edit `streamlinedAiRoutes.js` line 11:
```javascript
const OLLAMA_URL = isProduction 
  ? 'https://YOUR_USERNAME-investors-daily-brief-ai.hf.space'  // <-- Put YOUR URL here
  : 'http://localhost:11434';
```

## Step 7: Deploy to Render
```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief-deploy
git add -A
git commit -m "Add HuggingFace AI endpoint"
git push origin main
```

## That's It! 
- Local dev: Uses YOUR GPU
- Production: Uses HuggingFace FREE T4 GPU
- Zero monthly costs!

## Testing Your Endpoint
Once deployed, test it:
```
https://YOUR_USERNAME-investors-daily-brief-ai.hf.space/v1/models
```

Should return list of available models (qwen2.5:3b, deepseek-r1:8b)
