"""
SIMPLE TEST - Is GPT-OSS already running?
"""
import requests

print("\n" + "="*60)
print("TESTING IF GPT-OSS IS ALREADY RUNNING")
print("="*60 + "\n")

try:
    # Test if GPT-OSS is responding
    r = requests.get("http://localhost:8080/health", timeout=2)
    if r.ok:
        print("✅ GPT-OSS IS ALREADY RUNNING on port 8080!")
        print("Response:", r.json())
        print("\nYOU DON'T NEED TO START IT AGAIN!")
        print()
        
        # Test if it can generate text
        print("Testing text generation...")
        test_r = requests.post("http://localhost:8080/v1/chat/completions",
                              json={
                                  "model": "gpt-oss-20b",
                                  "messages": [{"role": "user", "content": "Say 'working' in one word"}],
                                  "max_tokens": 10
                              }, timeout=5)
        if test_r.ok:
            print("✅ GPT-OSS text generation is WORKING!")
        else:
            print("⚠️ GPT-OSS is running but generation failed")
    else:
        print("❌ Something on port 8080 but not GPT-OSS")
except:
    print("❌ Nothing running on port 8080")
    print("You need to start GPT-OSS")

print("\n" + "="*60)
print("NEXT STEPS:")
print("="*60 + "\n")

print("Since GPT-OSS is likely ALREADY RUNNING, just test the full pipeline:")
print()
print("1. Make sure Python analysis is running:")
print("   python analysis_service.py")
print()
print("2. Test the complete pipeline:")
print("   python final_test.py")
print()
print("If the pipeline test shows everything working, your dashboard should show AI analysis!")
print("\n" + "="*60)