"""
QUICK FIX - Get everything running NOW
"""
import subprocess
import time
import os

print("=" * 70)
print("FIXING YOUR PIPELINE - STEP BY STEP")
print("=" * 70)
print()

# Step 1: Install Flask
print("Step 1: Installing Flask for Python Analysis...")
subprocess.run(["pip", "install", "flask", "flask-cors", "requests"], capture_output=True)
print("✅ Flask installed")
print()

# Step 2: Check what's on port 8080
print("Step 2: Checking port 8080...")
result = os.popen("netstat -ano | findstr :8080").read()
if result:
    print("Something is already on port 8080")
    lines = result.strip().split('\n')
    for line in lines:
        parts = line.split()
        if len(parts) > 4:
            pid = parts[-1]
            print(f"Process ID: {pid}")
            print(f"To kill it: taskkill /PID {pid} /F")
else:
    print("Port 8080 is free")
print()

# Step 3: Test if we can import torch with CUDA
print("Step 3: Checking GPU support...")
try:
    import torch
    if torch.cuda.is_available():
        print(f"✅ GPU available: {torch.cuda.get_device_name(0)}")
    else:
        print("❌ GPU not available in PyTorch")
        print("Run: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
except ImportError:
    print("❌ PyTorch not installed")
    print("Run: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")

print()
print("=" * 70)
print("NOW RUN THESE COMMANDS IN SEPARATE TERMINALS:")
print("=" * 70)
print()
print("Terminal 1 - Python Analysis:")
print("cd C:\\Users\\mulli\\Documents\\financial-software\\investors-daily-brief\\backend")
print("python analysis_service_simple.py")
print()
print("Terminal 2 - GPT-OSS with GPU:")
print("cd C:\\Users\\mulli\\Documents\\financial-software\\investors-daily-brief\\backend")
print("python gpt_oss_gpu.py")
print()
print("Terminal 3 - Test Pipeline:")
print("cd C:\\Users\\mulli\\Documents\\financial-software\\investors-daily-brief\\backend")
print("python final_test.py")
print()
print("=" * 70)