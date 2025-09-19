FROM nvidia/cuda:12.1.0-base-ubuntu22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Create app directory
WORKDIR /app

# Copy nginx config for reverse proxy
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose HuggingFace's required port
EXPOSE 7860

# Download models at build time (so they're ready)
RUN ollama serve & sleep 5 && \
    ollama pull qwen2.5:3b && \
    ollama pull deepseek-r1:8b && \
    pkill ollama

# Start everything
CMD ["/app/start.sh"]
