#!/usr/bin/env python3
"""
Simple GPU test for RTX 5060 with GPT-OSS-20B
"""

import torch
import os

def test_gpu():
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA devices: {torch.cuda.device_count()}")
        print(f"GPU name: {torch.cuda.get_device_name(0)}")
        print(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
        # Simple tensor test on GPU
        print("\nTesting tensor operations on GPU...")
        device = torch.device("cuda:0")
        x = torch.randn(1000, 1000).to(device)
        y = torch.randn(1000, 1000).to(device)
        z = torch.mm(x, y)
        print(f"Matrix multiplication successful: {z.shape}")
        print("✅ GPU is working for basic operations!")
        
        return True
    else:
        print("❌ CUDA not available")
        return False

if __name__ == "__main__":
    test_gpu()