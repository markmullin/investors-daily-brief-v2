"""
Python Analysis Service - Handles ALL numerical calculations
Returns conclusions, not raw numbers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

FMP_KEY = '4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1'

class MarketAnalyzer:
    def analyze_market_phase(self):
        """Analyze market phase and return CONCLUSIONS, not numbers"""
        try:
            # Fetch real data
            response = requests.get(f'https://financialmodelingprep.com/api/v3/quote/SPY,^VIX?apikey={FMP_KEY}')
            data = response.json()
            
            spy = next((d for d in data if d['symbol'] == 'SPY'), {})
            vix = next((d for d in data if d['symbol'] == '^VIX'), {})
            
            spy_change = float(spy.get('changesPercentage', 0))
            vix_level = float(vix.get('price', 20))
            
            # Determine phase based on actual data
            if vix_level < 15 and spy_change > 0:
                phase = "bullish"
                sentiment = "optimistic"
                action = "consider growth positions"
            elif vix_level > 25:
                phase = "bearish"
                sentiment = "fearful"
                action = "defensive positioning advised"
            else:
                phase = "neutral"
                sentiment = "mixed"
                action = "maintain balanced approach"
            
            return {
                'conclusions': {
                    'phase': phase,
                    'sentiment': sentiment,
                    'action': action,
                    'volatility': 'low' if vix_level < 15 else 'high' if vix_level > 25 else 'moderate',
                    'trend': 'upward' if spy_change > 0.5 else 'downward' if spy_change < -0.5 else 'sideways'
                }
            }
        except Exception as e:
            return {
                'conclusions': {
                    'phase': 'neutral',
                    'sentiment': 'uncertain',
                    'action': 'await clarity',
                    'volatility': 'moderate',
                    'trend': 'sideways'
                },
                'error': str(e)
            }
    
    def analyze_sectors(self):
        """Analyze sectors using ETF quotes (same as frontend) and return CONCLUSIONS"""
        try:
            # Use same ETF symbols as frontend for consistency
            sector_etfs = {
                'XLE': 'Energy',
                'XLV': 'Healthcare', 
                'XLK': 'Technology',
                'XLF': 'Financial',
                'XLI': 'Industrial',
                'XLY': 'Consumer Discretionary',
                'XLP': 'Consumer Staples',
                'XLU': 'Utilities',
                'XLB': 'Materials',
                'XLRE': 'Real Estate',
                'XLC': 'Communication Services'
            }
            
            # Fetch real-time ETF quotes (same method as frontend)
            symbols = ','.join(sector_etfs.keys())
            response = requests.get(f'https://financialmodelingprep.com/api/v3/quote/{symbols}?apikey={FMP_KEY}')
            etf_data = response.json()
            
            # Calculate performance for each sector
            sector_performance = []
            for etf in etf_data:
                symbol = etf['symbol']
                if symbol in sector_etfs:
                    sector_name = sector_etfs[symbol]
                    change_percent = float(etf.get('changesPercentage', 0))
                    sector_performance.append({
                        'sector': sector_name,
                        'etf': symbol,
                        'performance': change_percent
                    })
            
            # Sort by performance
            sector_performance.sort(key=lambda x: x['performance'], reverse=True)
            
            leader_data = sector_performance[0]
            laggard_data = sector_performance[-1]
            
            leader = leader_data['sector']
            laggard = laggard_data['sector']
            
            # Determine rotation type based on leader
            tech_leading = leader == 'Technology'
            energy_leading = leader == 'Energy'
            utilities_lagging = laggard == 'Utilities'
            
            if tech_leading:
                rotation_type = "growth-oriented"
                market_view = "risk-on"
            elif energy_leading:
                rotation_type = "inflation-conscious"
                market_view = "commodity-focused"
            else:
                rotation_type = "sector-specific"
                market_view = "selective"
            
            return {
                'conclusions': {
                    'leadingSector': leader,
                    'laggingSector': laggard,
                    'rotationType': rotation_type,
                    'marketView': market_view,
                    'recommendation': f"favor {leader.lower()} exposure"
                }
            }
        except Exception as e:
            return {
                'conclusions': {
                    'leadingSector': 'Technology',
                    'laggingSector': 'Utilities',
                    'rotationType': 'unclear',
                    'marketView': 'mixed',
                    'recommendation': 'maintain diversification'
                },
                'error': str(e)
            }
    
    def analyze_correlations(self, pair):
        """Analyze correlations and return CONCLUSIONS"""
        try:
            # Map pair to assets
            pairs = {
                'spy-vs-tlt': ('SPY', 'TLT', 'stocks', 'bonds'),
                'spy-vs-eem-vs-efa': ('SPY', 'EEM', 'US stocks', 'emerging markets'),
                'ive-vs-ivw': ('IVE', 'IVW', 'value', 'growth')
            }
            
            symbols, _, name1, name2 = pairs.get(pair, ('SPY', 'TLT', 'stocks', 'bonds'))
            
            response = requests.get(f'https://financialmodelingprep.com/api/v3/quote/{symbols[0]},{symbols[1]}?apikey={FMP_KEY}')
            data = response.json()
            
            asset1_data = next((d for d in data if d['symbol'] == symbols[0]), {})
            asset2_data = next((d for d in data if d['symbol'] == symbols[1]), {})
            
            change1 = float(asset1_data.get('changesPercentage', 0))
            change2 = float(asset2_data.get('changesPercentage', 0))
            
            # Determine relationship
            if change1 * change2 > 0:  # Same direction
                if abs(change1 - change2) < 0.5:
                    relationship = "strongly correlated"
                    diversification = "low"
                else:
                    relationship = "positively correlated"
                    diversification = "moderate"
            else:  # Opposite directions
                relationship = "inversely correlated"
                diversification = "high"
            
            return {
                'conclusions': {
                    'asset1': name1,
                    'asset2': name2,
                    'relationship': relationship,
                    'diversification': diversification,
                    'recommendation': f"{'increase' if diversification == 'low' else 'maintain'} diversification"
                }
            }
        except Exception as e:
            return {
                'conclusions': {
                    'asset1': 'stocks',
                    'asset2': 'bonds',
                    'relationship': 'typical',
                    'diversification': 'moderate',
                    'recommendation': 'maintain balance'
                },
                'error': str(e)
            }

analyzer = MarketAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze():
    """Main analysis endpoint - returns conclusions, not raw numbers"""
    data = request.json
    analysis_type = data.get('type', 'marketPhase')
    
    if analysis_type == 'marketPhase':
        result = analyzer.analyze_market_phase()
    elif analysis_type == 'sectors':
        result = analyzer.analyze_sectors()
    elif analysis_type == 'correlations':
        pair = data.get('data', {}).get('pair', 'spy-vs-tlt')
        result = analyzer.analyze_correlations(pair)
    else:
        result = analyzer.analyze_market_phase()
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'Python Analysis (Conclusions Only)'})

if __name__ == '__main__':
    print("Starting Python Analysis Service...")
    print("This service returns CONCLUSIONS, not raw numbers")
    print("AI will interpret these conclusions without handling numbers")
    app.run(host='0.0.0.0', port=8000, debug=False)
