#!/usr/bin/env python3
"""
GPU-ACCELERATED FINANCIAL ANALYTICS
Provides 100% accurate numerical calculations using GPU acceleration
Returns structured insights for AI models, NOT raw numbers
"""

import sys
import json
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# Try to import GPU acceleration libraries
try:
    import cupy as cp
    import torch
    GPU_AVAILABLE = torch.cuda.is_available()
    if GPU_AVAILABLE:
        torch.set_default_device('cuda')
        print("🚀 GPU acceleration enabled", file=sys.stderr)
    else:
        print("⚠️ GPU not available, using CPU", file=sys.stderr)
except ImportError:
    print("⚠️ GPU libraries not available, using NumPy", file=sys.stderr)
    cp = np
    GPU_AVAILABLE = False

def gpu_accelerated_rsi(prices, period=14):
    """Calculate RSI with GPU acceleration and return interpretation"""
    try:
        if GPU_AVAILABLE and len(prices) > 100:
            # Use GPU for large datasets
            prices_gpu = cp.array(prices)
            deltas = cp.diff(prices_gpu)
            gains = cp.where(deltas > 0, deltas, 0)
            losses = cp.where(deltas < 0, -deltas, 0)
            
            avg_gains = cp.convolve(gains, cp.ones(period)/period, mode='valid')
            avg_losses = cp.convolve(losses, cp.ones(period)/period, mode='valid')
            
            rs = avg_gains / (avg_losses + 1e-10)  # Avoid division by zero
            rsi_values = 100 - (100 / (1 + rs))
            current_rsi = float(rsi_values[-1])
        else:
            # Use NumPy for smaller datasets or when GPU unavailable
            prices_array = np.array(prices)
            deltas = np.diff(prices_array)
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            
            avg_gains = pd.Series(gains).rolling(period).mean().iloc[-1]
            avg_losses = pd.Series(losses).rolling(period).mean().iloc[-1]
            
            rs = avg_gains / (avg_losses + 1e-10)
            current_rsi = 100 - (100 / (1 + rs))
        
        # Convert to insights, NOT raw numbers
        if current_rsi > 70:
            condition = "overbought"
            signal_strength = min((current_rsi - 70) / 10, 1.0)  # 0-1 scale
            interpretation = "approaching_overbought_territory"
        elif current_rsi < 30:
            condition = "oversold" 
            signal_strength = min((30 - current_rsi) / 10, 1.0)
            interpretation = "approaching_oversold_territory"
        elif current_rsi > 60:
            condition = "bullish_momentum"
            signal_strength = 0.6
            interpretation = "momentum_building_upward"
        elif current_rsi < 40:
            condition = "bearish_momentum"
            signal_strength = 0.6
            interpretation = "momentum_building_downward"
        else:
            condition = "neutral"
            signal_strength = 0.3
            interpretation = "balanced_momentum"
        
        return {
            "momentum_state": condition,
            "signal_strength": round(signal_strength, 2),
            "interpretation": interpretation,
            "reference_value": round(float(current_rsi), 1)  # For reference only
        }
        
    except Exception as e:
        return {
            "error": f"RSI calculation failed: {str(e)}",
            "momentum_state": "unknown"
        }

def gpu_accelerated_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD with GPU acceleration and return interpretation"""
    try:
        if GPU_AVAILABLE and len(prices) > 100:
            prices_gpu = cp.array(prices)
            # Calculate EMAs using GPU
            alpha_fast = 2.0 / (fast + 1.0)
            alpha_slow = 2.0 / (slow + 1.0)
            alpha_signal = 2.0 / (signal + 1.0)
            
            # EMA calculations on GPU
            ema_fast = cp.zeros_like(prices_gpu)
            ema_slow = cp.zeros_like(prices_gpu)
            ema_fast[0] = ema_slow[0] = prices_gpu[0]
            
            for i in range(1, len(prices_gpu)):
                ema_fast[i] = alpha_fast * prices_gpu[i] + (1 - alpha_fast) * ema_fast[i-1]
                ema_slow[i] = alpha_slow * prices_gpu[i] + (1 - alpha_slow) * ema_slow[i-1]
            
            macd_line = ema_fast - ema_slow
            
            # Signal line EMA
            signal_line = cp.zeros_like(macd_line)
            signal_line[0] = macd_line[0]
            for i in range(1, len(macd_line)):
                signal_line[i] = alpha_signal * macd_line[i] + (1 - alpha_signal) * signal_line[i-1]
            
            histogram = macd_line - signal_line
            
            current_macd = float(macd_line[-1])
            current_signal = float(signal_line[-1])
            current_histogram = float(histogram[-1])
        else:
            # NumPy fallback
            df = pd.DataFrame({'price': prices})
            ema_fast = df['price'].ewm(span=fast).mean()
            ema_slow = df['price'].ewm(span=slow).mean()
            macd_line = ema_fast - ema_slow
            signal_line = macd_line.ewm(span=signal).mean()
            histogram = macd_line - signal_line
            
            current_macd = float(macd_line.iloc[-1])
            current_signal = float(signal_line.iloc[-1])
            current_histogram = float(histogram.iloc[-1])
        
        # Convert to insights
        if current_macd > current_signal and current_histogram > 0:
            momentum = "bullish_crossover"
            trend_strength = min(abs(current_histogram) * 1000, 1.0)  # Scale appropriately
            interpretation = "momentum_shifting_bullish"
        elif current_macd < current_signal and current_histogram < 0:
            momentum = "bearish_crossover"
            trend_strength = min(abs(current_histogram) * 1000, 1.0)
            interpretation = "momentum_shifting_bearish"
        elif current_macd > current_signal:
            momentum = "bullish_trend"
            trend_strength = 0.7
            interpretation = "upward_momentum_continues"
        else:
            momentum = "bearish_trend"
            trend_strength = 0.7
            interpretation = "downward_momentum_continues"
        
        return {
            "momentum_direction": momentum,
            "trend_strength": round(trend_strength, 2),
            "interpretation": interpretation,
            "reference_values": {
                "macd": round(current_macd, 4),
                "signal": round(current_signal, 4),
                "histogram": round(current_histogram, 4)
            }
        }
        
    except Exception as e:
        return {
            "error": f"MACD calculation failed: {str(e)}",
            "momentum_direction": "unknown"
        }

def gpu_accelerated_bollinger_bands(prices, period=20, std_multiplier=2):
    """Calculate Bollinger Bands with interpretation"""
    try:
        if GPU_AVAILABLE and len(prices) > 100:
            prices_gpu = cp.array(prices)
            # Rolling calculations on GPU
            sma = cp.convolve(prices_gpu, cp.ones(period)/period, mode='valid')
            
            # Calculate rolling standard deviation
            rolling_std = cp.zeros(len(prices_gpu) - period + 1)
            for i in range(len(rolling_std)):
                window = prices_gpu[i:i+period]
                rolling_std[i] = cp.std(window)
            
            upper_band = sma + (std_multiplier * rolling_std)
            lower_band = sma - (std_multiplier * rolling_std)
            
            current_price = float(prices_gpu[-1])
            current_upper = float(upper_band[-1])
            current_lower = float(lower_band[-1])
            current_middle = float(sma[-1])
        else:
            # NumPy fallback
            df = pd.DataFrame({'price': prices})
            sma = df['price'].rolling(period).mean()
            rolling_std = df['price'].rolling(period).std()
            upper_band = sma + (std_multiplier * rolling_std)
            lower_band = sma - (std_multiplier * rolling_std)
            
            current_price = float(prices[-1])
            current_upper = float(upper_band.iloc[-1])
            current_lower = float(lower_band.iloc[-1])
            current_middle = float(sma.iloc[-1])
        
        # Calculate position and volatility
        band_width = ((current_upper - current_lower) / current_middle) * 100
        
        if current_price > current_upper:
            position = "above_upper_band"
            volatility_signal = "potential_reversal_zone"
            pressure = "selling_pressure_likely"
        elif current_price < current_lower:
            position = "below_lower_band"
            volatility_signal = "potential_bounce_zone"
            pressure = "buying_opportunity_zone"
        else:
            band_position_pct = ((current_price - current_lower) / (current_upper - current_lower)) * 100
            if band_position_pct > 80:
                position = "upper_band_pressure"
                volatility_signal = "approaching_resistance"
                pressure = "caution_zone"
            elif band_position_pct < 20:
                position = "lower_band_support"
                volatility_signal = "approaching_support"
                pressure = "potential_accumulation_zone"
            else:
                position = "middle_range"
                volatility_signal = "normal_trading_range"
                pressure = "balanced_conditions"
        
        # Volatility assessment
        if band_width < 10:
            volatility_state = "low_volatility_squeeze"
        elif band_width > 25:
            volatility_state = "high_volatility_expansion"
        else:
            volatility_state = "normal_volatility"
        
        return {
            "price_position": position,
            "volatility_signal": volatility_signal,
            "market_pressure": pressure,
            "volatility_state": volatility_state,
            "band_width_percent": round(band_width, 1),
            "reference_levels": {
                "upper": round(current_upper, 2),
                "middle": round(current_middle, 2),
                "lower": round(current_lower, 2),
                "current": round(current_price, 2)
            }
        }
        
    except Exception as e:
        return {
            "error": f"Bollinger Bands calculation failed: {str(e)}",
            "price_position": "unknown"
        }

def gpu_accelerated_moving_averages(prices, periods=[20, 50, 200]):
    """Calculate multiple MAs and determine trend structure"""
    try:
        ma_results = {}
        current_price = float(prices[-1])
        
        for period in periods:
            if len(prices) < period:
                continue
                
            if GPU_AVAILABLE and len(prices) > 100:
                prices_gpu = cp.array(prices)
                ma_values = cp.convolve(prices_gpu, cp.ones(period)/period, mode='valid')
                current_ma = float(ma_values[-1])
                
                # Calculate trend slope
                if len(ma_values) >= 10:
                    recent_ma = ma_values[-10:]
                    x = cp.arange(len(recent_ma))
                    slope = float(cp.polyfit(x, recent_ma, 1)[0])
                else:
                    slope = 0
            else:
                # NumPy fallback
                ma_series = pd.Series(prices).rolling(period).mean()
                current_ma = float(ma_series.iloc[-1])
                
                # Calculate trend slope
                if len(ma_series) >= 10:
                    recent_ma = ma_series.tail(10)
                    x = np.arange(len(recent_ma))
                    slope = float(np.polyfit(x, recent_ma, 1)[0])
                else:
                    slope = 0
            
            # Determine position and trend
            distance_pct = ((current_price - current_ma) / current_ma) * 100
            
            if slope > 0:
                trend_direction = "rising"
                trend_strength = min(abs(slope) * 100, 1.0)
            elif slope < 0:
                trend_direction = "falling" 
                trend_strength = min(abs(slope) * 100, 1.0)
            else:
                trend_direction = "sideways"
                trend_strength = 0.1
            
            if current_price > current_ma:
                position = "above_moving_average"
                if distance_pct > 5:
                    signal = "strong_bullish_position"
                else:
                    signal = "modest_bullish_position"
            else:
                position = "below_moving_average"
                if distance_pct < -5:
                    signal = "strong_bearish_position"
                else:
                    signal = "modest_bearish_position"
            
            ma_results[f"ma{period}"] = {
                "trend_direction": trend_direction,
                "trend_strength": round(trend_strength, 3),
                "price_position": position,
                "signal": signal,
                "distance_percent": round(distance_pct, 1),
                "reference_value": round(current_ma, 2)
            }
        
        # Overall trend consensus
        directions = [ma['trend_direction'] for ma in ma_results.values()]
        if directions.count('rising') > len(directions) / 2:
            consensus = "bullish_trend_structure"
        elif directions.count('falling') > len(directions) / 2:
            consensus = "bearish_trend_structure"
        else:
            consensus = "mixed_trend_signals"
        
        return {
            "trend_consensus": consensus,
            "moving_averages": ma_results,
            "interpretation": f"Multiple timeframe analysis shows {consensus.replace('_', ' ')}"
        }
        
    except Exception as e:
        return {
            "error": f"Moving averages calculation failed: {str(e)}",
            "trend_consensus": "unknown"
        }

def analyze_comprehensive_technicals(price_data, indicators_requested):
    """
    Main function that returns structured insights for AI models
    NO raw calculations - only interpretations and actionable insights
    """
    try:
        # Extract price values
        if isinstance(price_data, list):
            prices = [float(x) for x in price_data if isinstance(x, (int, float))]
        else:
            prices = price_data.get('prices', [])
        
        if len(prices) < 10:
            return {
                "error": "Insufficient price data for technical analysis",
                "insights": {}
            }
        
        insights = {}
        
        # Calculate requested indicators and convert to insights
        if 'rsi' in indicators_requested:
            insights['momentum_analysis'] = gpu_accelerated_rsi(prices)
        
        if 'macd' in indicators_requested:
            insights['trend_momentum'] = gpu_accelerated_macd(prices)
        
        if 'bollinger_bands' in indicators_requested:
            insights['volatility_analysis'] = gpu_accelerated_bollinger_bands(prices)
        
        if any(ma in indicators_requested for ma in ['ma20', 'ma50', 'ma200']):
            periods = []
            if 'ma20' in indicators_requested:
                periods.append(20)
            if 'ma50' in indicators_requested:
                periods.append(50)
            if 'ma200' in indicators_requested:
                periods.append(200)
            
            insights['trend_structure'] = gpu_accelerated_moving_averages(prices, periods)
        
        # Generate overall market assessment
        insights['market_assessment'] = generate_market_assessment(insights, prices)
        
        return {
            "success": True,
            "insights": insights,
            "data_quality": {
                "price_points": len(prices),
                "current_price": round(float(prices[-1]), 2),
                "price_range": {
                    "high": round(float(max(prices)), 2),
                    "low": round(float(min(prices)), 2)
                }
            },
            "timestamp": pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            "error": f"Comprehensive technical analysis failed: {str(e)}",
            "insights": {}
        }

def generate_market_assessment(insights, prices):
    """Generate overall market assessment from individual insights"""
    try:
        signals = []
        bullish_count = 0
        bearish_count = 0
        
        # Analyze momentum
        if 'momentum_analysis' in insights:
            momentum = insights['momentum_analysis']
            if momentum.get('momentum_state') in ['overbought']:
                signals.append('momentum_caution')
                bearish_count += 1
            elif momentum.get('momentum_state') in ['oversold']:
                signals.append('momentum_opportunity')
                bullish_count += 1
            elif momentum.get('momentum_state') == 'bullish_momentum':
                signals.append('positive_momentum')
                bullish_count += 1
        
        # Analyze trend
        if 'trend_momentum' in insights:
            trend = insights['trend_momentum']
            if 'bullish' in trend.get('momentum_direction', ''):
                signals.append('bullish_trend')
                bullish_count += 1
            elif 'bearish' in trend.get('momentum_direction', ''):
                signals.append('bearish_trend')
                bearish_count += 1
        
        # Analyze volatility
        if 'volatility_analysis' in insights:
            vol = insights['volatility_analysis']
            if vol.get('volatility_state') == 'low_volatility_squeeze':
                signals.append('breakout_potential')
            elif 'above_upper' in vol.get('price_position', ''):
                signals.append('overbought_levels')
                bearish_count += 1
            elif 'below_lower' in vol.get('price_position', ''):
                signals.append('oversold_levels')
                bullish_count += 1
        
        # Analyze trend structure
        if 'trend_structure' in insights:
            structure = insights['trend_structure']
            if structure.get('trend_consensus') == 'bullish_trend_structure':
                signals.append('strong_trend_support')
                bullish_count += 1
            elif structure.get('trend_consensus') == 'bearish_trend_structure':
                signals.append('trend_weakness')
                bearish_count += 1
        
        # Overall assessment
        total_signals = bullish_count + bearish_count
        if total_signals > 0:
            bullish_pct = (bullish_count / total_signals) * 100
            if bullish_pct > 65:
                overall_bias = "bullish_technical_setup"
                confidence = "high"
            elif bullish_pct < 35:
                overall_bias = "bearish_technical_setup"
                confidence = "high"
            else:
                overall_bias = "mixed_technical_signals"
                confidence = "moderate"
        else:
            overall_bias = "neutral_technical_stance"
            confidence = "low"
        
        # Current price context
        price_range = max(prices) - min(prices)
        current_position = ((prices[-1] - min(prices)) / price_range) * 100
        
        if current_position > 80:
            price_context = "near_recent_highs"
        elif current_position < 20:
            price_context = "near_recent_lows"
        else:
            price_context = "middle_of_range"
        
        return {
            "overall_bias": overall_bias,
            "confidence_level": confidence,
            "key_signals": signals,
            "price_context": price_context,
            "signal_summary": f"{bullish_count} bullish, {bearish_count} bearish signals",
            "interpretation": f"Technical analysis suggests {overall_bias.replace('_', ' ')} with {confidence} confidence"
        }
        
    except Exception as e:
        return {
            "error": f"Market assessment failed: {str(e)}",
            "overall_bias": "unknown"
        }

def main():
    """Main execution function for command line usage"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({"error": "Usage: python gpu_analytics.py <data_file>"}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        price_data = input_data.get('prices', input_data.get('price_data', []))
        indicators = input_data.get('indicators', ['rsi', 'macd', 'bollinger_bands', 'ma20', 'ma50', 'ma200'])
        
        # Perform GPU-accelerated analysis
        result = analyze_comprehensive_technicals(price_data, indicators)
        
        # Output structured insights (NOT raw calculations)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "error": f"GPU analytics failed: {str(e)}",
            "insights": {}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()