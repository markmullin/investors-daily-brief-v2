# RunPod GPU Deployment Script
# Deploy Ollama with your models on RunPod GPU

# 1. Sign up at https://runpod.io
# 2. Add $10 credit (lasts ~25 hours on RTX 4090)
# 3. Create a new Pod with this Docker image:

FROM runpod/base:0.4.0-cuda11.8.0

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Download your models
RUN ollama pull qwen2.5:3b
RUN ollama pull deepseek-r1:8b

# Expose port
EXPOSE 11434

# Start Ollama
CMD ["ollama", "serve", "--host", "0.0.0.0"]

# 4. RunPod will give you a public URL like:
#    https://abc123-11434.proxy.runpod.net
# 5. Set that as OLLAMA_URL in Render environment variables
