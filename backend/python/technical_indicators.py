#!/usr/bin/env python3
"""
technical_indicators.py - Advanced Technical Indicators Calculation
Provides comprehensive technical analysis indicators using scientific Python libraries
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

def extract_price_values(price_data):
    """
    Extract price values from various input formats
    Handles: list of numbers, list of objects with price/close, etc.
    """
    try:
        if not price_data:
            return []
        
        # If it's already a list of numbers
        if isinstance(price_data, list) and len(price_data) > 0:
            first_item = price_data[0]
            
            # Case 1: List of numbers [100, 101, 102...]
            if isinstance(first_item, (int, float)):
                return [float(x) for x in price_data if isinstance(x, (int, float))]
            
            # Case 2: List of objects with price/close fields
            elif isinstance(first_item, dict):
                prices = []
                for item in price_data:
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
        elif isinstance(price_data, dict):
            if 'prices' in price_data:
                return extract_price_values(price_data['prices'])
            elif 'price_data' in price_data:
                return extract_price_values(price_data['price_data'])
        
        return []
        
    except Exception as e:
        print(f"Error extracting price values: {e}", file=sys.stderr)
        return []

def calculate_technical_indicators(price_data, indicators_requested):
    """
    Calculate comprehensive technical indicators for price data
    Returns detailed technical analysis with requested indicators
    FIXED: Proper data extraction before pandas conversion
    """
    try:
        if not price_data or len(price_data) == 0:
            return {
                'error': 'No price data provided',
                'indicators': {}
            }
        
        # Extract prices using improved extraction
        price_values = extract_price_values(price_data)
        
        if not price_values or len(price_values) == 0:
            return {
                'error': 'No valid price values could be extracted',
                'indicators': {},
                'debug_info': {
                    'input_type': str(type(price_data)),
                    'input_length': len(price_data) if hasattr(price_data, '__len__') else 'N/A',
                    'first_item_type': str(type(price_data[0])) if isinstance(price_data, list) and len(price_data) > 0 else 'N/A'
                }
            }
        
        if len(price_values) < 10:
            return {
                'error': f'Insufficient price data (have {len(price_values)}, need at least 10)',
                'indicators': {}
            }
        
        # Convert extracted price values to pandas Series - NOW SAFE
        prices = pd.Series(price_values, dtype=float)
        
        indicators = {}
        
        # Calculate requested indicators
        for indicator in indicators_requested:
            if indicator == 'rsi':
                indicators['rsi'] = calculate_rsi(prices)
            elif indicator == 'ma200':
                indicators['ma200'] = calculate_moving_average(prices, 200)
            elif indicator == 'ma50':
                indicators['ma50'] = calculate_moving_average(prices, 50)
            elif indicator == 'ma20':
                indicators['ma20'] = calculate_moving_average(prices, 20)
            elif indicator == 'bollinger_bands':
                indicators['bollinger_bands'] = calculate_bollinger_bands(prices)
            elif indicator == 'macd':
                indicators['macd'] = calculate_macd(prices)
            elif indicator == 'stochastic':
                indicators['stochastic'] = calculate_stochastic(prices)
            elif indicator == 'atr':
                indicators['atr'] = calculate_atr(prices)
            elif indicator == 'adx':
                indicators['adx'] = calculate_adx(prices)
            elif indicator == 'volume_profile':
                indicators['volume_profile'] = calculate_volume_profile(prices)
            elif indicator == 'support_resistance':
                indicators['support_resistance'] = calculate_support_resistance_levels(prices)
            elif indicator == 'trend_analysis':
                indicators['trend_analysis'] = calculate_trend_analysis(prices)
        
        # Add summary analysis
        indicators['summary'] = generate_technical_summary(indicators, prices)
        
        return {
            'indicators': indicators,
            'price_current': float(prices.iloc[-1]),
            'price_count': len(prices),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': f'Technical indicators calculation failed: {str(e)}',
            'indicators': {},
            'debug_info': {
                'input_type': str(type(price_data)),
                'error_location': 'calculate_technical_indicators'
            }
        }

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index"""
    try:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        current_rsi = rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50
        
        # Determine RSI condition
        if current_rsi > 70:
            condition = 'overbought'
        elif current_rsi < 30:
            condition = 'oversold'
        else:
            condition = 'neutral'
        
        return {
            'value': round(float(current_rsi), 2),
            'condition': condition,
            'period': period,
            'interpretation': get_rsi_interpretation(current_rsi)
        }
        
    except Exception as e:
        return {
            'error': f'RSI calculation failed: {str(e)}',
            'value': 50,
            'condition': 'unknown'
        }

def calculate_moving_average(prices, period):
    """Calculate moving average with trend analysis"""
    try:
        if len(prices) < period:
            period = len(prices) // 2 if len(prices) > 2 else len(prices)
        
        ma = prices.rolling(window=period).mean()
        current_ma = ma.iloc[-1] if not pd.isna(ma.iloc[-1]) else prices.mean()
        current_price = prices.iloc[-1]
        
        # Calculate trend slope
        if len(ma) >= 10:
            recent_ma = ma.tail(10)
            x = np.arange(len(recent_ma))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, recent_ma)
            trend_direction = 'rising' if slope > 0 else 'falling'
            trend_strength = abs(r_value)
        else:
            slope = 0
            trend_direction = 'neutral'
            trend_strength = 0
        
        # Position relative to MA
        distance_percent = ((current_price - current_ma) / current_ma) * 100
        
        return {
            'value': round(float(current_ma), 4),
            'period': period,
            'price_above': current_price > current_ma,
            'distance_percent': round(distance_percent, 2),
            'trend_direction': trend_direction,
            'trend_strength': round(trend_strength, 3),
            'slope': round(slope, 6)
        }
        
    except Exception as e:
        return {
            'error': f'Moving average calculation failed: {str(e)}',
            'value': float(prices.mean()),
            'period': period
        }

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    try:
        sma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        current_price = prices.iloc[-1]
        current_upper = upper_band.iloc[-1]
        current_lower = lower_band.iloc[-1]
        current_middle = sma.iloc[-1]
        
        # Band width (volatility measure)
        band_width = ((current_upper - current_lower) / current_middle) * 100
        
        # Position within bands
        if current_price > current_upper:
            position = 'above_upper'
        elif current_price < current_lower:
            position = 'below_lower'
        else:
            band_position = ((current_price - current_lower) / (current_upper - current_lower)) * 100
            position = f'{round(band_position, 1)}%_of_range'
        
        return {
            'upper_band': round(float(current_upper), 4),
            'lower_band': round(float(current_lower), 4),
            'middle_band': round(float(current_middle), 4),
            'band_width': round(band_width, 2),
            'position': position,
            'period': period,
            'std_dev': std_dev,
            'interpretation': get_bollinger_interpretation(position, band_width)
        }
        
    except Exception as e:
        return {
            'error': f'Bollinger Bands calculation failed: {str(e)}',
            'upper_band': 0,
            'lower_band': 0,
            'middle_band': 0
        }

def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """Calculate MACD (Moving Average Convergence Divergence)"""
    try:
        ema_fast = prices.ewm(span=fast_period).mean()
        ema_slow = prices.ewm(span=slow_period).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period).mean()
        histogram = macd_line - signal_line
        
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        current_histogram = histogram.iloc[-1]
        
        # MACD signals
        bullish_crossover = current_macd > current_signal and len(macd_line) > 1 and macd_line.iloc[-2] <= signal_line.iloc[-2]
        bearish_crossover = current_macd < current_signal and len(macd_line) > 1 and macd_line.iloc[-2] >= signal_line.iloc[-2]
        
        # Momentum direction
        momentum = 'bullish' if current_macd > current_signal else 'bearish'
        
        return {
            'macd_line': round(float(current_macd), 6),
            'signal_line': round(float(current_signal), 6),
            'histogram': round(float(current_histogram), 6),
            'momentum': momentum,
            'bullish_crossover': bullish_crossover,
            'bearish_crossover': bearish_crossover,
            'interpretation': get_macd_interpretation(momentum, current_histogram, bullish_crossover, bearish_crossover)
        }
        
    except Exception as e:
        return {
            'error': f'MACD calculation failed: {str(e)}',
            'macd_line': 0,
            'signal_line': 0,
            'histogram': 0
        }

def calculate_stochastic(prices, k_period=14, d_period=3):
    """Calculate Stochastic Oscillator"""
    try:
        # For simplicity, assume prices are close prices
        # In real implementation, you'd need high, low, close
        high = prices.rolling(window=k_period).max()
        low = prices.rolling(window=k_period).min()
        
        k_percent = ((prices - low) / (high - low)) * 100
        d_percent = k_percent.rolling(window=d_period).mean()
        
        current_k = k_percent.iloc[-1] if not pd.isna(k_percent.iloc[-1]) else 50
        current_d = d_percent.iloc[-1] if not pd.isna(d_percent.iloc[-1]) else 50
        
        # Stochastic conditions
        if current_k > 80 and current_d > 80:
            condition = 'overbought'
        elif current_k < 20 and current_d < 20:
            condition = 'oversold'
        else:
            condition = 'neutral'
        
        return {
            'k_percent': round(float(current_k), 2),
            'd_percent': round(float(current_d), 2),
            'condition': condition,
            'k_period': k_period,
            'd_period': d_period,
            'interpretation': get_stochastic_interpretation(current_k, current_d, condition)
        }
        
    except Exception as e:
        return {
            'error': f'Stochastic calculation failed: {str(e)}',
            'k_percent': 50,
            'd_percent': 50,
            'condition': 'unknown'
        }

def calculate_atr(prices, period=14):
    """Calculate Average True Range (volatility measure)"""
    try:
        # Simplified ATR using only close prices
        # Real ATR would use high, low, close
        tr = prices.diff().abs()  # Simplified true range
        atr = tr.rolling(window=period).mean()
        
        current_atr = atr.iloc[-1] if not pd.isna(atr.iloc[-1]) else 0
        current_price = prices.iloc[-1]
        
        # ATR as percentage of price
        atr_percent = (current_atr / current_price) * 100 if current_price != 0 else 0
        
        # Volatility assessment
        if atr_percent > 3:
            volatility = 'high'
        elif atr_percent < 1:
            volatility = 'low'
        else:
            volatility = 'normal'
        
        return {
            'atr_value': round(float(current_atr), 4),
            'atr_percent': round(atr_percent, 2),
            'volatility': volatility,
            'period': period,
            'interpretation': get_atr_interpretation(volatility, atr_percent)
        }
        
    except Exception as e:
        return {
            'error': f'ATR calculation failed: {str(e)}',
            'atr_value': 0,
            'atr_percent': 0,
            'volatility': 'unknown'
        }

def calculate_adx(prices, period=14):
    """Calculate Average Directional Index (trend strength)"""
    try:
        # Simplified ADX calculation using only close prices
        # Real ADX would use high, low, close
        
        price_changes = prices.diff()
        positive_changes = price_changes.where(price_changes > 0, 0)
        negative_changes = (-price_changes).where(price_changes < 0, 0)
        
        positive_directional = positive_changes.rolling(window=period).mean()
        negative_directional = negative_changes.rolling(window=period).mean()
        
        # Simplified ADX calculation
        directional_index = abs(positive_directional - negative_directional) / (positive_directional + negative_directional) * 100
        adx = directional_index.rolling(window=period).mean()
        
        current_adx = adx.iloc[-1] if not pd.isna(adx.iloc[-1]) else 25
        
        # Trend strength assessment
        if current_adx > 50:
            trend_strength = 'very_strong'
        elif current_adx > 30:
            trend_strength = 'strong'
        elif current_adx > 20:
            trend_strength = 'moderate'
        else:
            trend_strength = 'weak'
        
        return {
            'adx_value': round(float(current_adx), 2),
            'trend_strength': trend_strength,
            'period': period,
            'interpretation': get_adx_interpretation(trend_strength, current_adx)
        }
        
    except Exception as e:
        return {
            'error': f'ADX calculation failed: {str(e)}',
            'adx_value': 25,
            'trend_strength': 'unknown'
        }

def calculate_volume_profile(prices):
    """Calculate simplified volume profile analysis"""
    try:
        # Since we don't have volume data, use price frequency
        price_min = prices.min()
        price_max = prices.max()
        price_range = price_max - price_min
        
        # Create price bins
        num_bins = min(20, len(prices) // 5)
        bins = np.linspace(price_min, price_max, num_bins)
        
        # Count frequency in each bin
        hist, bin_edges = np.histogram(prices, bins=bins)
        
        # Find value area (highest frequency zones)
        max_freq_idx = np.argmax(hist)
        value_area_high = bin_edges[max_freq_idx + 1]
        value_area_low = bin_edges[max_freq_idx]
        
        current_price = prices.iloc[-1]
        
        # Position relative to value area
        if current_price > value_area_high:
            position = 'above_value_area'
        elif current_price < value_area_low:
            position = 'below_value_area'
        else:
            position = 'within_value_area'
        
        return {
            'value_area_high': round(float(value_area_high), 4),
            'value_area_low': round(float(value_area_low), 4),
            'current_position': position,
            'price_distribution': 'analyzed',
            'interpretation': get_volume_profile_interpretation(position)
        }
        
    except Exception as e:
        return {
            'error': f'Volume profile calculation failed: {str(e)}',
            'value_area_high': 0,
            'value_area_low': 0,
            'current_position': 'unknown'
        }

def calculate_support_resistance_levels(prices):
    """Calculate support and resistance levels using peak detection"""
    try:
        # Find peaks and troughs
        peaks, _ = find_peaks(prices.values, distance=len(prices)//10)
        troughs, _ = find_peaks(-prices.values, distance=len(prices)//10)
        
        resistance_levels = prices.iloc[peaks].tolist() if len(peaks) > 0 else []
        support_levels = prices.iloc[troughs].tolist() if len(troughs) > 0 else []
        
        # Current price analysis
        current_price = prices.iloc[-1]
        
        # Find nearest support and resistance
        resistance_above = [r for r in resistance_levels if r > current_price]
        support_below = [s for s in support_levels if s < current_price]
        
        nearest_resistance = min(resistance_above) if resistance_above else None
        nearest_support = max(support_below) if support_below else None
        
        return {
            'resistance_levels': [round(r, 4) for r in resistance_levels[-5:]],  # Last 5
            'support_levels': [round(s, 4) for s in support_levels[-5:]],       # Last 5
            'nearest_resistance': round(nearest_resistance, 4) if nearest_resistance else None,
            'nearest_support': round(nearest_support, 4) if nearest_support else None,
            'current_price': round(float(current_price), 4),
            'interpretation': get_support_resistance_interpretation(nearest_support, nearest_resistance, current_price)
        }
        
    except Exception as e:
        return {
            'error': f'Support/Resistance calculation failed: {str(e)}',
            'resistance_levels': [],
            'support_levels': [],
            'nearest_resistance': None,
            'nearest_support': None
        }

def calculate_trend_analysis(prices):
    """Calculate comprehensive trend analysis"""
    try:
        # Short, medium, long term trends
        short_trend = analyze_trend_period(prices, 10)
        medium_trend = analyze_trend_period(prices, 25)
        long_trend = analyze_trend_period(prices, 50)
        
        # Overall trend consensus
        trends = [short_trend['direction'], medium_trend['direction'], long_trend['direction']]
        trend_consensus = max(set(trends), key=trends.count)
        
        # Trend strength
        trend_scores = [short_trend['strength'], medium_trend['strength'], long_trend['strength']]
        avg_strength = sum(trend_scores) / len(trend_scores)
        
        return {
            'short_term': short_trend,
            'medium_term': medium_trend,
            'long_term': long_trend,
            'consensus_direction': trend_consensus,
            'average_strength': round(avg_strength, 3),
            'interpretation': get_trend_interpretation(trend_consensus, avg_strength)
        }
        
    except Exception as e:
        return {
            'error': f'Trend analysis failed: {str(e)}',
            'consensus_direction': 'unknown',
            'average_strength': 0
        }

def analyze_trend_period(prices, period):
    """Analyze trend for a specific period"""
    try:
        if len(prices) < period:
            period = len(prices)
        
        recent_prices = prices.tail(period)
        x = np.arange(len(recent_prices))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, recent_prices)
        
        # Determine direction
        if slope > 0:
            direction = 'bullish'
        elif slope < 0:
            direction = 'bearish'
        else:
            direction = 'sideways'
        
        # Strength from R-squared
        strength = abs(r_value)
        
        return {
            'direction': direction,
            'strength': strength,
            'slope': slope,
            'period': period
        }
        
    except Exception as e:
        return {
            'direction': 'unknown',
            'strength': 0,
            'slope': 0,
            'period': period
        }

def generate_technical_summary(indicators, prices):
    """Generate overall technical analysis summary"""
    try:
        signals = []
        bullish_count = 0
        bearish_count = 0
        neutral_count = 0
        
        # RSI analysis
        if 'rsi' in indicators and 'value' in indicators['rsi']:
            rsi_value = indicators['rsi']['value']
            if rsi_value > 70:
                signals.append('RSI overbought')
                bearish_count += 1
            elif rsi_value < 30:
                signals.append('RSI oversold')
                bullish_count += 1
            else:
                neutral_count += 1
        
        # MACD analysis
        if 'macd' in indicators and 'momentum' in indicators['macd']:
            if indicators['macd']['momentum'] == 'bullish':
                signals.append('MACD bullish')
                bullish_count += 1
            else:
                signals.append('MACD bearish')
                bearish_count += 1
        
        # Moving average analysis
        ma_signals = []
        for ma_period in ['ma20', 'ma50', 'ma200']:
            if ma_period in indicators and 'price_above' in indicators[ma_period]:
                if indicators[ma_period]['price_above']:
                    ma_signals.append(f'Above {ma_period.upper()}')
                    bullish_count += 1
                else:
                    ma_signals.append(f'Below {ma_period.upper()}')
                    bearish_count += 1
        
        if ma_signals:
            signals.extend(ma_signals)
        
        # Trend analysis
        if 'trend_analysis' in indicators and 'consensus_direction' in indicators['trend_analysis']:
            trend_direction = indicators['trend_analysis']['consensus_direction']
            if trend_direction == 'bullish':
                signals.append('Bullish trend consensus')
                bullish_count += 1
            elif trend_direction == 'bearish':
                signals.append('Bearish trend consensus')
                bearish_count += 1
            else:
                neutral_count += 1
        
        # Overall assessment
        total_signals = bullish_count + bearish_count + neutral_count
        if total_signals > 0:
            bullish_percent = (bullish_count / total_signals) * 100
            bearish_percent = (bearish_count / total_signals) * 100
            
            if bullish_percent > 60:
                overall_sentiment = 'bullish'
            elif bearish_percent > 60:
                overall_sentiment = 'bearish'
            else:
                overall_sentiment = 'neutral'
        else:
            overall_sentiment = 'unknown'
            bullish_percent = 33
            bearish_percent = 33
        
        return {
            'overall_sentiment': overall_sentiment,
            'bullish_signals': bullish_count,
            'bearish_signals': bearish_count,
            'neutral_signals': neutral_count,
            'bullish_percent': round(bullish_percent, 1),
            'bearish_percent': round(bearish_percent, 1),
            'key_signals': signals,
            'signal_strength': 'strong' if abs(bullish_percent - bearish_percent) > 40 else 'moderate' if abs(bullish_percent - bearish_percent) > 20 else 'weak'
        }
        
    except Exception as e:
        return {
            'error': f'Technical summary failed: {str(e)}',
            'overall_sentiment': 'unknown',
            'signal_strength': 'unknown'
        }

# Interpretation helper functions
def get_rsi_interpretation(rsi):
    if rsi > 80:
        return 'Extremely overbought - potential reversal'
    elif rsi > 70:
        return 'Overbought - consider taking profits'
    elif rsi < 20:
        return 'Extremely oversold - potential bounce'
    elif rsi < 30:
        return 'Oversold - potential buying opportunity'
    elif 40 <= rsi <= 60:
        return 'Neutral momentum'
    else:
        return 'Trending momentum'

def get_bollinger_interpretation(position, band_width):
    if position == 'above_upper':
        return 'Price above upper band - potential overbought'
    elif position == 'below_lower':
        return 'Price below lower band - potential oversold'
    elif band_width < 10:
        return 'Low volatility - potential breakout ahead'
    elif band_width > 25:
        return 'High volatility - trend may be exhausting'
    else:
        return 'Normal volatility conditions'

def get_macd_interpretation(momentum, histogram, bullish_crossover, bearish_crossover):
    if bullish_crossover:
        return 'Bullish crossover - potential buy signal'
    elif bearish_crossover:
        return 'Bearish crossover - potential sell signal'
    elif momentum == 'bullish' and histogram > 0:
        return 'Strong bullish momentum'
    elif momentum == 'bearish' and histogram < 0:
        return 'Strong bearish momentum'
    else:
        return 'Momentum divergence - watch for change'

def get_stochastic_interpretation(k, d, condition):
    if condition == 'overbought' and k < d:
        return 'Overbought with bearish divergence'
    elif condition == 'oversold' and k > d:
        return 'Oversold with bullish divergence'
    elif condition == 'overbought':
        return 'Overbought - potential reversal'
    elif condition == 'oversold':
        return 'Oversold - potential bounce'
    else:
        return 'Neutral momentum'

def get_atr_interpretation(volatility, atr_percent):
    if volatility == 'high':
        return f'High volatility ({atr_percent}%) - increased risk/reward'
    elif volatility == 'low':
        return f'Low volatility ({atr_percent}%) - potential breakout building'
    else:
        return f'Normal volatility ({atr_percent}%) - typical trading range'

def get_adx_interpretation(trend_strength, adx_value):
    if trend_strength == 'very_strong':
        return f'Very strong trend ({adx_value}) - trend continuation likely'
    elif trend_strength == 'strong':
        return f'Strong trend ({adx_value}) - trend in force'
    elif trend_strength == 'moderate':
        return f'Moderate trend ({adx_value}) - trend developing'
    else:
        return f'Weak trend ({adx_value}) - ranging market'

def get_volume_profile_interpretation(position):
    if position == 'above_value_area':
        return 'Price above value area - potential resistance'
    elif position == 'below_value_area':
        return 'Price below value area - potential support'
    else:
        return 'Price within value area - normal trading'

def get_support_resistance_interpretation(support, resistance, current_price):
    if support and resistance:
        support_distance = ((current_price - support) / support) * 100
        resistance_distance = ((resistance - current_price) / current_price) * 100
        return f'Between support (${support:.2f}, -{support_distance:.1f}%) and resistance (${resistance:.2f}, +{resistance_distance:.1f}%)'
    elif support:
        support_distance = ((current_price - support) / support) * 100
        return f'Above support at ${support:.2f} (-{support_distance:.1f}%)'
    elif resistance:
        resistance_distance = ((resistance - current_price) / current_price) * 100
        return f'Below resistance at ${resistance:.2f} (+{resistance_distance:.1f}%)'
    else:
        return 'No clear support/resistance levels identified'

def get_trend_interpretation(consensus, strength):
    strength_desc = 'strong' if strength > 0.7 else 'moderate' if strength > 0.4 else 'weak'
    return f'{consensus.title()} {strength_desc} trend consensus (R² = {strength:.3f})'

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python technical_indicators.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        prices = input_data.get('prices', input_data.get('price_data', []))
        indicators_requested = input_data.get('indicators', ['rsi', 'ma200', 'bollinger_bands', 'macd'])
        
        # Perform analysis
        result = calculate_technical_indicators(prices, indicators_requested)
        
        # Output result
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        error_result = {
            'error': f'Technical indicators analysis failed: {str(e)}',
            'indicators': {}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()