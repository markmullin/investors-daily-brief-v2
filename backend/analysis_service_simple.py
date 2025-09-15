"""
Simplified Python Analysis Service - Minimal dependencies version
This version works without yfinance or complex libraries
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:5173'])

class SimpleAnalyzer:
    """Simplified analyzer that generates realistic but synthetic data"""
    
    def calculate_market_phase(self, data):
        """Generate market phase analysis"""
        # Generate pseudo-random but realistic values
        score = random.randint(35, 75)
        
        if score >= 70:
            phase = "STRONG BULL"
            trend = "Strong Uptrend"
        elif score >= 55:
            phase = "BULL"
            trend = "Uptrend"
        elif score >= 45:
            phase = "NEUTRAL"
            trend = "Sideways"
        elif score >= 30:
            phase = "BEAR"
            trend = "Downtrend"
        else:
            phase = "STRONG BEAR"
            trend = "Strong Downtrend"
        
        return {
            'phase': phase,
            'phaseScore': score,
            'trend': trend,
            'breadth': random.randint(40, 70),
            'vix': round(random.uniform(15, 25), 2),
            'sp500Change': round(random.uniform(-2, 2), 2),
            'nasdaqChange': round(random.uniform(-2.5, 2.5), 2),
            'priceVs50MA': round(random.uniform(-5, 5), 2),
            'priceVs200MA': round(random.uniform(-8, 8), 2),
            'weekReturn': round(random.uniform(-3, 3), 2)
        }
    
    def analyze_index(self, symbol, name):
        """Generate index analysis"""
        return {
            'indexName': name,
            'symbol': symbol,
            'price': round(random.uniform(4000, 5000), 2),
            'changePercent': round(random.uniform(-2, 2), 2),
            'volumeVsAvg': round(random.uniform(80, 120), 1),
            'rsi': round(random.uniform(30, 70), 1),
            'peRatio': round(random.uniform(18, 25), 2),
            'weekPosition': round(random.uniform(30, 70), 1),
            'week52High': round(random.uniform(5000, 5200), 2),
            'week52Low': round(random.uniform(3800, 4200), 2)
        }
    
    def analyze_sectors(self):
        """Generate sector analysis"""
        sectors = ['Technology', 'Healthcare', 'Financials', 'Energy', 
                  'Consumer Discretionary', 'Industrials', 'Materials']
        
        performances = {s: round(random.uniform(-3, 4), 2) for s in sectors}
        sorted_sectors = sorted(performances.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'topSectors': [s[0] for s in sorted_sectors[:3]],
            'bottomSectors': [s[0] for s in sorted_sectors[-3:]],
            'leader': sorted_sectors[0][0],
            'leaderGain': sorted_sectors[0][1],
            'laggard': sorted_sectors[-1][0],
            'laggardLoss': sorted_sectors[-1][1],
            'rotationSignal': 'Risk-On' if sorted_sectors[0][0] == 'Technology' else 'Mixed Rotation',
            'allPerformances': performances
        }
    
    def analyze_correlation(self, asset1, asset2, name):
        """Generate correlation analysis"""
        return {
            'pair': name,
            'asset1': asset1,
            'asset2': asset2,
            'correlation': round(random.uniform(-0.5, 0.8), 3),
            'asset1Performance': round(random.uniform(-5, 5), 2),
            'asset2Performance': round(random.uniform(-5, 5), 2),
            'historicalCorr': 0.3,
            'divergence': round(random.uniform(0, 0.5), 3)
        }
    
    def analyze_macro(self):
        """Generate macro analysis"""
        return {
            'tenYear': round(random.uniform(3.8, 4.5), 2),
            'tenYearChange': random.randint(-10, 10),
            'twoYear': round(random.uniform(3.5, 4.2), 2),
            'yieldCurve': 'Normal' if random.random() > 0.3 else 'Inverted',
            'fedFunds': 4.5,
            'nextFomc': 'March 18-19, 2025'
        }

# Initialize analyzer
analyzer = SimpleAnalyzer()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'Simplified Python Analysis', 'version': '1.0'})

@app.route('/analyze', methods=['POST'])
def analyze():
    """Main analysis endpoint"""
    try:
        data = request.json
        analysis_type = data.get('type', 'marketPhase')
        raw_data = data.get('data', {})
        
        print(f"📊 Analyzing: {analysis_type}")
        
        if analysis_type == 'marketPhase':
            result = analyzer.calculate_market_phase(raw_data)
        elif analysis_type == 'marketIndices':
            symbol = raw_data.get('symbol', '^GSPC')
            name = raw_data.get('name', 'S&P 500')
            result = analyzer.analyze_index(symbol, name)
        elif analysis_type == 'sectorRotation':
            result = analyzer.analyze_sectors()
        elif analysis_type == 'correlations':
            asset1 = raw_data.get('asset1', 'SPY')
            asset2 = raw_data.get('asset2', 'TLT')
            name = raw_data.get('name', 'Stocks vs Bonds')
            result = analyzer.analyze_correlation(asset1, asset2, name)
        elif analysis_type == 'macroeconomic':
            result = analyzer.analyze_macro()
        else:
            result = analyzer.calculate_market_phase(raw_data)
        
        print(f"✅ Analysis complete: {analysis_type}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🔬 SIMPLIFIED Python Analysis Engine")
    print("=" * 60)
    print("✅ No complex dependencies required!")
    print("📊 Starting on port 8000...")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8000, debug=True)