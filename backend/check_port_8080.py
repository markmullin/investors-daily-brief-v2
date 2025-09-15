"""
Check what's already running on port 8080
"""
import requests
import subprocess
import os

print("=" * 60)
print("CHECKING WHAT'S ON PORT 8080")
print("=" * 60)
print()

# Check if something is responding on 8080
try:
    response = requests.get("http://localhost:8080/health", timeout=2)
    print("✅ Something IS running on port 8080!")
    print(f"Response: {response.status_code}")
    
    if response.ok:
        data = response.json()
        print(f"Service: {data}")
        print()
        print("This means GPT-OSS (or something else) is ALREADY RUNNING!")
        print("You DON'T need to start it again!")
except Exception as e:
    print("❌ Nothing responding on port 8080")
    print(f"Error: {e}")

print()
print("Finding what process is using port 8080...")
print()

# Windows command to find process on port
result = os.popen("netstat -ano | findstr :8080").read()
if result:
    print("Processes using port 8080:")
    print(result)
    print()
    print("To kill a process, use: taskkill /PID [process_id] /F")
else:
    print("No process found on port 8080")

print()
print("=" * 60)
print("CHECKING YOUR GPU")
print("=" * 60)
print()

# Check if CUDA is available
try:
    import torch
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"CUDA version: {torch.version.cuda}")
    else:
        print("❌ CUDA NOT DETECTED!")
        print("This is why model uses CPU!")
        print()
        print("To fix: Install PyTorch with CUDA support:")
        print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
except ImportError:
    print("PyTorch not installed")

print()
print("=" * 60)
print("SOLUTION")
print("=" * 60)
print()
print("1. If something is already on port 8080, TEST IT:")
print("   http://localhost:8080/health")
print()
print("2. If it's working, you DON'T need to start GPT-OSS again!")
print()
print("3. Just test the full pipeline:")
print("   python final_test.py")
print()
print("4. If you need to restart GPT-OSS:")
print("   - First kill the existing process")
print("   - Then use a different port: --port 8081")
print("=" * 60)