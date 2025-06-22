from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

from analysis.numerical_analysis import analyze_data
from analysis.chart_selection import recommend_chart_type
from utils.data_processing import process_financial_data

app = FastAPI(title="Market Dashboard Python Service", 
              description="Python microservice for market data analysis",
              version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    analysis_type: str
    parameters: Optional[Dict[str, Any]] = None

class ChartRequest(BaseModel):
    data: List[Dict[str, Any]]
    user_prompt: str
    additional_context: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Market Dashboard Python Analysis Service"}

@app.post("/analyze")
def analyze(request: AnalysisRequest):
    try:
        # Process the data
        processed_data = process_financial_data(request.data)
        
        # Perform numerical analysis
        analysis_results = analyze_data(processed_data, request.analysis_type, request.parameters)
        
        return {"results": analysis_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-chart")
def recommend_chart(request: ChartRequest):
    try:
        # Recommend the best chart type based on the data and user prompt
        chart_recommendation = recommend_chart_type(request.data, request.user_prompt, request.additional_context)
        
        return chart_recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
