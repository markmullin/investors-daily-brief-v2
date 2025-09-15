"""
Test file to verify intelligent analysis pipeline
Run this to test if all services are connected properly
"""

import requests
import json

def test_pipeline():
    print("=" * 60)
    print("TESTING INTELLIGENT ANALYSIS PIPELINE")
    print("=" * 60)
    print()
    
    # Test 1: Python Analysis Service
    print("1. Testing Python Analysis Service (Port 8000)...")
    try:
        response = requests.get("http://localhost:8000/health")
        if response.ok:
            print("   ✅ Python service is running")
        else:
            print("   ❌ Python service returned error:", response.status_code)
    except Exception as e:
        print("   ❌ Python service is NOT running:", str(e))
        print("   👉 Start it with: python analysis_service.py")
    print()
    
    # Test 2: GPT-OSS Service
    print("2. Testing GPT-OSS Service (Port 8080)...")
    try:
        response = requests.get("http://localhost:8080/health")
        if response.ok:
            print("   ✅ GPT-OSS is running")
        else:
            print("   ❌ GPT-OSS returned error:", response.status_code)
    except Exception as e:
        print("   ❌ GPT-OSS is NOT running:", str(e))
        print("   👉 Start it with: start-gpt-oss.bat")
    print()
    
    # Test 3: Backend Intelligent Analysis Routes
    print("3. Testing Backend Intelligent Analysis Routes (Port 5000)...")
    try:
        response = requests.get("http://localhost:5000/api/intelligent-analysis/health")
        if response.ok:
            data = response.json()
            print("   ✅ Intelligent Analysis routes loaded")
            print("   Pipeline status:", data.get('pipeline', 'unknown'))
        else:
            print("   ❌ Intelligent Analysis routes error:", response.status_code)
    except Exception as e:
        print("   ❌ Backend routes NOT working:", str(e))
        print("   👉 Restart backend: npm run dev")
    print()
    
    # Test 4: Full Pipeline Test
    print("4. Testing Full Pipeline (Market Phase Analysis)...")
    try:
        response = requests.get("http://localhost:5000/api/intelligent-analysis/market-phase")
        if response.ok:
            data = response.json()
            if data.get('insight'):
                print("   ✅ Full pipeline working!")
                print("   Analysis:", data['insight'][:100] + "...")
            else:
                print("   ⚠️ Pipeline returned but no insight generated")
                print("   Response:", json.dumps(data, indent=2))
        else:
            print("   ❌ Pipeline request failed:", response.status_code)
            print("   Response:", response.text)
    except Exception as e:
        print("   ❌ Pipeline test failed:", str(e))
    print()
    
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print()
    print("If any tests failed above, start the missing services:")
    print()
    print("1. Python: python analysis_service.py")
    print("2. GPT-OSS: start-gpt-oss.bat")
    print("3. Backend: npm run dev")
    print()
    print("All 3 services must be running for intelligent analysis to work!")

if __name__ == "__main__":
    test_pipeline()