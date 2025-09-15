"""
COMPREHENSIVE PIPELINE TEST - Run this FIRST!
This will tell you EXACTLY what's working and what needs to be started
Run with: python comprehensive_test.py
"""

import requests
import time
import json

def test_service(name, url, test_type="GET", data=None):
    """Test a service and return status"""
    try:
        if test_type == "GET":
            r = requests.get(url, timeout=2)
        else:
            r = requests.post(url, json=data, timeout=2)
        
        if r.ok:
            return True, r.json()
        else:
            return False, f"Status {r.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Not running"
    except Exception as e:
        return False, str(e)

print("=" * 70)
print(" INTELLIGENT ANALYSIS PIPELINE TEST")
print("=" * 70)
print()

# Store results
services = {}

# 1. Test Python Analysis Service
print("📊 PYTHON ANALYSIS SERVICE (Port 8000)")
print("-" * 40)
status, result = test_service("Python Health", "http://localhost:8000/health")
services['python'] = status
if status:
    print(f"✅ Health Check: {result}")
    
    # Test actual analysis
    status2, result2 = test_service("Python Analysis", "http://localhost:8000/analyze", 
                                    "POST", {"type": "marketPhase", "data": {}})
    if status2:
        print(f"✅ Analysis Working: Phase={result2.get('phase')}, Score={result2.get('phaseScore')}")
    else:
        print(f"❌ Analysis Failed: {result2}")
else:
    print(f"❌ NOT RUNNING: {result}")
    print("👉 FIX: python analysis_service.py")
print()

# 2. Test GPT-OSS Service
print("🤖 GPT-OSS SERVICE (Port 8080)")
print("-" * 40)
status, result = test_service("GPT-OSS Health", "http://localhost:8080/health")
services['gptoss'] = status
if status:
    print(f"✅ Health Check: {result}")
    
    # Test OpenAI-compatible endpoint
    status2, result2 = test_service("GPT-OSS Completion", "http://localhost:8080/v1/chat/completions",
                                    "POST", {
                                        "model": "gpt-oss-20b",
                                        "messages": [{"role": "user", "content": "Say 'working' in 1 word"}],
                                        "max_tokens": 10
                                    })
    if status2:
        print(f"✅ Completions Working")
    else:
        print(f"⚠️ Completions endpoint not working: {result2}")
else:
    print(f"❌ NOT RUNNING: {result}")
    print("👉 FIX: python -m uvicorn gpt_oss_server:app --host 0.0.0.0 --port 8080")
print()

# 3. Test Backend Intelligent Analysis Routes
print("🔗 BACKEND INTELLIGENT ANALYSIS (Port 5000)")
print("-" * 40)
status, result = test_service("Backend Health", "http://localhost:5000/api/intelligent-analysis/health")
services['backend'] = status
if status:
    print(f"✅ Routes Loaded: {result}")
    
    # Check pipeline status
    pipeline_status = result.get('pipeline', 'unknown')
    print(f"   Pipeline Status: {pipeline_status}")
    
    # Check service connections
    service_status = result.get('services', {})
    print(f"   Python Service: {service_status.get('python', 'unknown')}")
    print(f"   GPT-OSS Service: {service_status.get('gptOss', 'unknown')}")
else:
    print(f"❌ Routes NOT loaded: {result}")
    print("👉 FIX: Restart backend with: npm run dev")
print()

# 4. Test Full Pipeline
print("🚀 FULL PIPELINE TEST")
print("-" * 40)
if services.get('python') and services.get('gptoss') and services.get('backend'):
    print("Testing complete pipeline...")
    start_time = time.time()
    
    status, result = test_service("Full Pipeline", "http://localhost:5000/api/intelligent-analysis/market-phase")
    
    if status and result.get('insight'):
        elapsed = time.time() - start_time
        print(f"✅ PIPELINE FULLY WORKING! ({elapsed:.1f} seconds)")
        print(f"   Insight: {result['insight'][:150]}...")
        print(f"   Has Calculations: {bool(result.get('calculations'))}")
        print(f"   Has Metadata: {bool(result.get('metadata'))}")
    else:
        print(f"❌ Pipeline failed: {result}")
else:
    print("❌ Cannot test - required services not running")
    missing = []
    if not services.get('python'): missing.append("Python")
    if not services.get('gptoss'): missing.append("GPT-OSS")
    if not services.get('backend'): missing.append("Backend Routes")
    print(f"   Missing: {', '.join(missing)}")
print()

# 5. Test Frontend Integration
print("🌐 FRONTEND INTEGRATION")
print("-" * 40)
print("Test these URLs in your browser:")
print()
print("1. Full Dashboard: http://localhost:5173")
print("2. Direct API Test: http://localhost:5000/api/intelligent-analysis/market-phase")
print("3. Python Test: http://localhost:8000/health")
print("4. GPT-OSS Test: http://localhost:8080/health")
print()

# Summary
print("=" * 70)
print(" SUMMARY")
print("=" * 70)
print()

all_working = all([services.get('python'), services.get('gptoss'), services.get('backend')])

if all_working:
    print("✅ ALL SERVICES RUNNING - Pipeline should work!")
    print()
    print("If you still don't see analysis in the dashboard:")
    print("1. Hard refresh browser: Ctrl+Shift+R")
    print("2. Check browser console for errors: F12")
    print("3. Check that IntelligentAnalysis component is imported in MarketAwareness.jsx")
else:
    print("❌ Some services need to be started:")
    print()
    
    if not services.get('python'):
        print("1. Start Python Analysis Service:")
        print("   cd backend")
        print("   python analysis_service.py")
        print()
    
    if not services.get('gptoss'):
        print("2. Start GPT-OSS Service:")
        print("   cd backend")
        print("   python -m uvicorn gpt_oss_server:app --host 0.0.0.0 --port 8080")
        print()
    
    if not services.get('backend'):
        print("3. Restart Backend to load routes:")
        print("   cd backend")
        print("   (Ctrl+C to stop, then)")
        print("   npm run dev")
        print()

print("=" * 70)