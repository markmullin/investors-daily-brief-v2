"""
Check if GPT-OSS is using GPU and working properly
"""
import requests
import json

print("=" * 70)
print("CHECKING GPT-OSS ON PORT 8080")
print("=" * 70)
print()

# 1. Check health
try:
    r = requests.get("http://localhost:8080/health", timeout=2)
    if r.ok:
        data = r.json()
        print("✅ GPT-OSS is running!")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Service on 8080 but not responding properly")
except Exception as e:
    print(f"❌ Error: {e}")

print()

# 2. Test text generation
print("Testing text generation...")
try:
    r = requests.post("http://localhost:8080/v1/chat/completions",
                     json={
                         "model": "gpt-oss-20b",
                         "messages": [
                             {"role": "system", "content": "You are a financial analyst. Answer in 2 sentences."},
                             {"role": "user", "content": "What's the market outlook for today?"}
                         ],
                         "max_tokens": 100,
                         "temperature": 0.7
                     }, timeout=30)
    
    if r.ok:
        data = r.json()
        response = data['choices'][0]['message']['content']
        print("✅ Text generation working!")
        print(f"Response: {response}")
    else:
        print(f"❌ Generation failed: {r.status_code}")
        print(r.text)
except Exception as e:
    print(f"❌ Error: {e}")

print()
print("=" * 70)
print("CHECKING GPU USAGE")
print("=" * 70)
print()

# Check if PyTorch can see GPU
try:
    import torch
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Check current GPU memory usage
        allocated = torch.cuda.memory_allocated(0) / 1024**3
        reserved = torch.cuda.memory_reserved(0) / 1024**3
        print(f"GPU Memory Allocated: {allocated:.2f} GB")
        print(f"GPU Memory Reserved: {reserved:.2f} GB")
        
        if allocated > 0:
            print("✅ GPU is being used!")
        else:
            print("⚠️ GPU available but not currently in use")
    else:
        print("❌ CUDA not available - using CPU")
        print()
        print("To fix GPU support:")
        print("1. Uninstall current PyTorch:")
        print("   pip uninstall torch torchvision torchaudio")
        print()
        print("2. Install with CUDA support:")
        print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
except ImportError:
    print("PyTorch not installed in this environment")

print()
print("=" * 70)