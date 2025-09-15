"""
GPT-OSS FastAPI Server - Direct Integration
Run with: uvicorn gpt_oss_server:app --host 0.0.0.0 --port 8080
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import torch
from transformers import pipeline

app = FastAPI()

# Model configuration
MODEL_PATH = "openai/gpt-oss-20b"  # Use official Hugging Face model
pipe = None

class PromptRequest(BaseModel):
    prompt: str
    reasoning: str = "medium"  # low, medium, high
    max_tokens: int = 512
    temperature: float = 0.7

class MarketAnalysisRequest(BaseModel):
    sp500_price: float
    sp500_change: float
    nasdaq_price: float
    nasdaq_change: float
    vix: float
    treasury_10y: float

@app.on_event("startup")
async def load_model():
    """Load GPT-OSS model on server startup"""
    global pipe
    try:
        print("Loading GPT-OSS-20B model...")
        pipe = pipeline(
            "text-generation",
            model=MODEL_PATH,
            torch_dtype=torch.bfloat16,
            device_map="auto",  # Use GPU automatically
            trust_remote_code=True
        )
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Failed to load model: {e}")
        print("Server will run without model (for testing)")

@app.get("/health")
async def health_check():
    """Check if service is running and model is loaded"""
    return {
        "status": "running",
        "model_loaded": pipe is not None,
        "model": "GPT-OSS-20B",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "market_analysis": "/market-analysis",
            "explain": "/explain"
        }
    }

@app.post("/generate")
async def generate(request: PromptRequest):
    """Generate response with GPT-OSS"""
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Add reasoning level to prompt
        system_prompt = f"Reasoning: {request.reasoning}\n"
        full_prompt = system_prompt + request.prompt
        
        messages = [
            {"role": "user", "content": full_prompt}
        ]
        
        outputs = pipe(
            messages,
            max_new_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        response = outputs[0]["generated_text"][-1]["content"]
        
        return {
            "success": True,
            "response": response,
            "reasoning": request.reasoning,
            "model": "GPT-OSS-20B"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/market-analysis")
async def analyze_market(request: MarketAnalysisRequest):
    """Analyze market conditions"""
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    prompt = f"""Analyze the current market conditions:

Market Data:
- S&P 500: ${request.sp500_price} ({request.sp500_change:+.2f}%)
- NASDAQ: ${request.nasdaq_price} ({request.nasdaq_change:+.2f}%)
- VIX: {request.vix}
- 10Y Treasury: {request.treasury_10y}%

Provide a comprehensive analysis including:
1. Current market phase (Bull/Bear/Neutral)
2. Key drivers of today's movement
3. Risk factors to monitor
4. Opportunities for investors

Keep the analysis concise and actionable."""

    messages = [
        {"role": "system", "content": "Reasoning: medium\nYou are an expert financial analyst."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        outputs = pipe(
            messages,
            max_new_tokens=512,
            temperature=0.7
        )
        
        analysis = outputs[0]["generated_text"][-1]["content"]
        
        return {
            "success": True,
            "analysis": analysis,
            "model": "GPT-OSS-20B"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
async def explain_concept(concept: str, context: Optional[str] = None):
    """Explain financial concepts in simple terms"""
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    prompt = f"""Explain the financial concept "{concept}" in simple terms that a high school student could understand.
{f'Context: {context}' if context else ''}

Requirements:
- Use simple language
- Include a real-world analogy
- Explain why it matters to investors
- Keep response under 200 words"""

    messages = [
        {"role": "system", "content": "Reasoning: low\nYou are a helpful financial educator."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        outputs = pipe(
            messages,
            max_new_tokens=256,
            temperature=0.7
        )
        
        explanation = outputs[0]["generated_text"][-1]["content"]
        
        return {
            "success": True,
            "explanation": explanation,
            "concept": concept,
            "model": "GPT-OSS-20B"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
