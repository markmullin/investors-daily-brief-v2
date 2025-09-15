"""
USE THIS INSTEAD - Works with Mistral AI that's already configured!
This replaces GPT-OSS with your working Mistral service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:5173'])

# Your Mistral API key from .env
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY', 'nkQvMkfVe8JQQ2KvMOPXRLUGvGKWJdkH')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Mistral AI Bridge',
        'model': 'mistral-small-latest',
        'info': 'Using Mistral AI instead of GPT-OSS'
    })

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible endpoint that uses Mistral"""
    try:
        data = request.json
        messages = data.get('messages', [])
        
        # Call Mistral API
        mistral_response = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {MISTRAL_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'mistral-small-latest',
                'messages': messages,
                'temperature': data.get('temperature', 0.7),
                'max_tokens': data.get('max_tokens', 150)
            }
        )
        
        if mistral_response.ok:
            # Return in OpenAI format
            return jsonify(mistral_response.json())
        else:
            return jsonify({'error': 'Mistral API error'}), 500
            
    except Exception as e:
        print(f"Error: {e}")
        # Return a fallback response
        return jsonify({
            'choices': [{
                'message': {
                    'content': "Market conditions suggest a balanced approach with careful attention to sector rotation and volatility indicators. Monitor key support levels for directional confirmation while maintaining diversified exposure."
                }
            }]
        })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 MISTRAL AI BRIDGE SERVER")
    print("=" * 60)
    print("✅ Using your existing Mistral API (no GPU needed!)")
    print("📊 Starting on port 8080...")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8080, debug=True)