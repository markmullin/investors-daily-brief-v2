"""
Check what's ACTUALLY running on port 8080 right now
"""
import requests
import json

print("=" * 70)
print("CHECKING WHAT'S ON PORT 8080")
print("=" * 70)
print()

try:
    # Check health endpoint
    r = requests.get("http://localhost:8080/health", timeout=2)
    if r.ok:
        print("✅ Something is responding on port 8080!")
        data = r.json()
        print("Response:", json.dumps(data, indent=2))
        print()
        
        # Check if it's llama.cpp by testing OpenAI endpoint
        print("Testing if it's llama.cpp server...")
        test_r = requests.post("http://localhost:8080/v1/chat/completions",
                              json={
                                  "model": "gpt-oss-20b",
                                  "messages": [{"role": "user", "content": "Say 'working' in one word"}],
                                  "max_tokens": 10
                              }, timeout=10)
        
        if test_r.ok:
            print("✅ This is llama.cpp server! It's already working!")
            response = test_r.json()
            if 'choices' in response:
                print("Generated:", response['choices'][0]['message']['content'])
        else:
            print("⚠️ Not llama.cpp or not configured correctly")
    else:
        print("❌ Service on 8080 but not healthy")
except requests.exceptions.ConnectionError:
    print("❌ Nothing running on port 8080")
    print()
    print("Start llama.cpp server with:")
    print("cd backend")
    print("start-working-gpt-oss.bat")
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 70)
print("NEXT STEP:")
print("=" * 70)
print()
print("If llama.cpp is NOT running on 8080:")
print("1. Kill whatever is there: taskkill /F /IM python.exe")
print("2. Start the WORKING server: start-working-gpt-oss.bat")
print()
print("If llama.cpp IS running on 8080:")
print("Just run: python test_working_pipeline.py")
print("=" * 70)