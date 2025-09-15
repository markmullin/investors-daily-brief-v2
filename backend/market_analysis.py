"""
Market Analysis Engine for Investors Daily Brief
Python-based analysis that feeds GPT-OSS-20B for intelligent insights
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests
from typing import Dict, List, Any
import asyncio
import aiohttp
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

class MarketAnalyzer:
    """
    Core analysis engine that processes market data and prepares it for GPT-OSS interpretation
    """
    
    def __init__(self):
        self.fmp_key = os.getenv('FMP_API_KEY', '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1')
        self.fred_key = os.getenv('FRED_API_KEY', 'dca5bb7524d0b194a9963b449e69c655')
        self.base_fmp = "https://financialmodelingprep.com/api/v3"
        self.base_fred = "https://api.stlouisfed.org/fred/series/observations"
        
    async def fetch_fmp_data(self, endpoint: str) -> Dict:
        """Fetch data from FMP API"""
        url = f"{self.base_fmp}/{endpoint}?apikey={self.fmp_key}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                return await response.json()
    
    async def fetch_fred_data(self, series_id: str, days: int = 365) -> pd.DataFrame:
        """Fetch data from FRED API"""
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        url = f"{self.base_fred}?series_id={series_id}&api_key={self.fred_key}&file_type=json&observation_start={start_date}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
                if 'observations' in data:
                    df = pd.DataFrame(data['observations'])
                    df['value'] = pd.to_numeric(df['value'], errors='coerce')
                    df['date'] = pd.to_datetime(df['date'])
                    return df
                return pd.DataFrame()

    def calculate_market_phase(self, indices_data: Dict, vix: float, breadth_data: Dict) -> Dict:
        """
        Determine market phase using multiple indicators
        Returns: phase name and supporting metrics
        """
        # Calculate key metrics
        sp500_20d_ma = indices_data.get('sp500_ma20', 0)
        sp500_50d_ma = indices_data.get('sp500_ma50', 0)
        sp500_200d_ma = indices_data.get('sp500_ma200', 0)
        current_price = indices_data.get('sp500_price', 0)
        
        # Breadth indicators (% of stocks above moving averages)
        stocks_above_50ma = breadth_data.get('above_50ma_pct', 50)
        stocks_above_200ma = breadth_data.get('above_200ma_pct', 50)
        
        # Trend strength
        trend_score = 0
        if current_price > sp500_20d_ma: trend_score += 1
        if current_price > sp500_50d_ma: trend_score += 1
        if current_price > sp500_200d_ma: trend_score += 2
        if sp500_50d_ma > sp500_200d_ma: trend_score += 2
        
        # Determine phase
        phase = "NEUTRAL"
        confidence = 0.5
        
        if vix < 15 and stocks_above_50ma > 70 and trend_score >= 5:
            phase = "STRONG BULL"
            confidence = 0.9
        elif vix < 20 and stocks_above_50ma > 55 and trend_score >= 4:
            phase = "BULL"
            confidence = 0.75
        elif vix > 35 and stocks_above_50ma < 30 and trend_score <= 1:
            phase = "STRONG BEAR"
            confidence = 0.9
        elif vix > 25 and stocks_above_50ma < 45 and trend_score <= 2:
            phase = "BEAR"
            confidence = 0.75
        else:
            phase = "NEUTRAL"
            confidence = 0.6
            
        return {
            "phase": phase,
            "confidence": confidence,
            "metrics": {
                "vix": vix,
                "trend_score": trend_score / 6,  # Normalize to 0-1
                "breadth": stocks_above_50ma / 100,
                "stocks_above_50ma": stocks_above_50ma,
                "stocks_above_200ma": stocks_above_200ma,
                "price_vs_200ma": (current_price - sp500_200d_ma) / sp500_200d_ma * 100 if sp500_200d_ma > 0 else 0
            },
            "context_for_gpt": f"Market phase analysis shows {phase} conditions with {confidence:.0%} confidence. "
                              f"VIX at {vix:.1f}, {stocks_above_50ma:.0f}% of stocks above 50-day MA, "
                              f"trend strength {trend_score}/6."
        }
    
    async def analyze_indices_fundamentals(self) -> Dict:
        """
        Get fundamental data for major indices including Bitcoin
        """
        indices = {
            'sp500': {
                'symbol': '^GSPC',
                'name': 'S&P 500',
                'etf_proxy': 'SPY'  # Use ETF for fundamentals
            },
            'nasdaq': {
                'symbol': '^IXIC', 
                'name': 'NASDAQ Composite',
                'etf_proxy': 'QQQ'
            },
            'dow': {
                'symbol': '^DJI',
                'name': 'Dow Jones',
                'etf_proxy': 'DIA'
            },
            'russell': {
                'symbol': '^RUT',
                'name': 'Russell 2000',
                'etf_proxy': 'IWM'
            },
            'bitcoin': {
                'symbol': 'BTCUSD',
                'name': 'Bitcoin',
                'etf_proxy': None
            }
        }
        
        results = {}
        
        for key, index_info in indices.items():
            if index_info['etf_proxy']:
                # Get ETF data as proxy for index fundamentals
                etf_data = await self.fetch_fmp_data(f"quote/{index_info['etf_proxy']}")
                if etf_data and len(etf_data) > 0:
                    data = etf_data[0]
                    results[key] = {
                        'name': index_info['name'],
                        'price': data.get('price', 0),
                        'change': data.get('change', 0),
                        'changePercent': data.get('changesPercentage', 0),
                        'pe': data.get('pe', None),
                        'eps': data.get('eps', None),
                        'yearHigh': data.get('yearHigh', 0),
                        'yearLow': data.get('yearLow', 0),
                        'volume': data.get('volume', 0),
                        'avgVolume': data.get('avgVolume', 0),
                        'marketCap': data.get('marketCap', 0)
                    }
            elif key == 'bitcoin':
                # Special handling for Bitcoin
                btc_data = await self.fetch_fmp_data(f"quote/BTCUSD")
                if btc_data and len(btc_data) > 0:
                    data = btc_data[0]
                    results[key] = {
                        'name': 'Bitcoin',
                        'price': data.get('price', 0),
                        'change': data.get('change', 0),
                        'changePercent': data.get('changesPercentage', 0),
                        'yearHigh': data.get('yearHigh', 0),
                        'yearLow': data.get('yearLow', 0),
                        'volume': data.get('volume', 0),
                        'marketCap': data.get('marketCap', 0),
                        'volatility_30d': None  # Calculate if needed
                    }
        
        # Calculate aggregate P/E and earnings growth
        if 'sp500' in results and results['sp500']['pe']:
            sp500_pe = results['sp500']['pe']
            historical_avg_pe = 18  # Historical average
            
            results['analysis_context'] = {
                'sp500_pe_vs_historical': (sp500_pe - historical_avg_pe) / historical_avg_pe * 100,
                'valuation_signal': 'expensive' if sp500_pe > 22 else 'fair' if sp500_pe > 16 else 'cheap',
                'context_for_gpt': f"S&P 500 P/E ratio of {sp500_pe:.1f} is {abs(sp500_pe - historical_avg_pe):.1f} points "
                                  f"{'above' if sp500_pe > historical_avg_pe else 'below'} historical average of {historical_avg_pe}."
            }
        
        return results
    
    def analyze_sector_rotation(self, sector_data: List[Dict]) -> Dict:
        """
        Analyze sector performance and rotation patterns
        """
        sectors_df = pd.DataFrame(sector_data)
        
        # Calculate relative strength
        if 'changesPercentage' in sectors_df.columns:
            sectors_df['relative_strength'] = sectors_df['changesPercentage'] - sectors_df['changesPercentage'].mean()
            
            # Identify leading and lagging sectors
            leading = sectors_df.nlargest(3, 'relative_strength')[['sector', 'changesPercentage', 'relative_strength']]
            lagging = sectors_df.nsmallest(3, 'relative_strength')[['sector', 'changesPercentage', 'relative_strength']]
            
            # Detect rotation pattern
            tech_performance = sectors_df[sectors_df['sector'] == 'Technology']['changesPercentage'].values[0] if 'Technology' in sectors_df['sector'].values else 0
            financials_performance = sectors_df[sectors_df['sector'] == 'Financials']['changesPercentage'].values[0] if 'Financials' in sectors_df['sector'].values else 0
            energy_performance = sectors_df[sectors_df['sector'] == 'Energy']['changesPercentage'].values[0] if 'Energy' in sectors_df['sector'].values else 0
            
            # Determine market regime based on sector leadership
            if tech_performance > 2 and financials_performance < 0:
                rotation_pattern = "Growth-oriented (Tech leadership)"
            elif financials_performance > 2 and energy_performance > 1:
                rotation_pattern = "Value rotation (Financials/Energy strength)"
            elif all(sectors_df['changesPercentage'] > 0):
                rotation_pattern = "Broad-based rally"
            elif all(sectors_df['changesPercentage'] < 0):
                rotation_pattern = "Risk-off (Broad selling)"
            else:
                rotation_pattern = "Mixed/Transitional"
            
            return {
                'leading_sectors': leading.to_dict('records'),
                'lagging_sectors': lagging.to_dict('records'),
                'rotation_pattern': rotation_pattern,
                'dispersion': sectors_df['changesPercentage'].std(),
                'context_for_gpt': f"Sector rotation shows {rotation_pattern}. "
                                  f"Leading: {', '.join(leading['sector'].values)}. "
                                  f"Lagging: {', '.join(lagging['sector'].values)}. "
                                  f"Dispersion: {sectors_df['changesPercentage'].std():.2f}%"
            }
        
        return {'error': 'Insufficient sector data'}
    
    def calculate_correlations(self, price_series: Dict[str, List]) -> Dict:
        """
        Calculate rolling correlations between key asset pairs
        """
        correlations = {}
        
        # Define key relationships to analyze
        pairs = [
            ('SPY', 'TLT', 'Stocks vs Bonds'),
            ('QQQ', 'IWM', 'Growth vs Value'),
            ('VIX', 'SPY', 'Fear vs Stocks'),
            ('GLD', 'DXY', 'Gold vs Dollar'),
            ('XLF', 'TNX', 'Banks vs Rates')
        ]
        
        for asset1, asset2, description in pairs:
            if asset1 in price_series and asset2 in price_series:
                series1 = pd.Series(price_series[asset1])
                series2 = pd.Series(price_series[asset2])
                
                # Calculate correlations
                corr_30d = series1.tail(30).corr(series2.tail(30))
                corr_90d = series1.tail(90).corr(series2.tail(90))
                
                # Detect divergence
                recent_corr = series1.tail(10).corr(series2.tail(10))
                historical_corr = series1.tail(250).corr(series2.tail(250)) if len(series1) > 250 else corr_90d
                
                divergence = abs(recent_corr - historical_corr) > 0.3
                
                correlations[f"{asset1}_vs_{asset2}"] = {
                    'description': description,
                    'correlation_30d': round(corr_30d, 3),
                    'correlation_90d': round(corr_90d, 3),
                    'recent_change': round(recent_corr - historical_corr, 3),
                    'divergence_alert': divergence,
                    'interpretation': self._interpret_correlation(description, corr_30d, divergence)
                }
        
        return correlations
    
    def _interpret_correlation(self, pair: str, correlation: float, divergence: bool) -> str:
        """Helper to interpret correlation meaning"""
        if 'Stocks vs Bonds' in pair:
            if correlation > 0.5:
                return "Risk-on: Both moving together"
            elif correlation < -0.5:
                return "Normal: Flight to safety working"
            else:
                return "Transitional: Unclear risk sentiment"
        elif 'Growth vs Value' in pair:
            if correlation < 0.3:
                return "Rotation: Strong style preference"
            else:
                return "Synchronized: Broad market move"
        elif 'Fear vs Stocks' in pair:
            if correlation < -0.7:
                return "Normal: Fear inverse to stocks"
            else:
                return "Warning: Correlation breakdown"
        
        return "Monitoring relationship"
    
    async def analyze_macroeconomic(self) -> Dict:
        """
        Comprehensive macro analysis with FRED data
        """
        # Define indicators to fetch
        indicators = {
            'DFF': 'Federal Funds Rate',
            'DGS10': '10-Year Treasury',
            'DGS2': '2-Year Treasury',
            'CPIAUCSL': 'CPI',
            'UNRATE': 'Unemployment Rate',
            'GDPC1': 'Real GDP',
            'RPI': 'Real Personal Income',  # Added per request
            'MMMFFAQ027S': 'Money Market Funds'  # Added per request
        }
        
        macro_data = {}
        
        # Fetch all indicators
        for series_id, name in indicators.items():
            try:
                df = await self.fetch_fred_data(series_id)
                if not df.empty:
                    latest = df.iloc[-1]['value']
                    prev_year = df[df['date'] <= df.iloc[-1]['date'] - timedelta(days=365)].iloc[-1]['value'] if len(df) > 365 else latest
                    
                    macro_data[series_id] = {
                        'name': name,
                        'current': latest,
                        'year_ago': prev_year,
                        'yoy_change': ((latest - prev_year) / prev_year * 100) if prev_year != 0 else 0
                    }
            except Exception as e:
                print(f"Error fetching {series_id}: {e}")
        
        # Calculate yield curve
        if 'DGS10' in macro_data and 'DGS2' in macro_data:
            yield_spread = macro_data['DGS10']['current'] - macro_data['DGS2']['current']
            macro_data['yield_curve'] = {
                'spread': yield_spread,
                'inverted': yield_spread < 0,
                'interpretation': 'Inverted - Recession risk' if yield_spread < 0 else 'Normal - Growth expected'
            }
        
        # Economic regime determination
        regime = self._determine_economic_regime(macro_data)
        
        macro_data['regime'] = regime
        macro_data['context_for_gpt'] = self._create_macro_context(macro_data)
        
        return macro_data
    
    def _determine_economic_regime(self, data: Dict) -> str:
        """Determine economic regime from macro data"""
        # Simplified regime detection
        if 'CPIAUCSL' in data and 'GDPC1' in data:
            inflation = data['CPIAUCSL']['yoy_change']
            growth = data['GDPC1']['yoy_change']
            
            if inflation > 3 and growth > 2:
                return "Overheating"
            elif inflation > 3 and growth < 2:
                return "Stagflation risk"
            elif inflation < 2 and growth > 2:
                return "Goldilocks"
            elif inflation < 2 and growth < 2:
                return "Slowdown"
            else:
                return "Transitional"
        
        return "Undetermined"
    
    def _create_macro_context(self, data: Dict) -> str:
        """Create context string for GPT-OSS"""
        context_parts = []
        
        if 'yield_curve' in data:
            context_parts.append(f"Yield curve {'inverted' if data['yield_curve']['inverted'] else 'normal'} at {data['yield_curve']['spread']:.2f}%")
        
        if 'CPIAUCSL' in data:
            context_parts.append(f"Inflation at {data['CPIAUCSL']['current']:.1f}% YoY")
        
        if 'UNRATE' in data:
            context_parts.append(f"Unemployment at {data['UNRATE']['current']:.1f}%")
        
        if 'regime' in data:
            context_parts.append(f"Economic regime: {data['regime']}")
        
        return ". ".join(context_parts)
    
    async def generate_complete_analysis(self) -> Dict:
        """
        Orchestrate all analysis components and prepare for GPT-OSS
        """
        print("Starting comprehensive market analysis...")
        
        # Fetch market data
        indices_data = await self.analyze_indices_fundamentals()
        
        # Mock data for demonstration (replace with actual API calls)
        vix = 16.5
        breadth_data = {'above_50ma_pct': 65, 'above_200ma_pct': 58}
        
        # Generate all analyses
        market_phase = self.calculate_market_phase(
            {'sp500_price': indices_data.get('sp500', {}).get('price', 5000),
             'sp500_ma20': 4950, 'sp500_ma50': 4900, 'sp500_ma200': 4800},
            vix,
            breadth_data
        )
        
        # Sector analysis (mock data - replace with actual)
        sector_data = [
            {'sector': 'Technology', 'changesPercentage': 2.1},
            {'sector': 'Financials', 'changesPercentage': 0.8},
            {'sector': 'Energy', 'changesPercentage': -0.5},
            {'sector': 'Healthcare', 'changesPercentage': 1.2},
            {'sector': 'Consumer', 'changesPercentage': 0.3}
        ]
        sector_analysis = self.analyze_sector_rotation(sector_data)
        
        # Macro analysis
        macro_analysis = await self.analyze_macroeconomic()
        
        # Compile complete analysis
        complete_analysis = {
            'timestamp': datetime.now().isoformat(),
            'market_phase': market_phase,
            'indices': indices_data,
            'sectors': sector_analysis,
            'macroeconomic': macro_analysis,
            'gpt_context': {
                'market_overview': f"{market_phase['context_for_gpt']} {sector_analysis.get('context_for_gpt', '')}",
                'macro_overview': macro_analysis.get('context_for_gpt', ''),
                'key_insights': [
                    market_phase['phase'],
                    sector_analysis.get('rotation_pattern', ''),
                    macro_analysis.get('regime', '')
                ]
            }
        }
        
        print("Analysis complete. Ready for GPT-OSS interpretation.")
        return complete_analysis

# FastAPI endpoint wrapper
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Market Analysis Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "http://localhost:5174", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = MarketAnalyzer()

@app.get("/analyze")
async def get_market_analysis():
    """
    Get complete market analysis ready for GPT-OSS
    """
    try:
        analysis = await analyzer.generate_complete_analysis()
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/phase")
async def get_market_phase():
    """Get current market phase analysis"""
    # Simplified endpoint for just phase
    indices = await analyzer.analyze_indices_fundamentals()
    phase = analyzer.calculate_market_phase(
        {'sp500_price': indices.get('sp500', {}).get('price', 5000),
         'sp500_ma20': 4950, 'sp500_ma50': 4900, 'sp500_ma200': 4800},
        16.5,  # Mock VIX
        {'above_50ma_pct': 65, 'above_200ma_pct': 58}
    )
    return phase

@app.get("/analyze/sectors")
async def get_sector_analysis():
    """Get sector rotation analysis"""
    # Mock data - replace with actual
    sector_data = [
        {'sector': 'Technology', 'changesPercentage': 2.1},
        {'sector': 'Financials', 'changesPercentage': 0.8},
        {'sector': 'Energy', 'changesPercentage': -0.5}
    ]
    return analyzer.analyze_sector_rotation(sector_data)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Market Analysis Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)