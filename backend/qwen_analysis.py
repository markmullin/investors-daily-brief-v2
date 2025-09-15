"""
Qwen 3 8B Analysis Pipeline
Real-time market analysis using local Qwen model
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests
import logging
from typing import Dict, List, Any
import asyncio
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QwenMarketAnalyzer:
    """
    Analyzes market data using Qwen 3 8B model
    Pipeline: FMP Data → Python ML Analysis → Qwen 3 8B → Intelligent Insights
    """
    
    def __init__(self):
        # Qwen is running on port 8081 as per your setup
        self.qwen_url = "http://localhost:8081/v1/chat/completions"
        self.headers = {"Content-Type": "application/json"}
        
    async def analyze_market_environment(self, market_data: Dict) -> Dict:
        """
        Analyze overall market environment using Qwen
        """
        try:
            # Prepare context from real data
            context = self._prepare_market_context(market_data)
            
            prompt = f"""You are a senior market analyst. Based on the following real-time market data, provide a concise market analysis.

Market Data:
{json.dumps(context, indent=2)}

Provide:
1. A clear assessment of current market conditions
2. Key risks to watch
3. Actionable recommendations
4. Confidence level (0-100%)

Keep your response concise and at a high school reading level. Focus on what matters most to investors right now."""

            # Call Qwen model
            response = await self._call_qwen(prompt)
            
            # Parse and structure the response
            analysis = self._parse_market_analysis(response)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in market environment analysis: {e}")
            return self._get_fallback_analysis()
    
    async def analyze_indices(self, indices_data: Dict) -> Dict:
        """
        Analyze major market indices with Qwen
        """
        try:
            # Calculate technical indicators
            technicals = self._calculate_technical_indicators(indices_data)
            
            prompt = f"""Analyze the following market indices data:

{json.dumps(technicals, indent=2)}

Provide:
1. Overall market trend assessment
2. Support and resistance levels
3. Momentum indicators interpretation
4. Short-term outlook (1-5 days)

Focus on actionable insights that retail investors can use."""

            response = await self._call_qwen(prompt)
            return self._parse_indices_analysis(response)
            
        except Exception as e:
            logger.error(f"Error in indices analysis: {e}")
            return {"analysis": "Indices analysis temporarily unavailable", "confidence": 0}
    
    async def _call_qwen(self, prompt: str) -> str:
        """
        Call the Qwen 3 8B model API
        """
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "qwen",
                    "messages": [
                        {"role": "system", "content": "You are a professional financial analyst providing clear, actionable market insights."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
                
                async with session.post(self.qwen_url, json=payload, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data['choices'][0]['message']['content']
                    else:
                        logger.error(f"Qwen API error: {response.status}")
                        return "Analysis temporarily unavailable"
                        
        except Exception as e:
            logger.error(f"Error calling Qwen: {e}")
            return "Analysis temporarily unavailable"
    
    def _prepare_market_context(self, market_data: Dict) -> Dict:
        """
        Prepare and enrich market data for analysis
        """
        context = {
            "timestamp": datetime.now().isoformat(),
            "market_phase": market_data.get("phase", "Unknown"),
            "vix": market_data.get("vix", 0),
            "breadth": market_data.get("breadth", {}),
            "sentiment": market_data.get("sentiment", {}),
            "fundamentals": market_data.get("fundamentals", {}),
            "trend": market_data.get("trend", {})
        }
        
        # Add calculated metrics
        if "breadth" in market_data:
            context["market_strength"] = self._calculate_market_strength(market_data["breadth"])
        
        return context
    
    def _calculate_market_strength(self, breadth: Dict) -> str:
        """
        Calculate overall market strength from breadth data
        """
        advancing = breadth.get("advancing", 0)
        declining = breadth.get("declining", 0)
        
        if advancing + declining == 0:
            return "Neutral"
        
        ratio = advancing / (advancing + declining)
        
        if ratio > 0.7:
            return "Very Strong"
        elif ratio > 0.55:
            return "Strong"
        elif ratio > 0.45:
            return "Neutral"
        elif ratio > 0.3:
            return "Weak"
        else:
            return "Very Weak"
    
    def _calculate_technical_indicators(self, indices_data: Dict) -> Dict:
        """
        Calculate technical indicators for indices
        """
        technicals = {}
        
        for index, data in indices_data.items():
            if data:
                # Get current price and calculate basic metrics
                current = data.get("price", 0)
                change = data.get("change", 0)
                change_pct = data.get("changePercent", 0)
                
                technicals[index] = {
                    "symbol": index,
                    "current_price": current,
                    "change": change,
                    "change_percent": change_pct,
                    "volume": data.get("volume", 0),
                    "pe_ratio": data.get("fundamentals", {}).get("pe", 0),
                    "dividend_yield": data.get("fundamentals", {}).get("dividendYield", 0)
                }
        
        return technicals
    
    def _parse_market_analysis(self, response: str) -> Dict:
        """
        Parse Qwen response for market analysis
        """
        try:
            # Extract key components from response
            analysis = {
                "analysis": response,
                "confidence": 85,  # Will be extracted from response
                "recommendations": [],
                "risks": [],
                "timestamp": datetime.now().isoformat()
            }
            
            # Simple parsing logic - can be enhanced
            lines = response.split('\n')
            for line in lines:
                if 'confidence' in line.lower():
                    # Extract confidence score
                    import re
                    match = re.search(r'\d+', line)
                    if match:
                        analysis["confidence"] = int(match.group())
                elif 'risk' in line.lower():
                    analysis["risks"].append(line.strip())
                elif 'recommend' in line.lower() or 'action' in line.lower():
                    analysis["recommendations"].append(line.strip())
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error parsing analysis: {e}")
            return {
                "analysis": response,
                "confidence": 50,
                "timestamp": datetime.now().isoformat()
            }
    
    def _parse_indices_analysis(self, response: str) -> Dict:
        """Parse indices analysis response"""
        return {
            "summary": response,
            "insights": self._extract_insights(response),
            "confidence": 80,
            "timestamp": datetime.now().isoformat()
        }
    
    def _extract_insights(self, text: str) -> List[str]:
        """Extract bullet points or key insights from text"""
        insights = []
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Clean up the line
                line = line.lstrip('0123456789.-•').strip()
                if line:
                    insights.append(line)
        return insights[:5]  # Limit to 5 insights
    
    def _get_fallback_analysis(self) -> Dict:
        """
        Provide fallback analysis when Qwen is unavailable
        """
        return {
            "analysis": "Market analysis is being processed. Please check back shortly.",
            "confidence": 0,
            "recommendations": ["Analysis system is calibrating"],
            "risks": ["Real-time analysis temporarily unavailable"],
            "timestamp": datetime.now().isoformat()
        }

# Singleton instance
analyzer = QwenMarketAnalyzer()

# Sync wrapper for Express integration
def analyze_market_sync(market_data: Dict) -> Dict:
    """Synchronous wrapper for market analysis"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(analyzer.analyze_market_environment(market_data))
    loop.close()
    return result

def analyze_indices_sync(indices_data: Dict) -> Dict:
    """Synchronous wrapper for indices analysis"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(analyzer.analyze_indices(indices_data))
    loop.close()
    return result

if __name__ == "__main__":
    # Test the analyzer
    test_data = {
        "phase": "STRONG_BULL",
        "vix": 15.11,
        "breadth": {"advancing": 350, "declining": 150},
        "sentiment": {"fearGreedIndex": 50}
    }
    
    result = analyze_market_sync(test_data)
    print(json.dumps(result, indent=2))
