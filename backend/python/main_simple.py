from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import pandas as pd
import numpy as np

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

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Python Analysis Service",
        "version": "1.0.0",
        "capabilities": [
            "numerical_analysis",
            "chart_recommendations", 
            "data_processing"
        ]
    }

@app.post("/analyze")
def analyze(request: AnalysisRequest):
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Simple analysis based on type
        if request.analysis_type == "summary":
            # Basic summary statistics
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            summary = {}
            
            for col in numeric_cols:
                summary[col] = {
                    "mean": float(df[col].mean()),
                    "std": float(df[col].std()),
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "count": int(df[col].count())
                }
            
            return {"results": {"analysis_type": "summary", "statistics": summary}}
        
        elif request.analysis_type == "trend":
            # Simple trend analysis
            if len(df) < 2:
                return {"results": {"error": "Need at least 2 data points for trend analysis"}}
                
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) == 0:
                return {"results": {"error": "No numeric columns found"}}
                
            col = numeric_cols[0]  # Use first numeric column
            values = df[col].values
            
            # Calculate simple linear trend
            x = np.arange(len(values))
            slope, intercept = np.polyfit(x, values, 1)
            
            return {
                "results": {
                    "analysis_type": "trend",
                    "column": col,
                    "slope": float(slope),
                    "direction": "upward" if slope > 0 else "downward",
                    "first_value": float(values[0]),
                    "last_value": float(values[-1]),
                    "total_change": float(values[-1] - values[0]),
                    "percent_change": float(((values[-1] / values[0]) - 1) * 100) if values[0] != 0 else 0
                }
            }
        
        else:
            return {"results": {"error": f"Analysis type '{request.analysis_type}' not supported yet"}}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-chart")
def recommend_chart(request: ChartRequest):
    try:
        df = pd.DataFrame(request.data)
        
        # Simple chart recommendation logic
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Default recommendation
        recommendation = {
            "chart_type": "line",
            "reason": "Default line chart for numerical data",
            "columns": numeric_cols[:5] if len(numeric_cols) > 0 else []
        }
        
        # Improve recommendation based on data structure
        if len(datetime_cols) > 0 and len(numeric_cols) > 0:
            recommendation = {
                "chart_type": "time_series",
                "reason": "Time series data detected",
                "x_axis": datetime_cols[0],
                "y_axis": numeric_cols[:3]
            }
        elif len(numeric_cols) >= 2:
            recommendation = {
                "chart_type": "scatter",
                "reason": "Multiple numeric columns - good for correlation analysis", 
                "x_axis": numeric_cols[0],
                "y_axis": numeric_cols[1]
            }
        elif len(df) > 50:
            recommendation = {
                "chart_type": "histogram",
                "reason": "Large dataset - histogram shows distribution",
                "columns": numeric_cols[:2]
            }
            
        return recommendation
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simple test endpoint
@app.post("/test")
def test_analysis():
    # Generate sample data for testing
    sample_data = []
    for i in range(10):
        sample_data.append({
            "date": f"2024-01-{i+1:02d}",
            "price": 100 + i * 2 + np.random.randn() * 5,
            "volume": 1000 + np.random.randint(0, 500)
        })
    
    df = pd.DataFrame(sample_data)
    
    # Test trend analysis
    values = df['price'].values
    x = np.arange(len(values))
    slope, intercept = np.polyfit(x, values, 1)
    
    return {
        "test_data": sample_data,
        "trend_analysis": {
            "slope": float(slope),
            "direction": "upward" if slope > 0 else "downward",
            "total_change": float(values[-1] - values[0])
        }
    }

if __name__ == "__main__":
    uvicorn.run("main_simple:app", host="0.0.0.0", port=8000, reload=True)
