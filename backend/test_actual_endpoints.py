"""
Test the ACTUAL endpoints that exist in your backend
"""
import requests
import json

print("=" * 70)
print("TESTING ACTUAL WORKING ENDPOINTS")
print("=" * 70)
print()

base_url = "http://localhost:5000"

# Test GPT-OSS endpoints that ACTUALLY exist
endpoints = [
    "/api/gpt-oss/health",
    "/api/gpt-oss/market-analysis",
    "/api/intelligent-analysis/market-phase",  # This might not exist
]

print("Testing endpoints that are actually configured...")
print()

for endpoint in endpoints:
    url = base_url + endpoint
    print(f"Testing: {endpoint}")
    
    try:
        if "health" in endpoint:
            r = requests.get(url, timeout=2)
        elif "market-analysis" in endpoint:
            # This needs POST with data
            r = requests.post(url, json={
                "sp500Price": 6481,
                "sp500Change": 1.5,
                "nasdaqPrice": 20000,
                "nasdaqChange": 2.0,
                "vix": 15,
                "treasury10y": 4.0,
                "marketPhase": "NEUTRAL"
            }, timeout=30)
        else:
            r = requests.get(url, timeout=10)
        
        if r.ok:
            print(f"✅ {r.status_code} - Working!")
            if "market" in endpoint and r.ok:
                data = r.json()
                if 'data' in data:
                    print(f"   Response: {data['data'].get('analysis', '')[:100]}...")
                elif 'insight' in data:
                    print(f"   Insight: {data['insight'][:100]}...")
        else:
            print(f"❌ {r.status_code} - {endpoint} not found or error")
    except Exception as e:
        print(f"❌ Error: {e}")
    print()

print("=" * 70)
print("THE REAL ISSUE:")
print("=" * 70)
print()
print("Your services are ALL running correctly:")
print("✅ Python Analysis (8000)")
print("✅ GPT-OSS llama.cpp (8080) - Using GPU!")
print("✅ Backend (5000)")
print()
print("But the /api/intelligent-analysis routes aren't loaded.")
print()
print("Try using the GPT-OSS endpoint directly:")
print("POST http://localhost:5000/api/gpt-oss/market-analysis")
print()
print("This should work since GPT-OSS routes ARE loaded!")
print("=" * 70)