#!/usr/bin/env python3
"""
macro_analysis.py - Advanced Macroeconomic Environment Analysis
Analyzes cross-asset relationships and macro regime identification using scientific Python libraries
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

def analyze_macro_environment(macro_data):
    """
    Analyze macroeconomic environment through cross-asset relationships
    Returns comprehensive macro regime analysis and risk assessment
    """
    try:
        if not macro_data or len(macro_data) == 0:
            return {
                'overall_risk_level': 5,
                'market_regime': 'Unknown',
                'risk_signals': [],
                'analysis': {},
                'actionable_insights': ['Insufficient macro data for analysis'],
                'error': 'No macro data provided'
            }
        
        # Process macro asset data
        processed_data = process_macro_data(macro_data)
        
        # Analyze key relationships
        relationship_analysis = analyze_cross_asset_relationships(processed_data)
        
        # Determine market regime
        market_regime = determine_market_regime(relationship_analysis, processed_data)
        
        # Calculate risk assessment
        risk_assessment = calculate_macro_risk_level(relationship_analysis, processed_data)
        
        # Generate actionable insights
        actionable_insights = generate_macro_insights(market_regime, risk_assessment, relationship_analysis)
        
        return {
            'overall_risk_level': risk_assessment['risk_level'],
            'market_regime': market_regime['regime'],
            'risk_signals': risk_assessment['risk_signals'],
            'analysis': relationship_analysis,
            'regime_confidence': market_regime['confidence'],
            'actionable_insights': actionable_insights,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': f'Macro analysis failed: {str(e)}',
            'overall_risk_level': 5,
            'market_regime': 'Error',
            'risk_signals': ['Analysis failed'],
            'analysis': {},
            'actionable_insights': ['Analysis failed due to technical error']
        }

def process_macro_data(macro_data):
    """Process and standardize macro asset data"""
    try:
        processed = {}
        
        # Expected macro symbols and their analysis
        expected_symbols = {
            'TLT': 'treasury_yield',     # Long-term treasury bonds (inverse yield proxy)
            'UUP': 'dollar_strength',    # US Dollar strength
            'GLD': 'gold',               # Gold as safe haven
            'VIXY': 'volatility',        # Volatility index
            'USO': 'oil',                # Oil/commodities
            'EEM': 'emerging_markets',   # Emerging markets
            'IBIT': 'bitcoin',           # Bitcoin/crypto
            'JNK': 'credit_risk'         # High yield credit spreads
        }
        
        for symbol, category in expected_symbols.items():
            asset_data = find_asset_data(macro_data, symbol)
            if asset_data:
                processed[category] = calculate_asset_metrics(asset_data)
        
        return processed
        
    except Exception as e:
        return {}

def find_asset_data(macro_data, symbol):
    """Find data for specific symbol in macro data"""
    for asset in macro_data:
        if isinstance(asset, dict):
            asset_symbol = asset.get('symbol', asset.get('ticker', '')).upper()
            if asset_symbol == symbol:
                return asset
    return None

def calculate_asset_metrics(asset_data):
    """Calculate key metrics for an asset"""
    try:
        # Extract price changes over different periods
        change_1d = float(asset_data.get('change_percent', asset_data.get('dayChange', 0)))
        change_1w = float(asset_data.get('week_change', change_1d * 5))
        change_1m = float(asset_data.get('month_change', change_1d * 20))
        change_3m = float(asset_data.get('quarter_change', change_1d * 60))
        
        current_price = float(asset_data.get('price', asset_data.get('close', 100)))
        
        # Calculate momentum and volatility proxies
        momentum = (change_1d * 0.4 + change_1w * 0.3 + change_1m * 0.2 + change_3m * 0.1)
        volatility_proxy = abs(change_1d) + abs(change_1w - change_1d) * 0.5
        
        return {
            'current_price': current_price,
            'change_1d': change_1d,
            'change_1w': change_1w,
            'change_1m': change_1m,
            'change_3m': change_3m,
            'momentum': momentum,
            'volatility_proxy': volatility_proxy,
            'trend_strength': calculate_trend_strength(change_1d, change_1w, change_1m)
        }
        
    except Exception as e:
        return {
            'current_price': 100,
            'change_1d': 0,
            'change_1w': 0,
            'change_1m': 0,
            'change_3m': 0,
            'momentum': 0,
            'volatility_proxy': 0,
            'trend_strength': 0
        }

def calculate_trend_strength(change_1d, change_1w, change_1m):
    """Calculate trend strength based on consistency across timeframes"""
    changes = [change_1d, change_1w, change_1m]
    
    # Check if all changes have same sign (consistent trend)
    positive_count = sum(1 for x in changes if x > 0)
    negative_count = sum(1 for x in changes if x < 0)
    
    if positive_count == 3:
        return max(changes)  # Strong positive trend
    elif negative_count == 3:
        return min(changes)  # Strong negative trend
    else:
        return 0  # Mixed/weak trend

def analyze_cross_asset_relationships(processed_data):
    """Analyze key cross-asset relationships for macro regime identification"""
    try:
        analysis = {}
        
        # Treasury Yield Analysis (inverse relationship with TLT)
        if 'treasury_yield' in processed_data:
            tlt_data = processed_data['treasury_yield']
            # TLT down = yields up (inflationary/growth)
            # TLT up = yields down (deflationary/risk-off)
            yield_direction = 'rising' if tlt_data['change_1m'] < -1 else 'falling' if tlt_data['change_1m'] > 1 else 'stable'
            
            analysis['treasury_yield'] = {
                'direction': yield_direction,
                'momentum': -tlt_data['momentum'],  # Inverse for yield
                'implication': 'inflationary_pressure' if yield_direction == 'rising' else 'deflationary_pressure' if yield_direction == 'falling' else 'neutral'
            }
        
        # Stocks vs Bonds Relationship
        stocks_bonds_relationship = analyze_stocks_bonds_relationship(processed_data)
        analysis['stocks_bonds'] = stocks_bonds_relationship
        
        # Dollar Strength Analysis
        if 'dollar_strength' in processed_data:
            dollar_data = processed_data['dollar_strength']
            dollar_strength = 'strong' if dollar_data['change_1m'] > 2 else 'weak' if dollar_data['change_1m'] < -2 else 'neutral'
            
            analysis['dollar_strength'] = {
                'strength': dollar_strength,
                'momentum': dollar_data['momentum'],
                'implication': analyze_dollar_implications(dollar_strength, dollar_data['momentum'])
            }
        
        # Bitcoin vs Gold Analysis (Risk-on vs Risk-off)
        bitcoin_gold_analysis = analyze_bitcoin_gold_relationship(processed_data)
        analysis['bitcoin_gold'] = bitcoin_gold_analysis
        
        # Volatility Analysis
        if 'volatility' in processed_data:
            vol_data = processed_data['volatility']
            vol_regime = 'high' if vol_data['change_1m'] > 10 else 'low' if vol_data['change_1m'] < -10 else 'normal'
            
            analysis['volatility'] = {
                'regime': vol_regime,
                'momentum': vol_data['momentum'],
                'risk_implication': 'elevated_risk' if vol_regime == 'high' else 'complacency_risk' if vol_regime == 'low' else 'normal_risk'
            }
        
        # Credit Risk Analysis
        if 'credit_risk' in processed_data:
            credit_data = processed_data['credit_risk']
            # JNK up = credit spreads tightening (risk-on)
            # JNK down = credit spreads widening (risk-off)
            credit_environment = 'tightening' if credit_data['change_1m'] > 1 else 'widening' if credit_data['change_1m'] < -1 else 'stable'
            
            analysis['credit_risk'] = {
                'spreads': credit_environment,
                'momentum': credit_data['momentum'],
                'risk_implication': 'low_credit_risk' if credit_environment == 'tightening' else 'high_credit_risk' if credit_environment == 'widening' else 'normal_credit_risk'
            }
        
        # Commodity/Oil Analysis
        if 'oil' in processed_data:
            oil_data = processed_data['oil']
            oil_trend = 'rising' if oil_data['change_1m'] > 5 else 'falling' if oil_data['change_1m'] < -5 else 'stable'
            
            analysis['commodities'] = {
                'oil_trend': oil_trend,
                'momentum': oil_data['momentum'],
                'inflation_implication': 'inflationary' if oil_trend == 'rising' else 'disinflationary' if oil_trend == 'falling' else 'neutral'
            }
        
        return analysis
        
    except Exception as e:
        return {'error': f'Cross-asset analysis failed: {str(e)}'}

def analyze_stocks_bonds_relationship(processed_data):
    """Analyze the stocks vs bonds relationship"""
    try:
        # We don't have direct stock data, so we'll use treasury bonds as proxy
        # and infer from other relationships
        
        if 'treasury_yield' in processed_data and 'credit_risk' in processed_data:
            bond_performance = processed_data['treasury_yield']['change_1m']
            credit_performance = processed_data['credit_risk']['change_1m']
            
            # If both bonds and credit are up, it's risk-on (stocks likely up)
            # If both are down, it's risk-off (stocks likely down)
            if bond_performance < -1 and credit_performance > 1:  # Yields up, credit spreads tight
                relationship = 'risk_on'
                implication = 'stocks_favored'
            elif bond_performance > 1 and credit_performance < -1:  # Yields down, credit spreads wide
                relationship = 'risk_off'
                implication = 'bonds_favored'
            else:
                relationship = 'mixed'
                implication = 'unclear_preference'
            
            return {
                'relationship': relationship,
                'implication': implication,
                'bond_momentum': processed_data['treasury_yield']['momentum'],
                'credit_momentum': processed_data['credit_risk']['momentum']
            }
        
        return {
            'relationship': 'unknown',
            'implication': 'insufficient_data',
            'bond_momentum': 0,
            'credit_momentum': 0
        }
        
    except Exception as e:
        return {
            'relationship': 'error',
            'implication': f'analysis_failed: {str(e)}',
            'bond_momentum': 0,
            'credit_momentum': 0
        }

def analyze_dollar_implications(strength, momentum):
    """Analyze implications of dollar strength"""
    if strength == 'strong' and momentum > 0:
        return 'headwind_for_commodities_and_EM'
    elif strength == 'weak' and momentum < 0:
        return 'tailwind_for_commodities_and_EM'
    elif strength == 'strong' and momentum < 0:
        return 'dollar_strength_peaking'
    elif strength == 'weak' and momentum > 0:
        return 'dollar_weakness_bottoming'
    else:
        return 'neutral_dollar_impact'

def analyze_bitcoin_gold_relationship(processed_data):
    """Analyze Bitcoin vs Gold for risk sentiment"""
    try:
        bitcoin_data = processed_data.get('bitcoin', {})
        gold_data = processed_data.get('gold', {})
        
        if not bitcoin_data or not gold_data:
            return {
                'relationship': 'unknown',
                'risk_sentiment': 'unclear',
                'relative_performance': 0
            }
        
        bitcoin_performance = bitcoin_data.get('change_1m', 0)
        gold_performance = gold_data.get('change_1m', 0)
        
        relative_performance = bitcoin_performance - gold_performance
        
        if relative_performance > 5:
            risk_sentiment = 'risk_on'
            relationship = 'bitcoin_outperforming'
        elif relative_performance < -5:
            risk_sentiment = 'risk_off'
            relationship = 'gold_outperforming'
        else:
            risk_sentiment = 'neutral'
            relationship = 'similar_performance'
        
        return {
            'relationship': relationship,
            'risk_sentiment': risk_sentiment,
            'relative_performance': round(relative_performance, 2),
            'bitcoin_momentum': bitcoin_data.get('momentum', 0),
            'gold_momentum': gold_data.get('momentum', 0)
        }
        
    except Exception as e:
        return {
            'relationship': 'error',
            'risk_sentiment': f'analysis_failed: {str(e)}',
            'relative_performance': 0
        }

def determine_market_regime(relationship_analysis, processed_data):
    """Determine overall market regime based on cross-asset analysis"""
    try:
        if 'error' in relationship_analysis:
            return {'regime': 'Unknown', 'confidence': 0}
        
        # Scoring system for different regimes
        risk_on_score = 0
        risk_off_score = 0
        inflationary_score = 0
        deflationary_score = 0
        
        # Treasury yield analysis
        yield_analysis = relationship_analysis.get('treasury_yield', {})
        if yield_analysis.get('implication') == 'inflationary_pressure':
            inflationary_score += 2
            risk_on_score += 1
        elif yield_analysis.get('implication') == 'deflationary_pressure':
            deflationary_score += 2
            risk_off_score += 1
        
        # Stocks vs bonds
        stocks_bonds = relationship_analysis.get('stocks_bonds', {})
        if stocks_bonds.get('relationship') == 'risk_on':
            risk_on_score += 2
        elif stocks_bonds.get('relationship') == 'risk_off':
            risk_off_score += 2
        
        # Bitcoin vs Gold
        bitcoin_gold = relationship_analysis.get('bitcoin_gold', {})
        if bitcoin_gold.get('risk_sentiment') == 'risk_on':
            risk_on_score += 1
        elif bitcoin_gold.get('risk_sentiment') == 'risk_off':
            risk_off_score += 1
        
        # Credit risk
        credit_analysis = relationship_analysis.get('credit_risk', {})
        if credit_analysis.get('risk_implication') == 'low_credit_risk':
            risk_on_score += 1
        elif credit_analysis.get('risk_implication') == 'high_credit_risk':
            risk_off_score += 2
        
        # Volatility
        vol_analysis = relationship_analysis.get('volatility', {})
        if vol_analysis.get('risk_implication') == 'elevated_risk':
            risk_off_score += 1
        elif vol_analysis.get('risk_implication') == 'complacency_risk':
            risk_on_score += 1  # Low vol can indicate risk-on
        
        # Commodities
        commodity_analysis = relationship_analysis.get('commodities', {})
        if commodity_analysis.get('inflation_implication') == 'inflationary':
            inflationary_score += 1
        elif commodity_analysis.get('inflation_implication') == 'disinflationary':
            deflationary_score += 1
        
        # Determine regime
        total_score = risk_on_score + risk_off_score + inflationary_score + deflationary_score
        
        if total_score < 2:
            regime = 'Mixed Conditions'
            confidence = 30
        elif risk_on_score > risk_off_score and inflationary_score > deflationary_score:
            regime = 'Inflationary Growth'
            confidence = min(90, 50 + (risk_on_score + inflationary_score) * 8)
        elif risk_on_score > risk_off_score and deflationary_score >= inflationary_score:
            regime = 'Risk-On'
            confidence = min(90, 50 + risk_on_score * 10)
        elif risk_off_score > risk_on_score and inflationary_score > deflationary_score:
            regime = 'Stagflation'
            confidence = min(90, 50 + (risk_off_score + inflationary_score) * 8)
        elif risk_off_score > risk_on_score and deflationary_score >= inflationary_score:
            regime = 'Risk-Off'
            confidence = min(90, 50 + risk_off_score * 10)
        elif inflationary_score > deflationary_score:
            regime = 'Reflation'
            confidence = min(80, 40 + inflationary_score * 10)
        elif deflationary_score > inflationary_score:
            regime = 'Disinflation'
            confidence = min(80, 40 + deflationary_score * 10)
        else:
            regime = 'Transitional'
            confidence = 40
        
        return {
            'regime': regime,
            'confidence': round(confidence, 1),
            'risk_on_score': risk_on_score,
            'risk_off_score': risk_off_score,
            'inflationary_score': inflationary_score,
            'deflationary_score': deflationary_score
        }
        
    except Exception as e:
        return {
            'regime': 'Error',
            'confidence': 0,
            'error': str(e)
        }

def calculate_macro_risk_level(relationship_analysis, processed_data):
    """Calculate overall macro risk level"""
    try:
        risk_level = 5  # Base risk level (1-10 scale)
        risk_signals = []
        
        # Volatility risk
        vol_analysis = relationship_analysis.get('volatility', {})
        if vol_analysis.get('regime') == 'high':
            risk_level += 2
            risk_signals.append('Elevated volatility')
        elif vol_analysis.get('regime') == 'low':
            risk_level -= 1  # Low vol reduces risk but can indicate complacency
            risk_signals.append('Low volatility (complacency risk)')
        
        # Credit risk
        credit_analysis = relationship_analysis.get('credit_risk', {})
        if credit_analysis.get('risk_implication') == 'high_credit_risk':
            risk_level += 2
            risk_signals.append('Credit spreads widening')
        elif credit_analysis.get('risk_implication') == 'low_credit_risk':
            risk_level -= 1
        
        # Dollar strength impact
        dollar_analysis = relationship_analysis.get('dollar_strength', {})
        if dollar_analysis.get('strength') == 'strong' and dollar_analysis.get('momentum') > 2:
            risk_level += 1
            risk_signals.append('Strong dollar momentum')
        
        # Interest rate risk
        yield_analysis = relationship_analysis.get('treasury_yield', {})
        if yield_analysis.get('momentum', 0) > 3:  # Rising yields
            risk_level += 1
            risk_signals.append('Rising interest rates')
        elif yield_analysis.get('momentum', 0) < -3:  # Falling yields (might indicate recession fear)
            risk_level += 1
            risk_signals.append('Falling yields (recession concern)')
        
        # Commodity/inflation risk
        commodity_analysis = relationship_analysis.get('commodities', {})
        if commodity_analysis.get('inflation_implication') == 'inflationary' and commodity_analysis.get('momentum', 0) > 5:
            risk_level += 1
            risk_signals.append('Inflationary commodity pressure')
        
        # Cross-asset divergence risk
        bitcoin_gold = relationship_analysis.get('bitcoin_gold', {})
        stocks_bonds = relationship_analysis.get('stocks_bonds', {})
        
        if bitcoin_gold.get('relationship') == 'similar_performance' and stocks_bonds.get('relationship') == 'mixed':
            risk_level += 1
            risk_signals.append('Cross-asset signal divergence')
        
        # Ensure risk level stays within bounds
        risk_level = max(1, min(10, risk_level))
        
        # Remove duplicate signals
        risk_signals = list(set(risk_signals))
        
        # If no specific risks identified, add general assessment
        if not risk_signals:
            if risk_level <= 3:
                risk_signals.append('Low macro risk environment')
            elif risk_level >= 7:
                risk_signals.append('Elevated macro risk environment')
            else:
                risk_signals.append('Moderate macro risk environment')
        
        return {
            'risk_level': risk_level,
            'risk_signals': risk_signals
        }
        
    except Exception as e:
        return {
            'risk_level': 5,
            'risk_signals': [f'Risk calculation failed: {str(e)}']
        }

def generate_macro_insights(market_regime, risk_assessment, relationship_analysis):
    """Generate actionable insights based on macro analysis"""
    try:
        insights = []
        
        regime = market_regime.get('regime', 'Unknown')
        confidence = market_regime.get('confidence', 0)
        risk_level = risk_assessment.get('risk_level', 5)
        risk_signals = risk_assessment.get('risk_signals', [])
        
        # Regime-specific insights
        if regime == 'Risk-On' and confidence > 60:
            insights.append("Risk-on environment favors growth equities over bonds")
            insights.append("Consider overweighting cyclical sectors and emerging markets")
            insights.append("Credit spreads likely to compress further")
            
        elif regime == 'Risk-Off' and confidence > 60:
            insights.append("Risk-off environment favors quality bonds and defensive assets")
            insights.append("Reduce equity beta and increase portfolio quality")
            insights.append("Gold and treasuries may outperform")
            
        elif regime == 'Inflationary Growth' and confidence > 60:
            insights.append("Inflationary growth supports real assets and commodities")
            insights.append("Consider TIPS, energy sector, and companies with pricing power")
            insights.append("Reduce duration risk in fixed income")
            
        elif regime == 'Stagflation' and confidence > 60:
            insights.append("Stagflation creates challenges for both stocks and bonds")
            insights.append("Focus on real assets, energy, and inflation-protected securities")
            insights.append("Avoid long-duration bonds and high-multiple growth stocks")
            
        elif regime == 'Reflation' and confidence > 60:
            insights.append("Reflation supports cyclical value over growth")
            insights.append("Financials and industrials may outperform technology")
            insights.append("Moderate inflation expectations support risk assets")
            
        elif regime == 'Disinflation' and confidence > 60:
            insights.append("Disinflation benefits long-duration assets")
            insights.append("Growth stocks and long-term bonds may outperform")
            insights.append("Credit conditions likely to remain supportive")
        
        # Risk-specific insights
        if risk_level >= 7:
            insights.append("Elevated risk levels suggest defensive positioning and increased cash")
            insights.append("Consider downside protection strategies")
            
        elif risk_level <= 3:
            insights.append("Low risk environment may support measured risk-taking")
            insights.append("Monitor for complacency indicators")
        
        # Specific relationship insights
        dollar_analysis = relationship_analysis.get('dollar_strength', {})
        if dollar_analysis.get('strength') == 'strong':
            insights.append("Strong dollar creates headwinds for international and commodity investments")
        elif dollar_analysis.get('strength') == 'weak':
            insights.append("Weak dollar supports international diversification and commodity exposure")
        
        # Bitcoin vs Gold insight
        bitcoin_gold = relationship_analysis.get('bitcoin_gold', {})
        if bitcoin_gold.get('risk_sentiment') == 'risk_on':
            insights.append("Bitcoin outperformance vs gold suggests risk appetite")
        elif bitcoin_gold.get('risk_sentiment') == 'risk_off':
            insights.append("Gold outperformance vs bitcoin indicates flight to safety")
        
        # Default insight if no specific ones generated
        if not insights:
            insights.append("Monitor cross-asset relationships for regime changes")
            insights.append("Maintain balanced exposure across asset classes")
        
        return insights
        
    except Exception as e:
        return [f"Insight generation failed: {str(e)}"]

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python macro_analysis.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        macro_data = input_data.get('macro_data', [])
        
        # Perform analysis
        result = analyze_macro_environment(macro_data)
        
        # Output result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': f'Macro analysis failed: {str(e)}',
            'overall_risk_level': 5,
            'market_regime': 'Error',
            'risk_signals': ['Analysis failed'],
            'analysis': {},
            'actionable_insights': ['Analysis failed due to technical error']
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
