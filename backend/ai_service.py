"""
AI Service for Investors Daily Brief
Uses GPT OSS 20B model for generating financial content
"""
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GenerationRequest(BaseModel):
    prompt: str
    max_length: int = 512
    temperature: float = 0.7
    
class GenerationResponse(BaseModel):
    generated_text: str
    model_info: str

class AIService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_path = r"C:\ai-models\gpt-oss-20b\original"
        
    def load_model(self):
        """Load the GPT OSS 20B model"""
        try:
            logger.info("Loading GPT OSS 20B model...")
            
            # Check if CUDA is available
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {device}")
            
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            
            # Load model with appropriate settings for 20B parameters
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                device_map="auto" if device == "cuda" else None,
                low_cpu_mem_usage=True,
            )
            
            if device == "cpu":
                self.model = self.model.to(device)
                
            logger.info("Model loaded successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return False
    
    def generate_text(self, prompt: str, max_length: int = 512, temperature: float = 0.7) -> str:
        """Generate text using the loaded model"""
        if not self.model or not self.tokenizer:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        try:
            # Tokenize input
            inputs = self.tokenizer(prompt, return_tensors="pt")
            
            # Move to same device as model
            device = next(self.model.parameters()).device
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # Generate text
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode output
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Remove the input prompt from the generated text
            generated_text = generated_text[len(prompt):].strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")

# Initialize AI service
ai_service = AIService()
app = FastAPI(title="Investors Daily Brief AI Service", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Load the model on startup"""
    logger.info("Starting AI Service...")
    success = ai_service.load_model()
    if not success:
        logger.error("Failed to load model on startup")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": ai_service.model is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.post("/generate", response_model=GenerationResponse)
async def generate_financial_content(request: GenerationRequest):
    """Generate financial content for investors daily brief"""
    
    # Enhance prompt with financial context
    financial_prompt = f"""As a financial analyst, provide professional insight on the following:

{request.prompt}

Analysis:"""
    
    generated_text = ai_service.generate_text(
        financial_prompt, 
        request.max_length, 
        request.temperature
    )
    
    return GenerationResponse(
        generated_text=generated_text,
        model_info="GPT OSS 20B"
    )

@app.post("/brief", response_model=GenerationResponse)
async def generate_daily_brief(request: GenerationRequest):
    """Generate a complete daily brief section"""
    
    brief_prompt = f"""Generate a professional investors daily brief section about:

{request.prompt}

Please provide:
1. Key insights
2. Market implications
3. Actionable recommendations

Brief:"""
    
    generated_text = ai_service.generate_text(
        brief_prompt,
        request.max_length,
        request.temperature
    )
    
    return GenerationResponse(
        generated_text=generated_text,
        model_info="GPT OSS 20B - Daily Brief Mode"
    )

if __name__ == "__main__":
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=8001,
        reload=False  # Disable reload to prevent model reloading
    )