"""
Direct Test of Pipeline Components
Run this with: python test_direct.py
"""

import requests
import json

print("=" * 60)
print("TESTING EACH SERVICE DIRECTLY")
print("=" * 60)
print()

# Test 1: Python Service
print("1. Testing Python Analysis Service...")
try:
    # Test health
    r = requests.get("http://localhost:8000/health")
    print(f"   Health: {r.status_code}")
    
    # Test actual analysis
    r = requests.post("http://localhost:8000/analyze", 
                     json={"type": "marketPhase", "data": {}})
    if r.ok:
        data = r.json()
        print(f"   ✅ Python working: {data.get('phase')} ({data.get('phaseScore')}/100)")
    else:
        print(f"   ❌ Analysis failed: {r.status_code}")
except Exception as e:
    print(f"   ❌ NOT RUNNING - Start with: python analysis_service.py")

print()

# Test 2: GPT-OSS
print("2. Testing GPT-OSS Service...")
try:
    # Test health
    r = requests.get("http://localhost:8080/health")
    print(f"   Health: {r.status_code}")
    
    # Test completion
    r = requests.post("http://localhost:8080/v1/chat/completions",
                     json={
                         "model": "gpt-oss-20b",
                         "messages": [{"role": "user", "content": "Test"}],
                         "max_tokens": 10
                     })
    if r.ok:
        print(f"   ✅ GPT-OSS working")
    else:
        print(f"   ❌ Completion failed: {r.status_code}")
except Exception as e:
    print(f"   ❌ NOT RUNNING - Start with: python -m uvicorn gpt_oss_server:app --port 8080")

print()

# Test 3: Backend Pipeline
print("3. Testing Backend Pipeline...")
try:
    r = requests.get("http://localhost:5000/api/intelligent-analysis/market-phase")
    if r.ok:
        data = r.json()
        if data.get('insight'):
            print(f"   ✅ PIPELINE WORKING!")
            print(f"   Insight: {data['insight'][:100]}...")
        else:
            print(f"   ⚠️ Pipeline returned but no insight")
    else:
        print(f"   ❌ Pipeline failed: {r.status_code}")
except Exception as e:
    print(f"   ❌ Backend not responding")

print()
print("=" * 60)
print("SUMMARY:")
print("If any failed, start that service (see commands above)")
print("=" * 60)