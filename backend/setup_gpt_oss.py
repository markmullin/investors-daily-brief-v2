# GPT-OSS Direct Integration Script
# Run this to set up GPT-OSS in your backend

import os
import subprocess
import sys

def setup_gpt_oss():
    """Setup GPT-OSS for direct backend integration"""
    
    print("🚀 Setting up GPT-OSS Direct Integration...")
    
    # 1. Install the GPT-OSS package
    print("\n📦 Installing GPT-OSS package...")
    subprocess.run([sys.executable, "-m", "pip", "install", "gpt-oss"], check=True)
    
    # 2. Install required dependencies
    print("\n📦 Installing dependencies...")
    deps = [
        "torch",
        "transformers>=4.46.0",
        "accelerate",
        "sentencepiece",
        "protobuf",
        "fastapi",
        "uvicorn"
    ]
    
    for dep in deps:
        print(f"Installing {dep}...")
        subprocess.run([sys.executable, "-m", "pip", "install", dep], check=True)
    
    print("\n✅ GPT-OSS setup complete!")
    print("\n📥 Now download the model weights:")
    print("huggingface-cli download openai/gpt-oss-20b --include 'original/*' --local-dir C:\\ai-models\\gpt-oss-20b")

if __name__ == "__main__":
    setup_gpt_oss()
