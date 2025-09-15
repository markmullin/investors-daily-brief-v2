## 🔥 RUN THESE COMMANDS TO TEST THE REAL PIPELINE

You need 3 terminals open. Here are the EXACT commands:

### Terminal 1: Python Analysis Service
```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief\backend
python analysis_service.py
```

Wait for: "Python Analysis Engine starting on port 8000..."

### Terminal 2: GPT-OSS Server
```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief\backend
python -m uvicorn gpt_oss_server:app --host 0.0.0.0 --port 8080
```

Wait for: "Uvicorn running on http://0.0.0.0:8080"

If uvicorn not installed, run:
```bash
pip install uvicorn fastapi
```

### Terminal 3: Test the Pipeline
```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief\backend
node test-real-pipeline.js
```

This will show you EXACTLY what's working and what's not.

### Terminal 4: Direct Browser Tests

Test each service individually:
- Python: http://localhost:8000/health
- GPT-OSS: http://localhost:8080/health
- Full Pipeline: http://localhost:5000/api/intelligent-analysis/market-phase

## 🚨 TROUBLESHOOTING

### If Python service fails:
```bash
pip install flask flask-cors numpy pandas yfinance requests
```

### If GPT-OSS fails:
```bash
pip install fastapi uvicorn torch transformers
```

### If Backend routes fail:
Check the console where `npm run dev` is running for errors.

### To see if routes are loaded:
Look for this in backend console:
```
✅ Intelligent Analysis routes loaded successfully
```

## 📊 WHAT YOU SHOULD SEE WHEN WORKING:

1. Python service returns: `{"service": "Python Analysis Engine", "status": "healthy"}`
2. GPT-OSS returns: `{"status": "running", "model_loaded": true}`
3. Full pipeline returns: `{"insight": "Market analysis text...", "calculations": {...}}`