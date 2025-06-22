#!/usr/bin/env python3
"""
market_environment.py - Advanced Market Environment Analysis
Provides comprehensive numerical analysis of market conditions using scientific Python libraries
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

def calculate_market_environment_score(price_data, sector_data, view_mode='basic'):
    """
    Calculate comprehensive market environment score using multiple factors
    Returns detailed analysis with numerical scores and indicators
    """
    try:
        # Convert price data to DataFrame if needed
        if isinstance(price_data, list) and len(price_data) > 0:
            if isinstance(price_data[0], dict):
                df = pd.DataFrame(price_data)
                prices = df['close'].astype(float)
            else:
                prices = pd.Series(price_data, dtype=float)
        else:
            # Return default if no price data
            return {
                'score': 50,
                'market_phase': 'Unknown',
                'technical_analysis': {'error': 'Insufficient price data'},
                'sector_analysis': {'error': 'Insufficient sector data'},
                'sentiment_analysis': {'score': 50, 'direction': 'neutral'}
            }
        
        # Ensure we have enough data points
        if len(prices) < 50:
            return {
                'score': 50,
                'market_phase': 'Insufficient Data',
                'technical_analysis': {'error': 'Need at least 50 data points'},
                'sector_analysis': {'error': 'Insufficient data'},
                'sentiment_analysis': {'score': 50, 'direction': 'neutral'}
            }
        
        # Calculate technical indicators
        technical_analysis = calculate_technical_indicators(prices)
        
        # Calculate sector analysis
        sector_analysis = analyze_sector_breadth(sector_data)
        
        # Calculate sentiment analysis
        sentiment_analysis = calculate_market_sentiment(prices, technical_analysis)
        
        # Calculate composite market environment score
        technical_score = technical_analysis.get('score', 50)
        sector_score = sector_analysis.get('breadth_percent', 50)
        sentiment_score = sentiment_analysis.get('score', 50)
        
        # Weighted composite score
        composite_score = (
            technical_score * 0.4 +
            sector_score * 0.35 +
            sentiment_score * 0.25
        )
        
        # Determine market phase
        market_phase = determine_market_phase(technical_analysis, sector_analysis, sentiment_analysis)
        
        return {
            'score': round(composite_score, 1),
            'market_phase': market_phase,
            'technical_analysis': technical_analysis,
            'sector_analysis': sector_analysis,
            'sentiment_analysis': sentiment_analysis,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': f'Market environment analysis failed: {str(e)}',
            'score': 50,
            'market_phase': 'Error',
            'technical_analysis': {'error': str(e)},
            'sector_analysis': {'error': str(e)},
            'sentiment_analysis': {'score': 50, 'direction': 'neutral'}
        }

def calculate_technical_indicators(prices):
    """Calculate comprehensive technical indicators"""
    try:
        prices = pd.Series(prices, dtype=float)
        
        # Moving averages
        ma20 = prices.rolling(20).mean()
        ma50 = prices.rolling(50).mean()
        ma200 = prices.rolling(200).mean() if len(prices) >= 200 else prices.rolling(len(prices)//2).mean()
        
        current_price = prices.iloc[-1]
        
        # RSI calculation
        rsi = calculate_rsi(prices)
        
        # Bollinger Bands
        bb_upper, bb_lower, bb_middle = calculate_bollinger_bands(prices)
        
        # MACD
        macd_line, macd_signal, macd_histogram = calculate_macd(prices)
        
        # Trend analysis
        trend_direction = determine_trend_direction(prices, ma20, ma50, ma200)
        
        # Support and resistance levels
        support_resistance = calculate_support_resistance(prices)
        
        # Volatility analysis
        volatility = calculate_volatility_metrics(prices)
        
        # Price position analysis
        above_ma20 = current_price > ma20.iloc[-1] if not pd.isna(ma20.iloc[-1]) else False
        above_ma50 = current_price > ma50.iloc[-1] if not pd.isna(ma50.iloc[-1]) else False
        above_ma200 = current_price > ma200.iloc[-1] if not pd.isna(ma200.iloc[-1]) else False
        
        # Golden/Death cross detection
        golden_cross = detect_golden_cross(ma50, ma200)
        death_cross = detect_death_cross(ma50, ma200)
        
        # Calculate technical score
        technical_score = calculate_technical_score(
            rsi, above_ma20, above_ma50, above_ma200, 
            golden_cross, death_cross, volatility, trend_direction
        )
        
        return {
            'score': round(technical_score, 1),
            'rsi': round(rsi, 1),
            'ma20': round(ma20.iloc[-1], 2),
            'ma50': round(ma50.iloc[-1], 2),
            'ma200': round(ma200.iloc[-1], 2),
            'above_ma20': above_ma20,
            'above_ma50': above_ma50,
            'above_ma200': above_ma200,
            'golden_cross': golden_cross,
            'death_cross': death_cross,
            'trend_direction': trend_direction,
            'bollinger_bands': {
                'upper': round(bb_upper, 2),
                'lower': round(bb_lower, 2),
                'middle': round(bb_middle, 2),
                'position': 'upper' if current_price > bb_upper else 'lower' if current_price < bb_lower else 'middle'
            },
            'macd': {
                'line': round(macd_line, 4),
                'signal': round(macd_signal, 4),
                'histogram': round(macd_histogram, 4),
                'bullish': macd_line > macd_signal
            },
            'support_resistance': support_resistance,
            'volatility': volatility
        }
        
    except Exception as e:
        return {
            'error': f'Technical analysis failed: {str(e)}',
            'score': 50
        }

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    sma = prices.rolling(period).mean()
    std = prices.rolling(period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    return upper.iloc[-1], lower.iloc[-1], sma.iloc[-1]

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD indicators"""
    exp1 = prices.ewm(span=fast).mean()
    exp2 = prices.ewm(span=slow).mean()
    macd_line = exp1 - exp2
    macd_signal = macd_line.ewm(span=signal).mean()
    macd_histogram = macd_line - macd_signal
    return macd_line.iloc[-1], macd_signal.iloc[-1], macd_histogram.iloc[-1]

def determine_trend_direction(prices, ma20, ma50, ma200):
    """Determine overall trend direction"""
    current_price = prices.iloc[-1]
    
    above_ma20 = current_price > ma20.iloc[-1] if not pd.isna(ma20.iloc[-1]) else False
    above_ma50 = current_price > ma50.iloc[-1] if not pd.isna(ma50.iloc[-1]) else False
    above_ma200 = current_price > ma200.iloc[-1] if not pd.isna(ma200.iloc[-1]) else False
    
    ma_alignment = (ma20.iloc[-1] > ma50.iloc[-1] > ma200.iloc[-1]) if all(not pd.isna(x.iloc[-1]) for x in [ma20, ma50, ma200]) else False
    
    if above_ma20 and above_ma50 and above_ma200 and ma_alignment:
        return 'strong_bullish'
    elif above_ma20 and above_ma50:
        return 'bullish'
    elif not above_ma20 and not above_ma50 and not above_ma200:
        return 'bearish'
    else:
        return 'mixed'

def detect_golden_cross(ma50, ma200):
    """Detect golden cross pattern"""
    if len(ma50) < 2 or len(ma200) < 2:
        return False
    return ma50.iloc[-1] > ma200.iloc[-1] and ma50.iloc[-2] <= ma200.iloc[-2]

def detect_death_cross(ma50, ma200):
    """Detect death cross pattern"""
    if len(ma50) < 2 or len(ma200) < 2:
        return False
    return ma50.iloc[-1] < ma200.iloc[-1] and ma50.iloc[-2] >= ma200.iloc[-2]

def calculate_support_resistance(prices):
    """Calculate support and resistance levels"""
    recent_prices = prices.tail(50)
    support = recent_prices.min()
    resistance = recent_prices.max()
    current_price = prices.iloc[-1]
    
    return {
        'support': round(support, 2),
        'resistance': round(resistance, 2),
        'distance_to_support': round(((current_price - support) / support) * 100, 2),
        'distance_to_resistance': round(((resistance - current_price) / current_price) * 100, 2)
    }

def calculate_volatility_metrics(prices):
    """Calculate volatility metrics"""
    returns = prices.pct_change().dropna()
    daily_vol = returns.std()
    annual_vol = daily_vol * np.sqrt(252)
    
    return {
        'daily_volatility': round(daily_vol * 100, 2),
        'annual_volatility': round(annual_vol * 100, 2),
        'volatility_regime': 'high' if annual_vol > 0.25 else 'low' if annual_vol < 0.15 else 'normal'
    }

def calculate_technical_score(rsi, above_ma20, above_ma50, above_ma200, golden_cross, death_cross, volatility, trend):
    """Calculate composite technical score"""
    score = 50  # Base score
    
    # RSI contribution
    if 30 <= rsi <= 70:
        score += 10  # Neutral RSI is good
    elif rsi < 30:
        score += 5   # Oversold can be opportunity
    elif rsi > 70:
        score -= 5   # Overbought is concerning
    
    # Moving average position
    if above_ma200:
        score += 15
    if above_ma50:
        score += 10
    if above_ma20:
        score += 10
    
    # Cross patterns
    if golden_cross:
        score += 15
    if death_cross:
        score -= 15
    
    # Trend strength
    if trend == 'strong_bullish':
        score += 15
    elif trend == 'bullish':
        score += 10
    elif trend == 'bearish':
        score -= 10
    
    # Volatility adjustment
    vol_regime = volatility.get('volatility_regime', 'normal')
    if vol_regime == 'high':
        score -= 5  # High vol reduces score
    elif vol_regime == 'low':
        score += 5  # Low vol improves score
    
    return max(0, min(100, score))

def analyze_sector_breadth(sector_data):
    """Analyze sector breadth and participation"""
    try:
        if not sector_data or len(sector_data) == 0:
            return {
                'breadth_percent': 50,
                'advancing_sectors': [],
                'declining_sectors': [],
                'neutral_sectors': [],
                'leadership_strength': 'weak'
            }
        
        advancing = []
        declining = []
        neutral = []
        
        for sector in sector_data:
            if isinstance(sector, dict) and 'change_percent' in sector:
                change = float(sector.get('change_percent', 0))
                sector_name = sector.get('name', sector.get('sector', 'Unknown'))
                
                if change > 1:
                    advancing.append(sector_name)
                elif change < -1:
                    declining.append(sector_name)
                else:
                    neutral.append(sector_name)
        
        total_sectors = len(advancing) + len(declining) + len(neutral)
        breadth_percent = (len(advancing) / total_sectors * 100) if total_sectors > 0 else 50
        
        # Determine leadership strength
        if breadth_percent > 70:
            leadership_strength = 'strong'
        elif breadth_percent > 55:
            leadership_strength = 'moderate'
        else:
            leadership_strength = 'weak'
        
        return {
            'breadth_percent': round(breadth_percent, 1),
            'advancing_sectors': advancing,
            'declining_sectors': declining,
            'neutral_sectors': neutral,
            'leadership_strength': leadership_strength,
            'total_sectors_analyzed': total_sectors
        }
        
    except Exception as e:
        return {
            'error': f'Sector analysis failed: {str(e)}',
            'breadth_percent': 50,
            'advancing_sectors': [],
            'declining_sectors': [],
            'neutral_sectors': []
        }

def calculate_market_sentiment(prices, technical_analysis):
    """Calculate market sentiment indicators"""
    try:
        returns = prices.pct_change().dropna()
        
        # Calculate sentiment metrics
        positive_days = (returns > 0).sum()
        total_days = len(returns)
        positive_ratio = positive_days / total_days if total_days > 0 else 0.5
        
        # Momentum analysis
        recent_momentum = returns.tail(10).mean()
        
        # Combine with technical indicators
        rsi = technical_analysis.get('rsi', 50)
        trend = technical_analysis.get('trend_direction', 'mixed')
        
        # Calculate sentiment score
        sentiment_score = 50  # Base score
        
        # Positive ratio contribution
        sentiment_score += (positive_ratio - 0.5) * 40
        
        # Momentum contribution
        sentiment_score += recent_momentum * 1000
        
        # RSI contribution to sentiment
        if rsi > 70:
            sentiment_score += 10  # Overbought can indicate strong sentiment
        elif rsi < 30:
            sentiment_score -= 10  # Oversold indicates weak sentiment
        
        # Trend contribution
        if trend == 'strong_bullish':
            sentiment_score += 15
        elif trend == 'bullish':
            sentiment_score += 10
        elif trend == 'bearish':
            sentiment_score -= 10
        
        sentiment_score = max(0, min(100, sentiment_score))
        
        # Determine sentiment direction
        if sentiment_score > 60:
            direction = 'positive'
        elif sentiment_score < 40:
            direction = 'negative'
        else:
            direction = 'neutral'
        
        return {
            'score': round(sentiment_score, 1),
            'direction': direction,
            'positive_days_ratio': round(positive_ratio, 3),
            'recent_momentum': round(recent_momentum * 100, 2),
            'sentiment_regime': 'bullish' if sentiment_score > 65 else 'bearish' if sentiment_score < 35 else 'neutral'
        }
        
    except Exception as e:
        return {
            'error': f'Sentiment analysis failed: {str(e)}',
            'score': 50,
            'direction': 'neutral'
        }

def determine_market_phase(technical_analysis, sector_analysis, sentiment_analysis):
    """Determine the current market phase"""
    tech_score = technical_analysis.get('score', 50)
    breadth = sector_analysis.get('breadth_percent', 50)
    sentiment_score = sentiment_analysis.get('score', 50)
    trend = technical_analysis.get('trend_direction', 'mixed')
    
    # Phase determination logic
    if tech_score > 70 and breadth > 65 and sentiment_score > 65:
        return 'Bull Market'
    elif tech_score > 60 and breadth > 55 and trend in ['bullish', 'strong_bullish']:
        return 'Recovery Phase'
    elif tech_score < 30 and breadth < 35 and sentiment_score < 35:
        return 'Bear Market'
    elif tech_score < 40 and breadth < 45 and trend == 'bearish':
        return 'Distribution Phase'
    elif 40 <= tech_score <= 60 and 45 <= breadth <= 55:
        return 'Consolidation'
    else:
        return 'Transition Phase'

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python market_environment.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        price_history = input_data.get('price_history', [])
        sector_data = input_data.get('sector_data', [])
        view_mode = input_data.get('view_mode', 'basic')
        
        # Perform analysis
        result = calculate_market_environment_score(price_history, sector_data, view_mode)
        
        # Output result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': f'Market environment analysis failed: {str(e)}',
            'score': 50,
            'market_phase': 'Error'
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
