"""
Market Intelligence Analysis with Qwen 3 8B
Processes market data and generates AI-powered insights
"""

import numpy as np
import pandas as pd
from scipy import stats
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import json
import sys
from datetime import datetime, timedelta

class MarketIntelligenceAnalyzer:
    def __init__(self):
        """Initialize Qwen 3 8B model"""
        print("Loading Qwen 3 8B model...")
        # Path to your downloaded Qwen 3 8B model
        model_path = "Qwen/Qwen3-8B-Instruct"  # Adjust path if needed
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
        print("Model loaded successfully")
    
    def analyze_market_data(self, market_data):
        """
        Perform numerical analysis on market data
        Returns statistical insights and patterns
        """
        analysis = {}
        
        # Extract key metrics
        sp500_pe = market_data.get('fundamentals', {}).get('marketPE', 27.7)
        vix = market_data.get('sentiment', {}).get('vix', 15.11)
        breadth = market_data.get('breadth', {}).get('participation', 50)
        trend = market_data.get('trend', {}).get('direction', 'NEUTRAL')
        
        # Calculate market regime
        if vix < 12:
            volatility_regime = "extremely_low"
            risk_level = 0.2
        elif vix < 20:
            volatility_regime = "low"
            risk_level = 0.4
        elif vix < 30:
            volatility_regime = "moderate"
            risk_level = 0.6
        else:
            volatility_regime = "high"
            risk_level = 0.8
        
        # PE valuation analysis
        historical_pe_median = 18.5  # Historical S&P 500 median
        pe_percentile = stats.norm.cdf((sp500_pe - historical_pe_median) / 5) * 100
        
        if sp500_pe < 15:
            valuation = "deeply_undervalued"
        elif sp500_pe < 18:
            valuation = "undervalued"
        elif sp500_pe < 22:
            valuation = "fair_value"
        elif sp500_pe < 26:
            valuation = "overvalued"
        else:
            valuation = "extremely_overvalued"
        
        # Breadth analysis
        if breadth > 70:
            breadth_signal = "very_strong"
            participation_score = 0.9
        elif breadth > 55:
            breadth_signal = "positive"
            participation_score = 0.6
        elif breadth > 45:
            breadth_signal = "neutral"
            participation_score = 0.5
        else:
            breadth_signal = "weak"
            participation_score = 0.3
        
        # Composite market score (0-100)
        market_score = (
            (100 - pe_percentile) * 0.3 +  # Lower PE is better
            (100 - vix * 2) * 0.3 +         # Lower VIX is better
            (breadth) * 0.4                 # Higher breadth is better
        )
        
        # Determine market outlook
        if market_score > 70:
            outlook = "bullish"
        elif market_score > 50:
            outlook = "cautiously_optimistic"
        elif market_score > 30:
            outlook = "neutral"
        else:
            outlook = "bearish"
        
        # Historical context
        earnings_growth = market_data.get('fundamentals', {}).get('earningsGrowth', -0.22)
        if earnings_growth < -10:
            earnings_trend = "contracting_rapidly"
        elif earnings_growth < 0:
            earnings_trend = "slightly_negative"
        elif earnings_growth < 5:
            earnings_trend = "modest_growth"
        else:
            earnings_trend = "strong_growth"
        
        analysis = {
            'market_score': round(market_score, 1),
            'outlook': outlook,
            'valuation': valuation,
            'pe_percentile': round(pe_percentile, 1),
            'volatility_regime': volatility_regime,
            'risk_level': risk_level,
            'breadth_signal': breadth_signal,
            'participation_score': participation_score,
            'earnings_trend': earnings_trend,
            'trend_direction': trend
        }
        
        return analysis
    
    def generate_ai_insights(self, market_data, numerical_analysis):
        """
        Use Qwen 3 8B to generate intelligent market insights
        """
        # Prepare context for Qwen
        context = f"""
        You are a senior market analyst providing insights to investors. Analyze the following market conditions:
        
        Market Metrics:
        - S&P 500 P/E Ratio: {market_data['fundamentals']['marketPE']} (Historical median: 18.5)
        - P/E Percentile: {numerical_analysis['pe_percentile']}th percentile
        - Valuation Status: {numerical_analysis['valuation'].replace('_', ' ')}
        - Earnings Growth: {market_data['fundamentals']['earningsGrowth']}%
        - Companies with Positive Earnings: {market_data['fundamentals']['percentWithPositiveGrowth']}%
        
        Market Sentiment:
        - VIX: {market_data['sentiment']['vix']} ({numerical_analysis['volatility_regime'].replace('_', ' ')} volatility)
        - Risk Level: {numerical_analysis['risk_level']*100:.0f}%
        
        Market Breadth:
        - Sector Participation: {market_data['breadth']['participation']}%
        - Breadth Signal: {numerical_analysis['breadth_signal'].replace('_', ' ')}
        - Trend Direction: {market_data['trend']['direction']}
        
        Overall Assessment:
        - Market Score: {numerical_analysis['market_score']}/100
        - Outlook: {numerical_analysis['outlook'].replace('_', ' ')}
        
        Provide a concise, actionable analysis covering:
        1. Current market conditions (2-3 sentences)
        2. Key opportunities and risks (bullet points)
        3. Recommended positioning (specific and actionable)
        
        Keep the language accessible to retail investors. Be specific with numbers and avoid generic advice.
        """
        
        # Generate response with Qwen
        inputs = self.tokenizer(context, return_tensors="pt").to(self.model.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=400,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the generated part (after the context)
        generated_text = response[len(context):].strip()
        
        # Parse the response into structured format
        lines = generated_text.split('\n')
        
        # Extract sections
        current_conditions = []
        opportunities = []
        risks = []
        positioning = []
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if 'current market' in line.lower() or 'conditions' in line.lower():
                current_section = 'conditions'
            elif 'opportunit' in line.lower():
                current_section = 'opportunities'
            elif 'risk' in line.lower():
                current_section = 'risks'
            elif 'position' in line.lower() or 'recommend' in line.lower():
                current_section = 'positioning'
            elif current_section == 'conditions':
                current_conditions.append(line)
            elif current_section == 'opportunities' and line.startswith(('•', '-', '*')):
                opportunities.append(line.lstrip('•-* '))
            elif current_section == 'risks' and line.startswith(('•', '-', '*')):
                risks.append(line.lstrip('•-* '))
            elif current_section == 'positioning':
                positioning.append(line)
        
        # Create final synthesis
        synthesis = {
            'analysis': ' '.join(current_conditions[:3]) if current_conditions else 
                       f"Market showing {numerical_analysis['outlook'].replace('_', ' ')} conditions with S&P 500 at {market_data['fundamentals']['marketPE']}x earnings. "
                       f"VIX at {market_data['sentiment']['vix']} indicates {numerical_analysis['volatility_regime'].replace('_', ' ')} volatility environment. "
                       f"Sector participation at {market_data['breadth']['participation']}% suggests {numerical_analysis['breadth_signal'].replace('_', ' ')} market breadth.",
            
            'opportunities': opportunities[:3] if opportunities else [
                f"P/E in {numerical_analysis['pe_percentile']}th percentile offers entry points in quality names",
                f"Low VIX environment favorable for covered call strategies",
                f"{market_data['breadth']['participation']}% participation indicates selective opportunities"
            ],
            
            'risks': risks[:3] if risks else [
                f"Elevated valuations leave little room for disappointment" if numerical_analysis['pe_percentile'] > 70 else "Earnings contraction not yet reflected in prices",
                f"VIX at historical lows may spike on any negative catalyst" if market_data['sentiment']['vix'] < 15 else "Rising volatility could trigger selling",
                f"Narrow breadth suggests vulnerability to sector rotation" if market_data['breadth']['participation'] < 60 else "Extended positioning vulnerable to profit-taking"
            ],
            
            'recommendations': positioning[:2] if positioning else [
                f"Maintain {'defensive' if numerical_analysis['market_score'] < 40 else 'balanced' if numerical_analysis['market_score'] < 60 else 'growth-oriented'} portfolio allocation",
                f"Focus on {'value sectors with strong dividends' if numerical_analysis['pe_percentile'] > 75 else 'quality growth at reasonable valuations'}"
            ],
            
            'confidence': min(95, 50 + numerical_analysis['participation_score'] * 50),
            'timestamp': datetime.now().isoformat()
        }
        
        return synthesis

def main():
    """Main entry point for the analysis"""
    # Get market data from stdin (passed from Node.js)
    market_data_json = sys.stdin.read()
    market_data = json.loads(market_data_json)
    
    # Initialize analyzer
    analyzer = MarketIntelligenceAnalyzer()
    
    # Perform numerical analysis
    numerical_analysis = analyzer.analyze_market_data(market_data)
    
    # Generate AI insights
    ai_synthesis = analyzer.generate_ai_insights(market_data, numerical_analysis)
    
    # Combine results
    result = {
        'numerical_analysis': numerical_analysis,
        'ai_synthesis': ai_synthesis,
        'success': True
    }
    
    # Output as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
