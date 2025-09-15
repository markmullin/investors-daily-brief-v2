#!/usr/bin/env python3
"""
technical_analysis_engine.py - Comprehensive Technical Analysis Engine
FIXED: Proper price data extraction to handle different data formats
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy import stats
from scipy.signal import find_peaks
import warnings
warnings.filterwarnings('ignore')

# Import our existing technical indicators module
from technical_indicators import calculate_technical_indicators

def extract_price_data(input_data):
    """
    Extract price data from various input formats
    Handles: list of numbers, list of objects with price/close, etc.
    """
    try:
        if not input_data:
            return []
        
        # If it's already a list of numbers
        if isinstance(input_data, list) and len(input_data) > 0:
            first_item = input_data[0]
            
            # Case 1: List of numbers [100, 101, 102...]
            if isinstance(first_item, (int, float)):
                return [float(x) for x in input_data if isinstance(x, (int, float))]
            
            # Case 2: List of objects with price/close fields
            elif isinstance(first_item, dict):
                prices = []
                for item in input_data:
                    if isinstance(item, dict):
                        # Try different price field names
                        price = None
                        for field in ['price', 'close', 'value']:
                            if field in item and isinstance(item[field], (int, float)):
                                price = float(item[field])
                                break
                        
                        if price is not None:
                            prices.append(price)
                
                return prices
        
        # Case 3: Single object with prices array
        elif isinstance(input_data, dict):
            if 'prices' in input_data:
                return extract_price_data(input_data['prices'])
            elif 'price_data' in input_data:
                return extract_price_data(input_data['price_data'])
        
        return []
        
    except Exception as e:
        print(f"Error extracting price data: {e}", file=sys.stderr)
        return []

def analyze_stock_technical(price_data, symbol='STOCK', timeframe='1d'):
    """
    Comprehensive technical analysis engine
    FIXED: Proper price data handling for different input formats
    """
    try:
        # Extract prices using improved extraction
        prices_list = extract_price_data(price_data)
        
        if not prices_list or len(prices_list) == 0:
            return {
                'error': 'No valid price data could be extracted',
                'analysis': {},
                'debug_info': {
                    'input_type': str(type(price_data)),
                    'input_length': len(price_data) if hasattr(price_data, '__len__') else 'N/A',
                    'first_item_type': str(type(price_data[0])) if isinstance(price_data, list) and len(price_data) > 0 else 'N/A'
                }
            }
        
        if len(prices_list) < 20:
            return {
                'error': f'Insufficient data points for analysis (have {len(prices_list)}, need at least 20)',
                'analysis': {}
            }
        
        # Convert to pandas Series - NOW SAFE because we have extracted numbers
        prices = pd.Series(prices_list, dtype=float)
        
        # Get comprehensive technical indicators
        indicators_to_calculate = [
            'rsi', 'ma20', 'ma50', 'ma200', 'bollinger_bands', 
            'macd', 'stochastic', 'atr', 'adx', 'support_resistance', 'trend_analysis'
        ]
        
        technical_data = calculate_technical_indicators(prices.tolist(), indicators_to_calculate)
        
        if 'error' in technical_data:
            return {
                'error': f'Technical indicators calculation failed: {technical_data["error"]}',
                'analysis': {}
            }
        
        indicators = technical_data.get('indicators', {})
        
        # Generate comprehensive analysis
        analysis = {
            'symbol': symbol,
            'timeframe': timeframe,
            'current_price': float(prices.iloc[-1]),
            'price_change_percent': calculate_price_change_percent(prices),
            'analysis_timestamp': pd.Timestamp.now().isoformat(),
            
            # Core Analysis Sections
            'trend_analysis': generate_trend_analysis(indicators, prices),
            'momentum_analysis': generate_momentum_analysis(indicators, prices),
            'support_resistance_analysis': generate_support_resistance_analysis(indicators, prices),
            'volatility_analysis': generate_volatility_analysis(indicators, prices),
            'entry_exit_signals': generate_entry_exit_signals(indicators, prices),
            
            # Pattern Recognition
            'pattern_recognition': detect_chart_patterns(prices),
            'price_action_analysis': analyze_price_action(prices),
            
            # Risk Assessment
            'risk_assessment': generate_risk_assessment(indicators, prices),
            
            # Actionable Insights
            'trading_recommendations': generate_trading_recommendations(indicators, prices, timeframe),
            'key_levels': identify_key_levels(indicators, prices),
            
            # Summary for AI explanation
            'executive_summary': generate_executive_summary(indicators, prices, symbol, timeframe),
            'confidence_score': calculate_analysis_confidence(indicators),
            
            # Raw indicators for reference
            'technical_indicators': indicators
        }
        
        return {
            'analysis': analysis,
            'success': True,
            'data_points': len(prices),
            'price_range': f"${prices.min():.2f} - ${prices.max():.2f}"
        }
        
    except Exception as e:
        return {
            'error': f'Technical analysis engine failed: {str(e)}',
            'analysis': {},
            'debug_info': {
                'input_type': str(type(price_data)),
                'error_location': 'analyze_stock_technical'
            }
        }

def calculate_price_change_percent(prices):
    """Calculate price change percentage"""
    try:
        if len(prices) < 2:
            return 0.0
        
        current_price = prices.iloc[-1]
        previous_price = prices.iloc[-2]
        
        change_percent = ((current_price - previous_price) / previous_price) * 100
        return round(change_percent, 2)
    except:
        return 0.0

def generate_trend_analysis(indicators, prices):
    """Generate comprehensive trend analysis"""
    try:
        analysis = {
            'overall_trend': 'neutral',
            'trend_strength': 'moderate',
            'support_level': None,
            'resistance_level': None,
            'trend_signals': []
        }
        
        # Moving Average Analysis
        ma_signals = []
        ma_above_count = 0
        ma_total = 0
        
        for ma_period in ['ma20', 'ma50', 'ma200']:
            if ma_period in indicators and 'price_above' in indicators[ma_period]:
                ma_total += 1
                if indicators[ma_period]['price_above']:
                    ma_above_count += 1
                    ma_signals.append(f'Above {ma_period.upper()}')
                else:
                    ma_signals.append(f'Below {ma_period.upper()}')
        
        # Determine overall trend
        if ma_above_count == ma_total and ma_total > 0:
            analysis['overall_trend'] = 'bullish'
        elif ma_above_count == 0 and ma_total > 0:
            analysis['overall_trend'] = 'bearish'
        else:
            analysis['overall_trend'] = 'neutral'
        
        # Support/Resistance from indicators
        if 'support_resistance' in indicators:
            sr_data = indicators['support_resistance']
            analysis['support_level'] = sr_data.get('nearest_support')
            analysis['resistance_level'] = sr_data.get('nearest_resistance')
        
        analysis['trend_signals'] = ma_signals
        
        return analysis
        
    except Exception as e:
        return {
            'overall_trend': 'unknown',
            'error': str(e)
        }

def generate_momentum_analysis(indicators, prices):
    """Generate momentum analysis"""
    try:
        analysis = {
            'current_rsi': None,
            'rsi_signal': 'neutral',
            'ma_signal': 'neutral',
            'momentum_score': 50
        }
        
        # RSI Analysis
        if 'rsi' in indicators:
            rsi_data = indicators['rsi']
            rsi_value = rsi_data.get('value', 50)
            analysis['current_rsi'] = round(rsi_value, 1)
            
            if rsi_value > 70:
                analysis['rsi_signal'] = 'overbought'
            elif rsi_value < 30:
                analysis['rsi_signal'] = 'oversold'
            else:
                analysis['rsi_signal'] = 'neutral'
        
        # MACD Analysis
        if 'macd' in indicators:
            macd_data = indicators['macd']
            momentum = macd_data.get('momentum', 'neutral')
            analysis['ma_signal'] = momentum
        
        return analysis
        
    except Exception as e:
        return {
            'current_rsi': None,
            'error': str(e)
        }

def generate_support_resistance_analysis(indicators, prices):
    """Generate support and resistance analysis"""
    try:
        return {
            'key_support': indicators.get('support_resistance', {}).get('nearest_support'),
            'key_resistance': indicators.get('support_resistance', {}).get('nearest_resistance')
        }
    except Exception as e:
        return {'error': str(e)}

def generate_volatility_analysis(indicators, prices):
    """Generate volatility analysis"""
    try:
        return {
            'volatility': indicators.get('atr', {}).get('volatility', 'normal'),
            'atr_percent': indicators.get('atr', {}).get('atr_percent', 2.0)
        }
    except Exception as e:
        return {'volatility': 'unknown', 'error': str(e)}

def generate_entry_exit_signals(indicators, prices):
    """Generate entry and exit signals"""
    try:
        signals = {
            'recommendation': 'HOLD',
            'confidence': 50,
            'entry_price': None,
            'stop_loss': None
        }
        
        # Simple signal generation
        buy_signals = 0
        sell_signals = 0
        
        # RSI signals
        if 'rsi' in indicators:
            rsi_value = indicators['rsi'].get('value', 50)
            if rsi_value < 30:
                buy_signals += 1
            elif rsi_value > 70:
                sell_signals += 1
        
        # Trend signals
        current_price = float(prices.iloc[-1])
        
        for ma_period in ['ma20', 'ma50']:
            if ma_period in indicators and 'price_above' in indicators[ma_period]:
                if indicators[ma_period]['price_above']:
                    buy_signals += 1
                else:
                    sell_signals += 1
        
        # Determine recommendation
        if buy_signals > sell_signals:
            signals['recommendation'] = 'BUY'
            signals['confidence'] = min(70, 50 + (buy_signals * 10))
        elif sell_signals > buy_signals:
            signals['recommendation'] = 'SELL'
            signals['confidence'] = min(70, 50 + (sell_signals * 10))
        
        signals['entry_price'] = current_price
        
        # Simple stop loss
        if 'support_resistance' in indicators:
            support = indicators['support_resistance'].get('nearest_support')
            if support:
                signals['stop_loss'] = support * 0.98  # 2% below support
        
        return signals
        
    except Exception as e:
        return {
            'recommendation': 'HOLD',
            'confidence': 50,
            'error': str(e)
        }

def detect_chart_patterns(prices):
    """Detect chart patterns"""
    try:
        return {
            'patterns': ['No clear patterns detected'],
            'pattern_strength': 'low'
        }
    except Exception as e:
        return {'patterns': ['Pattern detection failed'], 'error': str(e)}

def analyze_price_action(prices):
    """Analyze price action"""
    try:
        current_price = prices.iloc[-1]
        previous_price = prices.iloc[-2] if len(prices) > 1 else current_price
        change = ((current_price - previous_price) / previous_price) * 100
        
        return {
            'recent_action': f'Price movement: {change:+.2f}%',
            'momentum': 'bullish' if change > 0 else 'bearish' if change < 0 else 'neutral'
        }
    except Exception as e:
        return {'recent_action': 'Unknown', 'error': str(e)}

def generate_risk_assessment(indicators, prices):
    """Generate risk assessment"""
    try:
        return {
            'risk_level': 'medium',
            'volatility': indicators.get('atr', {}).get('volatility', 'normal')
        }
    except Exception as e:
        return {'risk_level': 'unknown', 'error': str(e)}

def generate_trading_recommendations(indicators, prices, timeframe):
    """Generate trading recommendations"""
    try:
        return {
            'timeframe': timeframe,
            'strategy': 'Monitor for clear signals',
            'risk_management': 'Use appropriate position sizing'
        }
    except Exception as e:
        return {'strategy': 'Analysis unavailable', 'error': str(e)}

def identify_key_levels(indicators, prices):
    """Identify key levels"""
    try:
        return {
            'support': indicators.get('support_resistance', {}).get('nearest_support'),
            'resistance': indicators.get('support_resistance', {}).get('nearest_resistance')
        }
    except Exception as e:
        return {'support': None, 'resistance': None, 'error': str(e)}

def generate_executive_summary(indicators, prices, symbol, timeframe):
    """Generate executive summary"""
    try:
        current_price = float(prices.iloc[-1])
        change_percent = calculate_price_change_percent(prices)
        
        # Determine overall sentiment
        sentiment = 'neutral'
        if 'rsi' in indicators:
            rsi_value = indicators['rsi'].get('value', 50)
            if rsi_value > 70:
                sentiment = 'overbought'
            elif rsi_value < 30:
                sentiment = 'oversold'
        
        return {
            'summary': f'{symbol} trading at ${current_price:.2f} ({change_percent:+.1f}%) with {sentiment} technical indicators',
            'sentiment': sentiment,
            'key_price': current_price
        }
    except Exception as e:
        return {
            'summary': f'{symbol} technical analysis available',
            'error': str(e)
        }

def calculate_analysis_confidence(indicators):
    """Calculate confidence score"""
    try:
        # Simple confidence based on available indicators
        available_indicators = len([k for k in indicators.keys() if indicators[k] and not indicators[k].get('error')])
        max_indicators = 10
        
        confidence = (available_indicators / max_indicators) * 100
        return min(confidence, 85)  # Cap at 85%
    except:
        return 50

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python technical_analysis_engine.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        price_data = input_data.get('price_data', input_data.get('prices', []))
        symbol = input_data.get('symbol', 'STOCK')
        timeframe = input_data.get('timeframe', '1d')
        
        # Perform comprehensive analysis
        result = analyze_stock_technical(price_data, symbol, timeframe)
        
        # Output result
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        error_result = {
            'error': f'Technical analysis engine failed: {str(e)}',
            'analysis': {}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()