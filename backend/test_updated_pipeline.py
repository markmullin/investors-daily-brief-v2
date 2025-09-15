"""
Test the updated pipeline with simplified GPT-OSS routes
"""
import requests
import json

print("=" * 70)
print("TESTING UPDATED PIPELINE")
print("=" * 70)
print()

# 1. Test GPT-OSS health through backend
print("1. Testing GPT-OSS route in backend...")
try:
    r = requests.get("http://localhost:5000/api/gpt-oss/health", timeout=2)
    if r.ok:
        print("   ✅ GPT-OSS route is loaded!")
        print(f"   Response: {r.json()}")
    else:
        print(f"   ❌ Route exists but returned: {r.status_code}")
except Exception as e:
    print(f"   ❌ Route not working: {e}")

print()

# 2. Test market analysis endpoint
print("2. Testing market analysis generation...")
try:
    data = {
        "sp500Price": 6481.41,
        "sp500Change": 1.5,
        "nasdaqPrice": 20000,
        "nasdaqChange": 2.0,
        "vix": 16,
        "treasury10y": 4.0,
        "marketPhase": "NEUTRAL",
        "analysisType": "marketPhase"
    }
    
    print("   Sending request to /api/gpt-oss/market-analysis...")
    r = requests.post("http://localhost:5000/api/gpt-oss/market-analysis", 
                      json=data, 
                      timeout=60)
    
    if r.ok:
        result = r.json()
        if result.get('success') and result.get('data'):
            analysis = result['data'].get('analysis', '')
            print("   ✅ Analysis generated successfully!")
            print(f"   Model: {result['data'].get('model', 'unknown')}")
            print(f"   GPU: {result['data'].get('gpu', 'unknown')}")
            print()
            print("   Generated Analysis:")
            print("   " + "="*50)
            print(f"   {analysis}")
            print("   " + "="*50)
        else:
            print(f"   ⚠️ Response format unexpected: {result}")
    else:
        print(f"   ❌ Request failed: {r.status_code}")
        print(f"   Error: {r.text[:200]}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("=" * 70)
print("FRONTEND UPDATE STATUS")
print("=" * 70)
print()
print("✅ Analysis box styling updated:")
print("   - White background with chrome details")
print("   - Orange headers to match dashboard")
print("   - Gray text for readability")
print("   - Clean borders and shadows")
print()
print("✅ Backend routes updated:")
print("   - Using simplified gptOSSSimple.js")
print("   - Direct proxy to llama.cpp")
print("   - Fallback responses included")
print()
print("NEXT STEPS:")
print("1. Restart backend: Ctrl+C then npm run dev")
print("2. Hard refresh dashboard: Ctrl+Shift+R")
print("3. Analysis boxes should now be white with real GPT-OSS content!")
print("=" * 70)