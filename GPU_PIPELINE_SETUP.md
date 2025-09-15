# 🔥 COMPLETE GPU PIPELINE SETUP

## Step 1: Install Flask for Python Analysis Service
```bash
pip install flask flask-cors requests
```

## Step 2: Start Python Analysis Service
```bash
cd C:\Users\mulli\Documents\financial-software\investors-daily-brief\backend
python analysis_service_simple.py
```
This uses the simplified version that doesn't need yfinance.

## Step 3: Check GPU Status
```bash
python check_gpu.py
```
This will tell you if PyTorch can see your GPU.

## Step 4: Fix GPU Support (if needed)
If GPU not detected:
```bash
# Uninstall CPU-only PyTorch
pip uninstall torch torchvision torchaudio -y

# Install with CUDA support for RTX 5060
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Step 5: Kill Existing Process on Port 8080
```bash
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill it (replace PID with the number)
taskkill /PID [PID] /F
```

## Step 6: Start GPU-Optimized GPT-OSS
```bash
python gpt_oss_gpu.py
```
This version is optimized for GPU usage.

## Step 7: Test Complete Pipeline
```bash
python final_test.py
```

## 📊 What You Should See:

### When Python Analysis Service Starts:
```
SIMPLIFIED Python Analysis Engine
Starting on port 8000...
```

### When GPT-OSS GPU Starts:
```
🚀 GPT-OSS GPU Server
Device: cuda
✅ GPU detected: NVIDIA GeForce RTX 5060
✅ GPU Memory: 8.0 GB
```

### When Pipeline Test Runs:
```
SERVICE STATUS:
----------------------------------------
1. Python Analysis (8000): ✅ RUNNING
2. GPT-OSS Server (8080):  ✅ RUNNING
3. Backend API (5000):     ✅ RUNNING

TESTING FULL PIPELINE:
✅ SUCCESS! Pipeline working (4.2s)
🎉 PIPELINE IS FULLY OPERATIONAL!
```

## 🚨 Common Issues:

### "ModuleNotFoundError: No module named 'flask'"
```bash
pip install flask flask-cors
```

### "CUDA not available"
```bash
# Check PyTorch version
python -c "import torch; print(torch.__version__)"

# If it doesn't say +cu121 or similar, reinstall:
pip uninstall torch torchvision torchaudio -y
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Port 8080 already in use
```bash
# Option 1: Kill the process
taskkill /F /IM python.exe

# Option 2: Use different port
python -m uvicorn gpt_oss_gpu:app --port 8081
```

## ✅ Quick Test Commands:

Test each service individually:
```bash
# Test Python Analysis
curl http://localhost:8000/health

# Test GPT-OSS
curl http://localhost:8080/health

# Test Full Pipeline
curl http://localhost:5000/api/intelligent-analysis/market-phase
```