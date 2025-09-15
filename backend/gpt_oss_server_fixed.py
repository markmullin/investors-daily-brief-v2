"""
GPT-OSS FastAPI Server - Fixed for proper model loading
Run with: uvicorn gpt_oss_server_fixed:app --host 0.0.0.0 --port 8080
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

app = FastAPI()

# Check if gpt_oss package is available
try:
    from gpt_oss import GPTOSSModel
    MODEL_AVAILABLE = True
    model = None
except ImportError:
    MODEL_AVAILABLE = False
    print("⚠️ GPT-OSS package not installed. Running in mock mode.")
    print("Install with: pip install gpt-oss")

class PromptRequest(BaseModel):
    prompt: str
    reasoning: str = "medium"
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
    global model
    if MODEL_AVAILABLE:
        try:
            print("🚀 Loading GPT-OSS-20B model...")
            model_path = "C:/ai-models/gpt-oss-20b"
            # Try to load with gpt_oss package
            model = GPTOSSModel.from_pretrained(model_path)
            print("✅ Model loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            print("⚠️ Running in mock mode")
            model = None
    else:
        print("⚠️ GPT-OSS package not available, using mock responses")

@app.get("/health")
async def health_check():
    """Check if service is running and model is loaded"""
    return {
        "status": "running",
        "model_loaded": model is not None if MODEL_AVAILABLE else False,
        "model": "GPT-OSS-20B" if model else "Mock Mode",
        "package_installed": MODEL_AVAILABLE
    }

@app.post("/generate")
async def generate(request: PromptRequest):
    """Generate response with GPT-OSS or mock"""
    if MODEL_AVAILABLE and model:
        try:
            # Use actual model
            response = model.generate(
                request.prompt,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                reasoning=request.reasoning
            )
            return {
                "success": True,
                "response": response,
                "model": "GPT-OSS-20B"
            }
        except Exception as e:
            return {"success": False, "error": str(e), "model": "Error"}
    else:
        # Mock response for testing integration
        mock_response = f"[Mock AI Response] This is a test response for: {request.prompt[:50]}..."
        return {
            "success": True,
            "response": mock_response,
            "model": "Mock"
        }

@app.post("/market-analysis")
async def analyze_market(request: MarketAnalysisRequest):
    """Analyze market conditions"""
    prompt = f"""Analyze the current market conditions:

Market Data:
- S&P 500: ${request.sp500_price} ({request.sp500_change:+.2f}%)
- NASDAQ: ${request.nasdaq_price} ({request.nasdaq_change:+.2f}%)
- VIX: {request.vix}
- 10Y Treasury: {request.treasury_10y}%

Provide analysis of market phase and key drivers."""

    if MODEL_AVAILABLE and model:
        try:
            response = model.generate(prompt, reasoning="medium")
            return {"success": True, "analysis": response, "model": "GPT-OSS-20B"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    else:
        # Mock analysis for testing
        mock_analysis = f"""[Mock Analysis]
Market Phase: {"Bull" if request.sp500_change > 0 else "Bear"}
- S&P 500 at ${request.sp500_price} ({request.sp500_change:+.2f}%)
- VIX at {request.vix} indicates {"low" if request.vix < 20 else "high"} volatility
- Treasury yields at {request.treasury_10y}% affecting growth stocks
- Overall sentiment: {"Positive" if request.sp500_change > 0 else "Cautious"}"""
        
        return {
            "success": True,
            "analysis": mock_analysis,
            "model": "Mock"
        }

@app.post("/explain")
async def explain_concept(concept: str, context: Optional[str] = None):
    """Explain financial concepts"""
    prompt = f"Explain '{concept}' in simple terms."
    
    if MODEL_AVAILABLE and model:
        try:
            response = model.generate(prompt, reasoning="low")
            return {"success": True, "explanation": response, "model": "GPT-OSS-20B"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    else:
        mock_explanation = f"[Mock] {concept} is a financial term that... (mock explanation)"
        return {
            "success": True,
            "explanation": mock_explanation,
            "model": "Mock"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
