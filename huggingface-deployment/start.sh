#!/bin/bash

# Start Ollama in background
echo "Starting Ollama..."
ollama serve &

# Wait for Ollama to be ready
sleep 10

# Start nginx to proxy port 7860 to Ollama's 11434
echo "Starting nginx proxy..."
nginx -g 'daemon off;' &

# Keep container running and show logs
echo "AI Service Ready!"
echo "Ollama is running on port 11434 (proxied through 7860)"
tail -f /dev/null
