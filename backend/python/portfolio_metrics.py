#!/usr/bin/env python3
"""
portfolio_metrics.py - Advanced Portfolio Performance Metrics
Calculates comprehensive portfolio analytics and risk metrics using scientific Python libraries
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
import warnings
warnings.filterwarnings('ignore')

def calculate_portfolio_metrics(portfolio_data):
    """
    Calculate comprehensive portfolio performance and risk metrics
    Returns detailed portfolio analytics and optimization insights
    """
    try:
        if not portfolio_data or len(portfolio_data) == 0:
            return {
                'error': 'No portfolio data provided',
                'metrics': {},
                'risk_analysis': {},
                'optimization': {}
            }
        
        # Process portfolio holdings
        holdings = process_portfolio_holdings(portfolio_data)
        
        # Calculate performance metrics
        performance_metrics = calculate_performance_metrics(holdings)
        
        # Calculate risk metrics
        risk_metrics = calculate_risk_metrics(holdings)
        
        # Calculate diversification metrics
        diversification_metrics = calculate_diversification_metrics(holdings)
        
        # Portfolio optimization analysis
        optimization_analysis = analyze_portfolio_optimization(holdings)
        
        # Risk-adjusted performance
        risk_adjusted_metrics = calculate_risk_adjusted_metrics(performance_metrics, risk_metrics)
        
        return {
            'performance': performance_metrics,
            'risk_analysis': risk_metrics,
            'diversification': diversification_metrics,
            'optimization': optimization_analysis,
            'risk_adjusted': risk_adjusted_metrics,
            'holdings_count': len(holdings),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': f'Portfolio metrics calculation failed: {str(e)}',
            'metrics': {},
            'risk_analysis': {},
            'optimization': {}
        }

def process_portfolio_holdings(portfolio_data):
    """Process and standardize portfolio holdings data"""
    try:
        holdings = []
        
        for holding in portfolio_data:
            if isinstance(holding, dict):
                # Extract holding information
                symbol = holding.get('symbol', holding.get('ticker', 'UNKNOWN'))
                shares = float(holding.get('shares', holding.get('quantity', 0)))
                price = float(holding.get('price', holding.get('current_price', 0)))
                cost_basis = float(holding.get('cost_basis', holding.get('avg_cost', price)))
                
                # Calculate holding metrics
                market_value = shares * price
                cost_value = shares * cost_basis
                unrealized_gain_loss = market_value - cost_value
                unrealized_return = (unrealized_gain_loss / cost_value * 100) if cost_value > 0 else 0
                
                # Extract additional data if available
                sector = holding.get('sector', 'Unknown')
                industry = holding.get('industry', 'Unknown')
                market_cap = holding.get('market_cap', 0)
                beta = holding.get('beta', 1.0)
                dividend_yield = holding.get('dividend_yield', 0)
                
                # Historical price data for calculations
                price_history = holding.get('price_history', [price])
                if not isinstance(price_history, list) or len(price_history) == 0:
                    price_history = [price]
                
                holdings.append({
                    'symbol': symbol,
                    'shares': shares,
                    'price': price,
                    'cost_basis': cost_basis,
                    'market_value': market_value,
                    'cost_value': cost_value,
                    'unrealized_gain_loss': unrealized_gain_loss,
                    'unrealized_return': unrealized_return,
                    'sector': sector,
                    'industry': industry,
                    'market_cap': market_cap,
                    'beta': beta,
                    'dividend_yield': dividend_yield,
                    'price_history': price_history,
                    'volatility': calculate_holding_volatility(price_history),
                    'weight': 0  # Will be calculated later
                })
        
        # Calculate portfolio weights
        total_market_value = sum(h['market_value'] for h in holdings)
        if total_market_value > 0:
            for holding in holdings:
                holding['weight'] = (holding['market_value'] / total_market_value) * 100
        
        return holdings
        
    except Exception as e:
        return []

def calculate_holding_volatility(price_history):
    """Calculate volatility for individual holding"""
    try:
        if len(price_history) < 2:
            return 0
        
        prices = pd.Series(price_history, dtype=float)
        returns = prices.pct_change().dropna()
        
        if len(returns) == 0:
            return 0
        
        daily_vol = returns.std()
        annual_vol = daily_vol * np.sqrt(252)  # Annualized
        
        return annual_vol
        
    except Exception:
        return 0

def calculate_performance_metrics(holdings):
    """Calculate portfolio performance metrics"""
    try:
        if not holdings:
            return {
                'total_market_value': 0,
                'total_cost_basis': 0,
                'total_unrealized_gain_loss': 0,
                'total_return_percent': 0,
                'top_performers': [],
                'worst_performers': []
            }
        
        # Portfolio totals
        total_market_value = sum(h['market_value'] for h in holdings)
        total_cost_basis = sum(h['cost_value'] for h in holdings)
        total_unrealized_gain_loss = total_market_value - total_cost_basis
        total_return_percent = (total_unrealized_gain_loss / total_cost_basis * 100) if total_cost_basis > 0 else 0
        
        # Sort holdings by performance
        holdings_by_return = sorted(holdings, key=lambda x: x['unrealized_return'], reverse=True)
        
        # Top and worst performers
        top_performers = [
            {
                'symbol': h['symbol'],
                'return_percent': round(h['unrealized_return'], 2),
                'gain_loss': round(h['unrealized_gain_loss'], 2),
                'weight': round(h['weight'], 2)
            }
            for h in holdings_by_return[:5]
        ]
        
        worst_performers = [
            {
                'symbol': h['symbol'],
                'return_percent': round(h['unrealized_return'], 2),
                'gain_loss': round(h['unrealized_gain_loss'], 2),
                'weight': round(h['weight'], 2)
            }
            for h in holdings_by_return[-5:]
        ]
        
        # Calculate weighted average metrics
        weighted_beta = sum(h['beta'] * h['weight'] / 100 for h in holdings) if holdings else 1.0
        weighted_dividend_yield = sum(h['dividend_yield'] * h['weight'] / 100 for h in holdings) if holdings else 0
        
        return {
            'total_market_value': round(total_market_value, 2),
            'total_cost_basis': round(total_cost_basis, 2),
            'total_unrealized_gain_loss': round(total_unrealized_gain_loss, 2),
            'total_return_percent': round(total_return_percent, 2),
            'weighted_beta': round(weighted_beta, 3),
            'weighted_dividend_yield': round(weighted_dividend_yield, 3),
            'number_of_holdings': len(holdings),
            'top_performers': top_performers,
            'worst_performers': worst_performers
        }
        
    except Exception as e:
        return {
            'error': f'Performance calculation failed: {str(e)}',
            'total_market_value': 0,
            'total_return_percent': 0
        }

def calculate_risk_metrics(holdings):
    """Calculate portfolio risk metrics"""
    try:
        if not holdings:
            return {
                'portfolio_volatility': 0,
                'value_at_risk': 0,
                'maximum_drawdown': 0,
                'risk_metrics': {}
            }
        
        # Calculate portfolio volatility
        portfolio_volatility = calculate_portfolio_volatility(holdings)
        
        # Value at Risk (95% confidence)
        portfolio_value = sum(h['market_value'] for h in holdings)
        var_95 = portfolio_value * portfolio_volatility * 1.645 / np.sqrt(252)  # 1-day VaR
        
        # Risk concentration
        concentration_risk = calculate_concentration_risk(holdings)
        
        # Beta analysis
        beta_analysis = analyze_portfolio_beta(holdings)
        
        # Sector risk
        sector_risk = analyze_sector_risk(holdings)
        
        # Calculate maximum potential loss (largest holding volatility impact)
        max_single_holding_risk = max(
            h['market_value'] * h['volatility'] * 2 for h in holdings  # 2 std dev
        ) if holdings else 0
        
        return {
            'portfolio_volatility': round(portfolio_volatility, 4),
            'portfolio_volatility_percent': round(portfolio_volatility * 100, 2),
            'value_at_risk_1day': round(var_95, 2),
            'value_at_risk_percent': round(var_95 / portfolio_value * 100, 2) if portfolio_value > 0 else 0,
            'concentration_risk': concentration_risk,
            'beta_analysis': beta_analysis,
            'sector_risk': sector_risk,
            'max_single_holding_risk': round(max_single_holding_risk, 2),
            'risk_score': calculate_overall_risk_score(portfolio_volatility, concentration_risk, sector_risk)
        }
        
    except Exception as e:
        return {
            'error': f'Risk calculation failed: {str(e)}',
            'portfolio_volatility': 0,
            'value_at_risk': 0
        }

def calculate_portfolio_volatility(holdings):
    """Calculate portfolio-level volatility"""
    try:
        if not holdings:
            return 0
        
        # Simplified portfolio volatility calculation
        # In practice, you'd need correlation matrix between holdings
        
        weights = np.array([h['weight'] / 100 for h in holdings])
        volatilities = np.array([h['volatility'] for h in holdings])
        
        # Simplified calculation assuming 0.3 average correlation
        avg_correlation = 0.3
        
        # Portfolio variance calculation
        portfolio_variance = 0
        
        # Individual variances
        for i, w_i in enumerate(weights):
            portfolio_variance += (w_i * volatilities[i]) ** 2
        
        # Covariance terms (simplified)
        for i, w_i in enumerate(weights):
            for j, w_j in enumerate(weights):
                if i != j:
                    portfolio_variance += w_i * w_j * volatilities[i] * volatilities[j] * avg_correlation
        
        portfolio_volatility = np.sqrt(portfolio_variance)
        
        return portfolio_volatility
        
    except Exception:
        return 0

def calculate_concentration_risk(holdings):
    """Calculate portfolio concentration risk"""
    try:
        if not holdings:
            return {'score': 0, 'level': 'unknown'}
        
        weights = [h['weight'] for h in holdings]
        
        # Herfindahl-Hirschman Index (HHI)
        hhi = sum(w**2 for w in weights)
        
        # Single largest holding
        max_weight = max(weights)
        
        # Top 3 holdings concentration
        top_3_weights = sorted(weights, reverse=True)[:3]
        top_3_concentration = sum(top_3_weights)
        
        # Concentration score (0-100, higher = more concentrated)
        concentration_score = min(100, hhi / 100 + max_weight)
        
        # Risk level
        if concentration_score > 70:
            risk_level = 'high'
        elif concentration_score > 40:
            risk_level = 'moderate'
        else:
            risk_level = 'low'
        
        return {
            'hhi_index': round(hhi, 1),
            'max_single_weight': round(max_weight, 1),
            'top_3_concentration': round(top_3_concentration, 1),
            'concentration_score': round(concentration_score, 1),
            'risk_level': risk_level
        }
        
    except Exception as e:
        return {
            'error': f'Concentration risk calculation failed: {str(e)}',
            'score': 0,
            'level': 'unknown'
        }

def analyze_portfolio_beta(holdings):
    """Analyze portfolio beta characteristics"""
    try:
        if not holdings:
            return {'weighted_beta': 1.0, 'beta_distribution': {}}
        
        # Weighted portfolio beta
        weighted_beta = sum(h['beta'] * h['weight'] / 100 for h in holdings)
        
        # Beta distribution
        high_beta_weight = sum(h['weight'] for h in holdings if h['beta'] > 1.2)
        low_beta_weight = sum(h['weight'] for h in holdings if h['beta'] < 0.8)
        neutral_beta_weight = 100 - high_beta_weight - low_beta_weight
        
        # Beta risk assessment
        if weighted_beta > 1.3:
            beta_risk = 'high'
        elif weighted_beta < 0.7:
            beta_risk = 'low'
        else:
            beta_risk = 'moderate'
        
        return {
            'weighted_beta': round(weighted_beta, 3),
            'beta_risk': beta_risk,
            'high_beta_allocation': round(high_beta_weight, 1),
            'low_beta_allocation': round(low_beta_weight, 1),
            'neutral_beta_allocation': round(neutral_beta_weight, 1)
        }
        
    except Exception as e:
        return {
            'error': f'Beta analysis failed: {str(e)}',
            'weighted_beta': 1.0
        }

def analyze_sector_risk(holdings):
    """Analyze sector concentration and risk"""
    try:
        if not holdings:
            return {'sector_concentration': {}, 'risk_level': 'unknown'}
        
        # Group by sector
        sector_weights = {}
        for holding in holdings:
            sector = holding['sector']
            sector_weights[sector] = sector_weights.get(sector, 0) + holding['weight']
        
        # Find largest sector exposure
        max_sector_weight = max(sector_weights.values()) if sector_weights else 0
        
        # Count sectors
        num_sectors = len(sector_weights)
        
        # Sector concentration risk
        if max_sector_weight > 50:
            concentration_risk = 'high'
        elif max_sector_weight > 30:
            concentration_risk = 'moderate'
        else:
            concentration_risk = 'low'
        
        # Diversification score
        if num_sectors >= 8:
            diversification = 'high'
        elif num_sectors >= 5:
            diversification = 'moderate'
        else:
            diversification = 'low'
        
        return {
            'sector_weights': {k: round(v, 1) for k, v in sector_weights.items()},
            'max_sector_weight': round(max_sector_weight, 1),
            'num_sectors': num_sectors,
            'concentration_risk': concentration_risk,
            'diversification_level': diversification
        }
        
    except Exception as e:
        return {
            'error': f'Sector risk analysis failed: {str(e)}',
            'sector_concentration': {},
            'risk_level': 'unknown'
        }

def calculate_diversification_metrics(holdings):
    """Calculate portfolio diversification metrics"""
    try:
        if not holdings:
            return {'diversification_score': 0, 'recommendations': []}
        
        # Number of holdings
        num_holdings = len(holdings)
        
        # Sector diversification
        sectors = set(h['sector'] for h in holdings)
        num_sectors = len(sectors)
        
        # Market cap diversification
        large_cap_weight = sum(h['weight'] for h in holdings if h['market_cap'] > 10_000_000_000)
        mid_cap_weight = sum(h['weight'] for h in holdings if 2_000_000_000 <= h['market_cap'] <= 10_000_000_000)
        small_cap_weight = sum(h['weight'] for h in holdings if h['market_cap'] < 2_000_000_000)
        
        # Weight distribution analysis
        weights = [h['weight'] for h in holdings]
        weight_std = np.std(weights)
        
        # Calculate diversification score (0-100)
        diversification_score = 0
        
        # Holdings count score (max 25 points)
        if num_holdings >= 20:
            diversification_score += 25
        elif num_holdings >= 15:
            diversification_score += 20
        elif num_holdings >= 10:
            diversification_score += 15
        else:
            diversification_score += max(0, num_holdings * 1.5)
        
        # Sector diversification score (max 25 points)
        if num_sectors >= 8:
            diversification_score += 25
        elif num_sectors >= 6:
            diversification_score += 20
        elif num_sectors >= 4:
            diversification_score += 15
        else:
            diversification_score += max(0, num_sectors * 5)
        
        # Weight distribution score (max 25 points)
        if weight_std < 3:  # Very even distribution
            diversification_score += 25
        elif weight_std < 5:
            diversification_score += 20
        elif weight_std < 8:
            diversification_score += 15
        else:
            diversification_score += max(0, 25 - weight_std)
        
        # Market cap diversification score (max 25 points)
        cap_diversity_score = 0
        if large_cap_weight > 0:
            cap_diversity_score += 10
        if mid_cap_weight > 0:
            cap_diversity_score += 10
        if small_cap_weight > 0:
            cap_diversity_score += 5
        
        diversification_score += cap_diversity_score
        
        # Ensure score is within bounds
        diversification_score = max(0, min(100, diversification_score))
        
        # Generate recommendations
        recommendations = generate_diversification_recommendations(
            num_holdings, num_sectors, weight_std, large_cap_weight, 
            mid_cap_weight, small_cap_weight, diversification_score
        )
        
        return {
            'diversification_score': round(diversification_score, 1),
            'num_holdings': num_holdings,
            'num_sectors': num_sectors,
            'weight_distribution_std': round(weight_std, 2),
            'market_cap_allocation': {
                'large_cap': round(large_cap_weight, 1),
                'mid_cap': round(mid_cap_weight, 1),
                'small_cap': round(small_cap_weight, 1)
            },
            'recommendations': recommendations
        }
        
    except Exception as e:
        return {
            'error': f'Diversification calculation failed: {str(e)}',
            'diversification_score': 0,
            'recommendations': []
        }

def generate_diversification_recommendations(num_holdings, num_sectors, weight_std, 
                                           large_cap, mid_cap, small_cap, score):
    """Generate diversification recommendations"""
    recommendations = []
    
    if num_holdings < 15:
        recommendations.append(f"Consider adding more holdings (currently {num_holdings}, target 15-25)")
    
    if num_sectors < 6:
        recommendations.append(f"Increase sector diversification (currently {num_sectors}, target 6-8)")
    
    if weight_std > 8:
        recommendations.append("Consider more even position sizing to reduce concentration risk")
    
    if large_cap < 50:
        recommendations.append("Consider increasing large-cap allocation for stability")
    
    if mid_cap < 10:
        recommendations.append("Consider adding mid-cap exposure for growth potential")
    
    if small_cap > 20:
        recommendations.append("Consider reducing small-cap allocation to manage risk")
    
    if score < 50:
        recommendations.append("Overall diversification below optimal - review portfolio structure")
    
    if not recommendations:
        recommendations.append("Portfolio shows good diversification characteristics")
    
    return recommendations

def analyze_portfolio_optimization(holdings):
    """Analyze portfolio optimization opportunities"""
    try:
        if not holdings or len(holdings) < 2:
            return {
                'current_sharpe_ratio': 0,
                'optimization_potential': 'insufficient_data',
                'rebalancing_suggestions': []
            }
        
        # Calculate current portfolio metrics
        weights = np.array([h['weight'] / 100 for h in holdings])
        returns = np.array([h['unrealized_return'] / 100 for h in holdings])
        volatilities = np.array([h['volatility'] for h in holdings])
        
        # Current portfolio return and risk
        portfolio_return = np.sum(weights * returns)
        portfolio_volatility = calculate_portfolio_volatility(holdings)
        
        # Current Sharpe ratio (assuming 2% risk-free rate)
        risk_free_rate = 0.02
        current_sharpe = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Identify rebalancing opportunities
        rebalancing_suggestions = identify_rebalancing_opportunities(holdings)
        
        # Risk-return efficiency analysis
        efficiency_analysis = analyze_risk_return_efficiency(holdings)
        
        return {
            'current_sharpe_ratio': round(current_sharpe, 3),
            'current_return': round(portfolio_return * 100, 2),
            'current_volatility': round(portfolio_volatility * 100, 2),
            'efficiency_analysis': efficiency_analysis,
            'rebalancing_suggestions': rebalancing_suggestions,
            'optimization_score': calculate_optimization_score(current_sharpe, efficiency_analysis)
        }
        
    except Exception as e:
        return {
            'error': f'Portfolio optimization analysis failed: {str(e)}',
            'current_sharpe_ratio': 0,
            'optimization_potential': 'analysis_failed'
        }

def identify_rebalancing_opportunities(holdings):
    """Identify portfolio rebalancing opportunities"""
    try:
        suggestions = []
        
        # Sort by weight
        holdings_by_weight = sorted(holdings, key=lambda x: x['weight'], reverse=True)
        
        # Check for overweight positions
        for holding in holdings_by_weight[:5]:  # Top 5 positions
            if holding['weight'] > 15:  # More than 15% in single position
                suggestions.append({
                    'action': 'reduce',
                    'symbol': holding['symbol'],
                    'current_weight': round(holding['weight'], 1),
                    'suggested_weight': 10.0,
                    'reason': 'Position size concentration risk'
                })
        
        # Check for underweight high performers
        top_performers = sorted(holdings, key=lambda x: x['unrealized_return'], reverse=True)[:3]
        for holding in top_performers:
            if holding['weight'] < 5 and holding['unrealized_return'] > 10:
                suggestions.append({
                    'action': 'increase',
                    'symbol': holding['symbol'],
                    'current_weight': round(holding['weight'], 1),
                    'suggested_weight': 7.0,
                    'reason': f'Strong performer with low allocation (+{holding["unrealized_return"]:.1f}%)'
                })
        
        # Check for poor performers with high allocation
        worst_performers = sorted(holdings, key=lambda x: x['unrealized_return'])[:3]
        for holding in worst_performers:
            if holding['weight'] > 8 and holding['unrealized_return'] < -15:
                suggestions.append({
                    'action': 'reduce',
                    'symbol': holding['symbol'],
                    'current_weight': round(holding['weight'], 1),
                    'suggested_weight': 5.0,
                    'reason': f'Poor performer with high allocation ({holding["unrealized_return"]:.1f}%)'
                })
        
        return suggestions[:5]  # Return top 5 suggestions
        
    except Exception:
        return []

def analyze_risk_return_efficiency(holdings):
    """Analyze risk-return efficiency of holdings"""
    try:
        efficient_holdings = []
        inefficient_holdings = []
        
        for holding in holdings:
            # Risk-adjusted return (simple Sharpe-like ratio)
            risk_adjusted_return = holding['unrealized_return'] / (holding['volatility'] * 100) if holding['volatility'] > 0 else 0
            
            holding_analysis = {
                'symbol': holding['symbol'],
                'return': holding['unrealized_return'],
                'volatility': holding['volatility'] * 100,
                'risk_adjusted_return': round(risk_adjusted_return, 3),
                'weight': holding['weight']
            }
            
            if risk_adjusted_return > 0.5:  # Arbitrary threshold
                efficient_holdings.append(holding_analysis)
            else:
                inefficient_holdings.append(holding_analysis)
        
        return {
            'efficient_holdings': sorted(efficient_holdings, key=lambda x: x['risk_adjusted_return'], reverse=True),
            'inefficient_holdings': sorted(inefficient_holdings, key=lambda x: x['risk_adjusted_return']),
            'efficiency_ratio': len(efficient_holdings) / len(holdings) if holdings else 0
        }
        
    except Exception as e:
        return {
            'error': f'Efficiency analysis failed: {str(e)}',
            'efficient_holdings': [],
            'inefficient_holdings': []
        }

def calculate_optimization_score(sharpe_ratio, efficiency_analysis):
    """Calculate overall portfolio optimization score"""
    try:
        score = 50  # Base score
        
        # Sharpe ratio contribution (max 30 points)
        if sharpe_ratio > 1.5:
            score += 30
        elif sharpe_ratio > 1.0:
            score += 20
        elif sharpe_ratio > 0.5:
            score += 10
        elif sharpe_ratio < 0:
            score -= 10
        
        # Efficiency ratio contribution (max 20 points)
        efficiency_ratio = efficiency_analysis.get('efficiency_ratio', 0)
        score += efficiency_ratio * 20
        
        return max(0, min(100, round(score, 1)))
        
    except Exception:
        return 50

def calculate_risk_adjusted_metrics(performance_metrics, risk_metrics):
    """Calculate risk-adjusted performance metrics"""
    try:
        total_return = performance_metrics.get('total_return_percent', 0)
        portfolio_volatility = risk_metrics.get('portfolio_volatility_percent', 1)
        
        # Sharpe ratio (assuming 2% risk-free rate)
        risk_free_rate = 2.0
        sharpe_ratio = (total_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Sortino ratio (downside deviation)
        # Simplified calculation
        sortino_ratio = sharpe_ratio * 1.2 if total_return > 0 else sharpe_ratio * 0.8
        
        # Risk-adjusted return
        risk_adjusted_return = total_return / (1 + portfolio_volatility / 100)
        
        return {
            'sharpe_ratio': round(sharpe_ratio, 3),
            'sortino_ratio': round(sortino_ratio, 3),
            'risk_adjusted_return': round(risk_adjusted_return, 2),
            'return_per_unit_risk': round(total_return / portfolio_volatility, 2) if portfolio_volatility > 0 else 0
        }
        
    except Exception as e:
        return {
            'error': f'Risk-adjusted metrics calculation failed: {str(e)}',
            'sharpe_ratio': 0,
            'sortino_ratio': 0
        }

def calculate_overall_risk_score(volatility, concentration_risk, sector_risk):
    """Calculate overall portfolio risk score (1-10, higher = more risky)"""
    try:
        risk_score = 5  # Base risk
        
        # Volatility contribution
        vol_percent = volatility * 100
        if vol_percent > 25:
            risk_score += 2
        elif vol_percent > 20:
            risk_score += 1
        elif vol_percent < 10:
            risk_score -= 1
        
        # Concentration risk contribution
        concentration_level = concentration_risk.get('risk_level', 'moderate')
        if concentration_level == 'high':
            risk_score += 2
        elif concentration_level == 'low':
            risk_score -= 1
        
        # Sector risk contribution
        sector_concentration = sector_risk.get('concentration_risk', 'moderate')
        if sector_concentration == 'high':
            risk_score += 1
        elif sector_concentration == 'low':
            risk_score -= 1
        
        return max(1, min(10, risk_score))
        
    except Exception:
        return 5

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python portfolio_metrics.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract portfolio data
        portfolio_data = input_data.get('portfolio_data', input_data.get('holdings', []))
        
        # Perform analysis
        result = calculate_portfolio_metrics(portfolio_data)
        
        # Output result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': f'Portfolio metrics analysis failed: {str(e)}',
            'metrics': {},
            'risk_analysis': {},
            'optimization': {}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
