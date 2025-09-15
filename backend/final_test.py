"""
FINAL TEST - THIS WILL SHOW YOU EXACTLY WHAT'S WORKING
Run: python final_test.py
"""

import requests
import time

print("\n" + "="*70)
print(" INTELLIGENT ANALYSIS PIPELINE - FINAL TEST")
print("="*70 + "\n")

def check_service(name, port, path="/health"):
    """Check if a service is running"""
    try:
        r = requests.get(f"http://localhost:{port}{path}", timeout=1)
        return r.ok
    except:
        return False

# Quick status check
python_running = check_service("Python", 8000)
gptoss_running = check_service("GPT-OSS", 8080)
backend_running = check_service("Backend", 5000, "/health")

print("SERVICE STATUS:")
print("-" * 40)
print(f"1. Python Analysis (8000): {'✅ RUNNING' if python_running else '❌ NOT RUNNING'}")
print(f"2. GPT-OSS Server (8080):  {'✅ RUNNING' if gptoss_running else '❌ NOT RUNNING'}")
print(f"3. Backend API (5000):     {'✅ RUNNING' if backend_running else '❌ NOT RUNNING'}")
print()

if not python_running:
    print("❌ Python not running!")
    print("👉 RUN: python analysis_service.py")
    print()

if not gptoss_running:
    print("❌ GPT-OSS not running!")
    print("👉 RUN: python -m uvicorn gpt_oss_server:app --host 0.0.0.0 --port 8080")
    print()

if not backend_running:
    print("❌ Backend not running!")
    print("👉 RUN: npm run dev")
    print()

if python_running and gptoss_running and backend_running:
    print("TESTING FULL PIPELINE:")
    print("-" * 40)
    
    try:
        print("Calling: http://localhost:5000/api/intelligent-analysis/market-phase")
        start = time.time()
        r = requests.get("http://localhost:5000/api/intelligent-analysis/market-phase", timeout=30)
        elapsed = time.time() - start
        
        if r.ok:
            data = r.json()
            if data.get('insight'):
                print(f"✅ SUCCESS! Pipeline working ({elapsed:.1f}s)")
                print()
                print("AI INSIGHT:")
                print("-" * 40)
                print(data['insight'])
                print("-" * 40)
                print()
                print("Has Python calculations:", bool(data.get('calculations')))
                print("Has GPT-OSS metadata:", bool(data.get('metadata')))
                print()
                print("🎉 PIPELINE IS FULLY OPERATIONAL!")
            else:
                print("⚠️ Response received but no insight generated")
                print("Response:", data)
        else:
            print(f"❌ Request failed: {r.status_code}")
            print("Error:", r.text[:200])
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")
    
    print()
    print("BROWSER TESTS:")
    print("-" * 40)
    print("1. API Test: http://localhost:5000/api/intelligent-analysis/market-phase")
    print("2. Dashboard: http://localhost:5173")
    print()
    print("In dashboard, you should see AI analysis boxes under each chart!")
else:
    print("⚠️ Cannot test pipeline - start the missing services first!")

print("\n" + "="*70)