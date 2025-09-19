# Complete Deployment Guide - Qwen3 1.7B with RAG on Render

## Architecture Overview
- **Backend + Frontend**: Your existing Render deployment
- **AI Service**: Separate Render service running Ollama + Qwen3 1.7B
- **RAG**: Pulls real-time data from FMP/FRED APIs

## Step 1: Create Ollama Service on Render

### 1.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Choose "Deploy from a Git repo"

### 1.2 Create GitHub Repo for Ollama
Create a new repo called `ollama-qwen3` with these files:

**Dockerfile:**
```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

# Download model at build time
RUN ollama serve & \
    sleep 10 && \
    ollama pull qwen3:1.7b && \
    pkill ollama

EXPOSE 11434
CMD ["ollama", "serve", "--host", "0.0.0.0"]
```

**render.yaml:**
```yaml
services:
  - type: web
    name: ollama-qwen3
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: starter # $7/month for dedicated CPU
    healthCheckPath: /
    envVars:
      - key: PORT
        value: 11434
```

### 1.3 Deploy on Render
1. Connect your GitHub repo
2. Name: `ollama-qwen3`
3. Runtime: Docker
4. Instance Type: **Starter ($7/month)** or **Standard ($25/month)** for better CPU
5. Deploy

### 1.4 Get Your Ollama URL
Once deployed, you'll get a URL like:
```
https://ollama-qwen3-xyz.onrender.com
```

## Step 2: Update Your Backend

### 2.1 Add Environment Variable
In your main app's Render dashboard:
1. Go to Environment
2. Add: `OLLAMA_URL = https://ollama-qwen3-xyz.onrender.com`

### 2.2 Update streamlinedAiRoutes.js
The file is already updated with the code above. Key features:
- Automatic RAG when market data is needed
- Falls back to news-only analysis when appropriate
- Handles Ollama connection failures gracefully

## Step 3: Deploy Updates

```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief-deploy

# Commit changes
git add -A
git commit -m "Add Qwen3 1.7B with RAG support for production"
git push origin main
```

## Step 4: Testing

### 4.1 Test Ollama Service
```bash
curl https://ollama-qwen3-xyz.onrender.com/api/tags
# Should return list with qwen3:1.7b
```

### 4.2 Test AI Analysis
```bash
# With RAG (includes market data)
curl https://investors-daily-brief.onrender.com/api/ai-analysis/enhanced-comprehensive-analysis

# Without RAG (news only)
curl https://investors-daily-brief.onrender.com/api/ai-analysis/enhanced-comprehensive-analysis?rag=false
```

## Performance Expectations

### Response Times on Render CPU:
- **First request**: 15-20 seconds (cold start)
- **Subsequent**: 8-12 seconds
- **With RAG**: +2-3 seconds for data fetching

### Quality:
- **With RAG**: Accurate numbers, no hallucination
- **Without RAG**: Good narrative analysis of trends
- **Thinking mode**: Better reasoning for complex topics

## Cost Breakdown

### Total Monthly Cost:
- **Render Backend/Frontend**: $7 (Starter) or $0 (Free tier)
- **Ollama Service**: $7 (Starter) or $25 (Standard)
- **Total**: $14-32/month

### Alternative: Single Service (Not Recommended)
You could run everything in one service, but:
- Slower cold starts
- Memory issues
- Less scalable

## Monitoring & Maintenance

### Health Checks
The `/api/ai-health` endpoint shows:
- Ollama connection status
- Model availability
- Response times

### Logs to Watch
```
🤖 [AI] Qwen3 1.7B with RAG Support
📰 Fetching news data...
📊 Fetching real-time market data for RAG...
🤖 Calling Qwen3 1.7B...
✅ Analysis complete in XXXXms
```

## Troubleshooting

### If Ollama Times Out:
- Increase instance size (Standard vs Starter)
- Reduce max_tokens in prompt
- Use simpler prompts

### If RAG Data Fails:
- Check FMP API limits
- Verify API keys are set
- Falls back to news-only automatically

### If Model Not Found:
- Redeploy Ollama service
- Check Dockerfile pulled correct model
- Verify with /api/tags endpoint

## Testing Locally First

```bash
# Start local Ollama
ollama serve

# Pull model
ollama pull qwen3:1.7b

# Test your backend
npm run dev:backend

# Test endpoint
curl http://localhost:5000/api/ai-analysis/enhanced-comprehensive-analysis
```

## Next Steps

1. **Deploy Ollama service** first
2. **Update environment variables** with Ollama URL
3. **Push backend updates** to trigger deployment
4. **Test both RAG and non-RAG** modes
5. **Monitor performance** for first 24 hours

This gives you production-ready AI with:
- ✅ Qwen3 1.7B (latest model)
- ✅ RAG for accurate numbers
- ✅ Works without RAG for general analysis
- ✅ Runs on CPU (no GPU costs)
- ✅ $14-32/month total cost
