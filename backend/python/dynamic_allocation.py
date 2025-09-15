#!/usr/bin/env python3
"""
Dynamic Asset Allocation Service for Portfolio AI
Implements regime-aware portfolio optimization and dynamic allocation
Part of Phase 5: AI-Powered Investment Intelligence
"""

import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from scipy.optimize import minimize, differential_evolution
    from scipy.stats import norm
    import cvxpy as cp  # For convex optimization (optional)
    CVXPY_AVAILABLE = True
except ImportError:
    CVXPY_AVAILABLE = False
    print(json.dumps({"warning": "CVXPY not available - using scipy optimization only"}))

class DynamicAllocationService:
    def __init__(self):
        # Risk tolerance levels by regime
        self.regime_risk_adjustments = {
            'Bull': 1.1,      # Increase risk in bull markets
            'Bear': 0.6,      # Decrease risk in bear markets
            'Volatile': 0.7,  # Conservative in volatile markets
            'Stable': 1.0     # Normal risk in stable markets
        }
        
        # Allocation bounds and constraints
        self.allocation_constraints = {
            'min_weight': 0.0,     # Minimum weight per asset
            'max_weight': 0.4,     # Maximum weight per asset (concentration limit)
            'max_turnover': 0.2,   # Maximum portfolio turnover per rebalancing
            'min_diversification': 3,  # Minimum number of positions
            'cash_buffer': 0.05    # Minimum cash position
        }
        
        # Risk parameters
        self.risk_params = {
            'target_volatility': 0.15,    # 15% annual volatility target
            'max_drawdown': 0.10,         # 10% maximum drawdown limit
            'var_confidence': 0.05,       # 5% VaR confidence level
            'rebalancing_threshold': 0.05  # 5% drift threshold for rebalancing
        }

    def calculate_dynamic_allocation(self, input_data):
        """
        Main method to calculate regime-aware dynamic asset allocation
        """
        try:
            current_weights = input_data.get('current_weights', {})
            market_regime = input_data.get('market_regime', 'Stable')
            regime_confidence = input_data.get('regime_confidence', 0.7)
            ml_predictions = input_data.get('ml_predictions', {})
            risk_adjustment = input_data.get('risk_adjustment', 1.0)
            portfolio_data = input_data.get('portfolio_data', {})
            
            print(f"⚖️ Calculating dynamic allocation for {market_regime} regime...")
            
            # Validate inputs
            if not current_weights:
                return {"error": "No current weights provided"}
            
            # Extract symbols and prepare data
            symbols = list(current_weights.keys())
            
            # Get expected returns from ML predictions
            expected_returns = self.extract_expected_returns(ml_predictions, symbols)
            
            # Estimate covariance matrix
            covariance_matrix = self.estimate_covariance_matrix(symbols, ml_predictions)
            
            # Apply regime-based risk adjustment
            adjusted_risk_target = self.calculate_adjusted_risk_target(market_regime, regime_confidence)
            
            # Calculate optimal allocation using multiple methods
            optimization_results = self.optimize_portfolio_allocation(
                symbols, expected_returns, covariance_matrix, current_weights, adjusted_risk_target
            )
            
            # Apply regime-specific tilts
            regime_adjusted_weights = self.apply_regime_tilts(
                optimization_results['optimal_weights'], market_regime, regime_confidence
            )
            
            # Validate and constrain allocation
            final_weights = self.apply_allocation_constraints(
                regime_adjusted_weights, current_weights, symbols
            )
            
            # Calculate expected portfolio metrics
            portfolio_metrics = self.calculate_portfolio_metrics(
                final_weights, expected_returns, covariance_matrix
            )
            
            # Generate regime justification
            regime_justification = self.generate_regime_justification(
                market_regime, current_weights, final_weights, regime_confidence
            )
            
            # Calculate Sharpe ratio improvement
            sharpe_improvement = self.calculate_sharpe_improvement(
                current_weights, final_weights, expected_returns, covariance_matrix
            )
            
            return {
                "success": True,
                "optimal_weights": final_weights,
                "expected_return": portfolio_metrics['expected_return'],
                "expected_risk": portfolio_metrics['expected_risk'],
                "sharpe_ratio": portfolio_metrics['sharpe_ratio'],
                "sharpe_improvement": sharpe_improvement,
                "regime_justification": regime_justification,
                "optimization_method": optimization_results['method'],
                "allocation_changes": self.calculate_allocation_changes(current_weights, final_weights),
                "risk_metrics": self.calculate_risk_metrics(final_weights, covariance_matrix),
                "rebalancing_needed": self.check_rebalancing_needed(current_weights, final_weights),
                "regime_adjustments": {
                    "market_regime": market_regime,
                    "risk_adjustment": adjusted_risk_target,
                    "regime_confidence": regime_confidence
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error in dynamic allocation: {str(e)}")
            return self.generate_fallback_allocation(current_weights, market_regime)

    def extract_expected_returns(self, ml_predictions, symbols):
        """
        Extract expected returns from ML predictions
        """
        try:
            expected_returns = {}
            
            # Get predictions for different time horizons
            predictions = ml_predictions.get('predictions', {})
            
            for symbol in symbols:
                symbol_returns = []
                
                # Extract returns from different prediction horizons
                for horizon, horizon_predictions in predictions.items():
                    if symbol in horizon_predictions:
                        pred_data = horizon_predictions[symbol]
                        expected_return = pred_data.get('expected_return', 0.08)  # Default 8% annual
                        
                        # Adjust for prediction horizon
                        if 'd' in horizon:
                            days = int(horizon.replace('d', ''))
                            annual_return = expected_return * (252 / days)  # Annualize
                        else:
                            annual_return = expected_return
                        
                        symbol_returns.append(annual_return)
                
                # Average across horizons or use default
                if symbol_returns:
                    expected_returns[symbol] = np.mean(symbol_returns)
                else:
                    # Default expected return based on asset class
                    expected_returns[symbol] = self.get_default_expected_return(symbol)
            
            return expected_returns
            
        except Exception as e:
            print(f"⚠️ Error extracting expected returns: {str(e)}")
            return {symbol: 0.08 for symbol in symbols}  # Default 8% for all

    def get_default_expected_return(self, symbol):
        """
        Get default expected return based on asset type
        """
        # Simple heuristics based on symbol patterns
        if any(bond in symbol.upper() for bond in ['TLT', 'BND', 'AGG', 'IEF']):
            return 0.03  # 3% for bonds
        elif any(growth in symbol.upper() for growth in ['QQQ', 'TQQQ', 'SOXL', 'ARKK']):
            return 0.12  # 12% for growth/tech
        elif any(value in symbol.upper() for value in ['VTV', 'IVE', 'VXUS']):
            return 0.09  # 9% for value
        elif any(commodity in symbol.upper() for commodity in ['GLD', 'SLV', 'USO', 'DBC']):
            return 0.05  # 5% for commodities
        else:
            return 0.08  # 8% default for equities

    def estimate_covariance_matrix(self, symbols, ml_predictions):
        """
        Estimate covariance matrix for portfolio optimization
        """
        try:
            n_assets = len(symbols)
            
            # In production, this would use historical price data
            # For now, create a realistic covariance matrix based on asset correlations
            
            # Default volatilities by asset type
            volatilities = {}
            for symbol in symbols:
                if any(bond in symbol.upper() for bond in ['TLT', 'BND', 'AGG']):
                    volatilities[symbol] = 0.05  # 5% volatility for bonds
                elif any(growth in symbol.upper() for growth in ['QQQ', 'TQQQ', 'ARKK']):
                    volatilities[symbol] = 0.25  # 25% volatility for growth
                elif any(commodity in symbol.upper() for commodity in ['GLD', 'USO']):
                    volatilities[symbol] = 0.20  # 20% volatility for commodities
                else:
                    volatilities[symbol] = 0.18  # 18% default volatility
            
            # Create correlation matrix with realistic correlations
            correlation_matrix = np.eye(n_assets)
            
            for i in range(n_assets):
                for j in range(i + 1, n_assets):
                    symbol_i, symbol_j = symbols[i], symbols[j]
                    
                    # Estimate correlation based on asset classes
                    correlation = self.estimate_asset_correlation(symbol_i, symbol_j)
                    correlation_matrix[i, j] = correlation
                    correlation_matrix[j, i] = correlation
            
            # Convert to covariance matrix
            vol_vector = np.array([volatilities[symbol] for symbol in symbols])
            covariance_matrix = np.outer(vol_vector, vol_vector) * correlation_matrix
            
            # Ensure positive semi-definite
            eigenvalues, eigenvectors = np.linalg.eigh(covariance_matrix)
            eigenvalues = np.maximum(eigenvalues, 1e-8)  # Floor eigenvalues
            covariance_matrix = eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T
            
            return covariance_matrix
            
        except Exception as e:
            print(f"⚠️ Error estimating covariance matrix: {str(e)}")
            # Return diagonal matrix as fallback
            n_assets = len(symbols)
            return np.eye(n_assets) * 0.18**2  # 18% volatility for all assets

    def estimate_asset_correlation(self, symbol1, symbol2):
        """
        Estimate correlation between two assets based on their characteristics
        """
        # Asset class mappings
        equity_symbols = ['SPY', 'QQQ', 'IWM', 'VTI', 'AAPL', 'MSFT', 'GOOGL']
        bond_symbols = ['TLT', 'BND', 'AGG', 'IEF', 'SHY']
        commodity_symbols = ['GLD', 'SLV', 'USO', 'DBC']
        international_symbols = ['EFA', 'EEM', 'VEA', 'VWO']
        
        # Check asset classes
        s1_equity = any(eq in symbol1.upper() for eq in equity_symbols)
        s2_equity = any(eq in symbol2.upper() for eq in equity_symbols)
        
        s1_bond = any(bond in symbol1.upper() for bond in bond_symbols)
        s2_bond = any(bond in symbol2.upper() for bond in bond_symbols)
        
        s1_commodity = any(comm in symbol1.upper() for comm in commodity_symbols)
        s2_commodity = any(comm in symbol2.upper() for comm in commodity_symbols)
        
        s1_intl = any(intl in symbol1.upper() for intl in international_symbols)
        s2_intl = any(intl in symbol2.upper() for intl in international_symbols)
        
        # Correlation rules
        if s1_equity and s2_equity:
            if s1_intl or s2_intl:
                return 0.7  # US-International equity correlation
            else:
                return 0.85  # US equity correlation
        elif s1_bond and s2_bond:
            return 0.8  # Bond correlation
        elif s1_commodity and s2_commodity:
            return 0.6  # Commodity correlation
        elif (s1_equity and s2_bond) or (s1_bond and s2_equity):
            return -0.2  # Stock-bond negative correlation
        elif (s1_equity and s2_commodity) or (s1_commodity and s2_equity):
            return 0.3  # Stock-commodity correlation
        elif (s1_bond and s2_commodity) or (s1_commodity and s2_bond):
            return 0.1  # Bond-commodity correlation
        else:
            return 0.5  # Default moderate correlation

    def calculate_adjusted_risk_target(self, market_regime, regime_confidence):
        """
        Calculate risk target adjusted for market regime
        """
        try:
            base_risk = self.risk_params['target_volatility']
            regime_adjustment = self.regime_risk_adjustments.get(market_regime, 1.0)
            
            # Adjust based on regime confidence
            confidence_adjustment = 1.0 + (regime_confidence - 0.5) * 0.4
            
            adjusted_risk = base_risk * regime_adjustment * confidence_adjustment
            
            # Apply bounds
            min_risk = base_risk * 0.5  # Minimum 50% of base risk
            max_risk = base_risk * 1.5  # Maximum 150% of base risk
            
            return max(min_risk, min(max_risk, adjusted_risk))
            
        except Exception as e:
            print(f"⚠️ Error calculating adjusted risk target: {str(e)}")
            return self.risk_params['target_volatility']

    def optimize_portfolio_allocation(self, symbols, expected_returns, covariance_matrix, current_weights, risk_target):
        """
        Optimize portfolio allocation using multiple methods
        """
        try:
            n_assets = len(symbols)
            
            # Convert to arrays
            mu = np.array([expected_returns[symbol] for symbol in symbols])
            sigma = covariance_matrix
            current_w = np.array([current_weights.get(symbol, 0) for symbol in symbols])
            
            # Method 1: Mean-Variance Optimization (Markowitz)
            mv_weights = self.mean_variance_optimization(mu, sigma, risk_target)
            
            # Method 2: Risk Parity
            rp_weights = self.risk_parity_optimization(sigma)
            
            # Method 3: Black-Litterman (simplified)
            bl_weights = self.black_litterman_optimization(mu, sigma, current_w)
            
            # Method 4: Minimum Variance
            min_var_weights = self.minimum_variance_optimization(sigma)
            
            # Ensemble the methods based on market conditions
            ensemble_weights = self.ensemble_optimization_methods(
                mv_weights, rp_weights, bl_weights, min_var_weights, symbols
            )
            
            return {
                'optimal_weights': dict(zip(symbols, ensemble_weights)),
                'method': 'ensemble',
                'individual_methods': {
                    'mean_variance': dict(zip(symbols, mv_weights)),
                    'risk_parity': dict(zip(symbols, rp_weights)),
                    'black_litterman': dict(zip(symbols, bl_weights)),
                    'minimum_variance': dict(zip(symbols, min_var_weights))
                }
            }
            
        except Exception as e:
            print(f"⚠️ Error in portfolio optimization: {str(e)}")
            # Return equal weights as fallback
            equal_weights = np.ones(len(symbols)) / len(symbols)
            return {
                'optimal_weights': dict(zip(symbols, equal_weights)),
                'method': 'equal_weight_fallback'
            }

    def mean_variance_optimization(self, mu, sigma, risk_target):
        """
        Markowitz mean-variance optimization
        """
        try:
            n_assets = len(mu)
            
            # Objective: maximize return for given risk target
            def objective(weights):
                portfolio_return = np.dot(weights, mu)
                portfolio_risk = np.sqrt(np.dot(weights, np.dot(sigma, weights)))
                
                # Penalty for deviating from risk target
                risk_penalty = 100 * (portfolio_risk - risk_target)**2
                
                return -portfolio_return + risk_penalty
            
            # Constraints
            constraints = [
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # Weights sum to 1
            ]
            
            # Bounds
            bounds = [(self.allocation_constraints['min_weight'], 
                      self.allocation_constraints['max_weight']) for _ in range(n_assets)]
            
            # Initial guess (equal weights)
            x0 = np.ones(n_assets) / n_assets
            
            # Optimize
            result = minimize(objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
            
            if result.success:
                return result.x
            else:
                print("⚠️ Mean-variance optimization failed, using equal weights")
                return np.ones(n_assets) / n_assets
                
        except Exception as e:
            print(f"⚠️ Error in mean-variance optimization: {str(e)}")
            return np.ones(len(mu)) / len(mu)

    def risk_parity_optimization(self, sigma):
        """
        Risk parity optimization (equal risk contribution)
        """
        try:
            n_assets = sigma.shape[0]
            
            def risk_budget_objective(weights):
                portfolio_vol = np.sqrt(np.dot(weights, np.dot(sigma, weights)))
                marginal_contrib = np.dot(sigma, weights) / portfolio_vol
                contrib = weights * marginal_contrib
                
                # Risk parity: each asset should contribute equally to total risk
                target_contrib = portfolio_vol / n_assets
                return np.sum((contrib - target_contrib) ** 2)
            
            # Constraints
            constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
            
            # Bounds
            bounds = [(0.01, self.allocation_constraints['max_weight']) for _ in range(n_assets)]
            
            # Initial guess
            x0 = np.ones(n_assets) / n_assets
            
            # Optimize
            result = minimize(risk_budget_objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
            
            if result.success:
                return result.x
            else:
                return np.ones(n_assets) / n_assets
                
        except Exception as e:
            print(f"⚠️ Error in risk parity optimization: {str(e)}")
            return np.ones(sigma.shape[0]) / sigma.shape[0]

    def black_litterman_optimization(self, mu, sigma, current_weights):
        """
        Simplified Black-Litterman optimization
        """
        try:
            n_assets = len(mu)
            
            # Risk aversion parameter
            risk_aversion = 3.0
            
            # Market implied returns (simplified)
            market_returns = risk_aversion * np.dot(sigma, current_weights)
            
            # Views and confidence (simplified - use ML predictions as views)
            tau = 0.025  # Scaling factor
            omega = tau * sigma  # Uncertainty in views
            
            # Black-Litterman formula (simplified)
            bl_precision = np.linalg.inv(tau * sigma)
            view_precision = np.linalg.inv(omega)
            
            bl_mu = np.linalg.inv(bl_precision + view_precision) @ (
                bl_precision @ market_returns + view_precision @ mu
            )
            
            # Optimize with adjusted returns
            bl_weights = np.linalg.inv(risk_aversion * sigma) @ bl_mu
            
            # Normalize weights
            bl_weights = np.maximum(bl_weights, 0)  # No short selling
            bl_weights = bl_weights / np.sum(bl_weights)
            
            return bl_weights
            
        except Exception as e:
            print(f"⚠️ Error in Black-Litterman optimization: {str(e)}")
            return current_weights

    def minimum_variance_optimization(self, sigma):
        """
        Minimum variance optimization
        """
        try:
            n_assets = sigma.shape[0]
            
            # Objective: minimize portfolio variance
            def objective(weights):
                return np.dot(weights, np.dot(sigma, weights))
            
            # Constraints
            constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
            
            # Bounds
            bounds = [(self.allocation_constraints['min_weight'], 
                      self.allocation_constraints['max_weight']) for _ in range(n_assets)]
            
            # Initial guess
            x0 = np.ones(n_assets) / n_assets
            
            # Optimize
            result = minimize(objective, x0, method='SLSQP', bounds=bounds, constraints=constraints)
            
            if result.success:
                return result.x
            else:
                return np.ones(n_assets) / n_assets
                
        except Exception as e:
            print(f"⚠️ Error in minimum variance optimization: {str(e)}")
            return np.ones(sigma.shape[0]) / sigma.shape[0]

    def ensemble_optimization_methods(self, mv_weights, rp_weights, bl_weights, min_var_weights, symbols):
        """
        Ensemble multiple optimization methods
        """
        try:
            # Weights for different methods based on market conditions
            method_weights = {
                'mean_variance': 0.3,
                'risk_parity': 0.3,
                'black_litterman': 0.2,
                'minimum_variance': 0.2
            }
            
            # Combine methods
            ensemble = (
                method_weights['mean_variance'] * mv_weights +
                method_weights['risk_parity'] * rp_weights +
                method_weights['black_litterman'] * bl_weights +
                method_weights['minimum_variance'] * min_var_weights
            )
            
            # Ensure non-negative and normalized
            ensemble = np.maximum(ensemble, 0)
            ensemble = ensemble / np.sum(ensemble)
            
            return ensemble
            
        except Exception as e:
            print(f"⚠️ Error in ensemble optimization: {str(e)}")
            return np.ones(len(symbols)) / len(symbols)

    def apply_regime_tilts(self, optimal_weights, market_regime, regime_confidence):
        """
        Apply regime-specific tilts to the optimal allocation
        """
        try:
            tilted_weights = optimal_weights.copy()
            
            # Define regime tilts
            regime_tilts = {
                'Bull': {
                    'growth_bias': 0.1,      # Increase growth allocation
                    'reduce_bonds': -0.05,   # Reduce bond allocation
                    'increase_momentum': 0.05 # Favor momentum assets
                },
                'Bear': {
                    'defensive_bias': 0.15,   # Increase defensive allocation
                    'reduce_growth': -0.1,    # Reduce growth allocation
                    'increase_bonds': 0.1,    # Increase bond allocation
                    'add_gold': 0.05         # Add gold/commodities
                },
                'Volatile': {
                    'reduce_concentration': 0.1,  # Increase diversification
                    'add_volatility_hedge': 0.05, # Add VIX/volatility hedge
                    'reduce_leverage': -0.05      # Reduce leveraged positions
                },
                'Stable': {
                    'balanced_approach': 0.0  # Minimal tilts in stable markets
                }
            }
            
            tilts = regime_tilts.get(market_regime, {})
            
            # Apply tilts based on regime confidence
            for symbol, weight in tilted_weights.items():
                symbol_upper = symbol.upper()
                adjustment = 0
                
                # Growth bias (Bull market)
                if 'growth_bias' in tilts and any(growth in symbol_upper for growth in ['QQQ', 'TQQQ', 'ARKK']):
                    adjustment += tilts['growth_bias'] * regime_confidence
                
                # Defensive bias (Bear market)
                if 'defensive_bias' in tilts and any(def_asset in symbol_upper for def_asset in ['TLT', 'GLD', 'VTI']):
                    adjustment += tilts['defensive_bias'] * regime_confidence
                
                # Bond adjustments
                if 'reduce_bonds' in tilts and any(bond in symbol_upper for bond in ['TLT', 'BND', 'AGG']):
                    adjustment += tilts['reduce_bonds'] * regime_confidence
                elif 'increase_bonds' in tilts and any(bond in symbol_upper for bond in ['TLT', 'BND', 'AGG']):
                    adjustment += tilts['increase_bonds'] * regime_confidence
                
                # Apply adjustment
                tilted_weights[symbol] = max(0, weight + adjustment)
            
            # Renormalize weights
            total_weight = sum(tilted_weights.values())
            if total_weight > 0:
                tilted_weights = {symbol: weight / total_weight for symbol, weight in tilted_weights.items()}
            
            return tilted_weights
            
        except Exception as e:
            print(f"⚠️ Error applying regime tilts: {str(e)}")
            return optimal_weights

    def apply_allocation_constraints(self, weights, current_weights, symbols):
        """
        Apply allocation constraints and limits
        """
        try:
            constrained_weights = weights.copy()
            
            # Apply maximum weight constraint
            for symbol in symbols:
                if constrained_weights[symbol] > self.allocation_constraints['max_weight']:
                    constrained_weights[symbol] = self.allocation_constraints['max_weight']
            
            # Apply minimum weight constraint
            for symbol in symbols:
                if constrained_weights[symbol] < self.allocation_constraints['min_weight']:
                    constrained_weights[symbol] = 0.0
            
            # Ensure minimum diversification
            non_zero_positions = sum(1 for w in constrained_weights.values() if w > 0.01)
            if non_zero_positions < self.allocation_constraints['min_diversification']:
                # Force minimum diversification by redistributing weights
                top_symbols = sorted(symbols, key=lambda s: constrained_weights[s], reverse=True)
                min_positions = self.allocation_constraints['min_diversification']
                
                for i, symbol in enumerate(top_symbols[:min_positions]):
                    if constrained_weights[symbol] < 0.05:  # Ensure at least 5% allocation
                        constrained_weights[symbol] = 0.05
            
            # Apply turnover constraint
            total_turnover = sum(abs(constrained_weights[symbol] - current_weights.get(symbol, 0)) 
                               for symbol in symbols)
            
            if total_turnover > self.allocation_constraints['max_turnover']:
                # Scale down changes to meet turnover constraint
                turnover_scale = self.allocation_constraints['max_turnover'] / total_turnover
                
                for symbol in symbols:
                    current_w = current_weights.get(symbol, 0)
                    new_w = constrained_weights[symbol]
                    change = (new_w - current_w) * turnover_scale
                    constrained_weights[symbol] = current_w + change
            
            # Renormalize to ensure weights sum to 1
            total_weight = sum(constrained_weights.values())
            if total_weight > 0:
                constrained_weights = {symbol: weight / total_weight 
                                     for symbol, weight in constrained_weights.items()}
            
            return constrained_weights
            
        except Exception as e:
            print(f"⚠️ Error applying constraints: {str(e)}")
            return weights

    def calculate_portfolio_metrics(self, weights, expected_returns, covariance_matrix):
        """
        Calculate expected portfolio metrics
        """
        try:
            symbols = list(weights.keys())
            w = np.array([weights[symbol] for symbol in symbols])
            mu = np.array([expected_returns[symbol] for symbol in symbols])
            
            # Expected return
            portfolio_return = np.dot(w, mu)
            
            # Expected risk (volatility)
            portfolio_variance = np.dot(w, np.dot(covariance_matrix, w))
            portfolio_risk = np.sqrt(portfolio_variance)
            
            # Sharpe ratio (assuming 2% risk-free rate)
            risk_free_rate = 0.02
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk if portfolio_risk > 0 else 0
            
            return {
                'expected_return': float(portfolio_return),
                'expected_risk': float(portfolio_risk),
                'sharpe_ratio': float(sharpe_ratio),
                'expected_variance': float(portfolio_variance)
            }
            
        except Exception as e:
            print(f"⚠️ Error calculating portfolio metrics: {str(e)}")
            return {
                'expected_return': 0.08,
                'expected_risk': 0.15,
                'sharpe_ratio': 0.4,
                'expected_variance': 0.0225
            }

    def calculate_allocation_changes(self, current_weights, new_weights):
        """
        Calculate allocation changes between current and new weights
        """
        changes = {}
        all_symbols = set(list(current_weights.keys()) + list(new_weights.keys()))
        
        for symbol in all_symbols:
            current = current_weights.get(symbol, 0)
            new = new_weights.get(symbol, 0)
            change = new - current
            
            changes[symbol] = {
                'current_weight': current,
                'new_weight': new,
                'absolute_change': change,
                'relative_change': (change / current) if current > 0 else 0,
                'action': 'BUY' if change > 0.01 else 'SELL' if change < -0.01 else 'HOLD'
            }
        
        return changes

    def calculate_risk_metrics(self, weights, covariance_matrix):
        """
        Calculate comprehensive risk metrics
        """
        try:
            symbols = list(weights.keys())
            w = np.array([weights[symbol] for symbol in symbols])
            
            # Portfolio variance and volatility
            portfolio_var = np.dot(w, np.dot(covariance_matrix, w))
            portfolio_vol = np.sqrt(portfolio_var)
            
            # Value at Risk (VaR) - 5% confidence level
            var_95 = norm.ppf(0.05) * portfolio_vol
            
            # Component VaR (risk contribution by asset)
            marginal_var = np.dot(covariance_matrix, w) / portfolio_vol
            component_var = w * marginal_var
            
            # Diversification ratio
            weighted_avg_vol = np.sum(w * np.sqrt(np.diag(covariance_matrix)))
            diversification_ratio = weighted_avg_vol / portfolio_vol if portfolio_vol > 0 else 1
            
            # Concentration metrics
            herfindahl_index = np.sum(w ** 2)
            effective_assets = 1 / herfindahl_index if herfindahl_index > 0 else len(symbols)
            
            return {
                'portfolio_volatility': float(portfolio_vol),
                'value_at_risk_95': float(var_95),
                'diversification_ratio': float(diversification_ratio),
                'concentration_hhi': float(herfindahl_index),
                'effective_number_assets': float(effective_assets),
                'component_var': {symbol: float(component_var[i]) for i, symbol in enumerate(symbols)}
            }
            
        except Exception as e:
            print(f"⚠️ Error calculating risk metrics: {str(e)}")
            return {
                'portfolio_volatility': 0.15,
                'value_at_risk_95': -0.08,
                'diversification_ratio': 1.2,
                'concentration_hhi': 0.25,
                'effective_number_assets': 4.0
            }

    def check_rebalancing_needed(self, current_weights, new_weights):
        """
        Check if rebalancing is needed based on drift thresholds
        """
        try:
            total_drift = sum(abs(new_weights.get(symbol, 0) - current_weights.get(symbol, 0)) 
                            for symbol in set(list(current_weights.keys()) + list(new_weights.keys())))
            
            threshold = self.risk_params['rebalancing_threshold']
            
            return {
                'rebalancing_needed': total_drift > threshold,
                'total_drift': total_drift,
                'drift_threshold': threshold,
                'drift_percentage': total_drift * 100
            }
            
        except Exception as e:
            print(f"⚠️ Error checking rebalancing: {str(e)}")
            return {'rebalancing_needed': False, 'total_drift': 0.0}

    def calculate_sharpe_improvement(self, current_weights, new_weights, expected_returns, covariance_matrix):
        """
        Calculate Sharpe ratio improvement from rebalancing
        """
        try:
            symbols = list(set(list(current_weights.keys()) + list(new_weights.keys())))
            
            # Current portfolio Sharpe
            current_metrics = self.calculate_portfolio_metrics(current_weights, expected_returns, covariance_matrix)
            current_sharpe = current_metrics['sharpe_ratio']
            
            # New portfolio Sharpe
            new_metrics = self.calculate_portfolio_metrics(new_weights, expected_returns, covariance_matrix)
            new_sharpe = new_metrics['sharpe_ratio']
            
            improvement = new_sharpe - current_sharpe
            
            return {
                'current_sharpe': current_sharpe,
                'new_sharpe': new_sharpe,
                'absolute_improvement': improvement,
                'relative_improvement': (improvement / current_sharpe) if current_sharpe != 0 else 0
            }
            
        except Exception as e:
            print(f"⚠️ Error calculating Sharpe improvement: {str(e)}")
            return {'current_sharpe': 0.4, 'new_sharpe': 0.4, 'absolute_improvement': 0.0}

    def generate_regime_justification(self, market_regime, current_weights, new_weights, regime_confidence):
        """
        Generate justification for regime-based allocation changes
        """
        try:
            justification = {
                'regime': market_regime,
                'confidence': regime_confidence,
                'reasoning': '',
                'key_changes': [],
                'risk_considerations': []
            }
            
            # Calculate major changes
            changes = self.calculate_allocation_changes(current_weights, new_weights)
            major_changes = {symbol: data for symbol, data in changes.items() 
                           if abs(data['absolute_change']) > 0.05}
            
            # Generate regime-specific reasoning
            if market_regime == 'Bull':
                justification['reasoning'] = f"Bull market regime detected with {regime_confidence:.1%} confidence. Increasing risk exposure and growth allocations to capitalize on positive momentum."
                justification['risk_considerations'] = [
                    "Monitor for signs of market exhaustion",
                    "Prepare for potential volatility spikes",
                    "Consider profit-taking thresholds"
                ]
            
            elif market_regime == 'Bear':
                justification['reasoning'] = f"Bear market regime detected with {regime_confidence:.1%} confidence. Reducing risk exposure and increasing defensive allocations to preserve capital."
                justification['risk_considerations'] = [
                    "Focus on capital preservation",
                    "Monitor for oversold conditions",
                    "Prepare for potential bounce opportunities"
                ]
            
            elif market_regime == 'Volatile':
                justification['reasoning'] = f"Volatile market regime detected with {regime_confidence:.1%} confidence. Reducing concentration and adding hedges to manage uncertainty."
                justification['risk_considerations'] = [
                    "Expect continued high volatility",
                    "Reduce position sizes",
                    "Consider volatility hedges"
                ]
            
            else:  # Stable
                justification['reasoning'] = f"Stable market regime detected with {regime_confidence:.1%} confidence. Maintaining balanced allocation with focus on optimization."
                justification['risk_considerations'] = [
                    "Monitor for regime changes",
                    "Focus on steady returns",
                    "Maintain diversification"
                ]
            
            # Document key changes
            for symbol, change_data in major_changes.items():
                action = change_data['action']
                change_pct = abs(change_data['absolute_change']) * 100
                
                justification['key_changes'].append(
                    f"{action} {symbol}: {change_pct:.1f}% allocation change"
                )
            
            return justification
            
        except Exception as e:
            print(f"⚠️ Error generating regime justification: {str(e)}")
            return {
                'regime': market_regime,
                'confidence': regime_confidence,
                'reasoning': f"Allocation adjusted for {market_regime} market conditions",
                'key_changes': [],
                'risk_considerations': []
            }

    def generate_fallback_allocation(self, current_weights, market_regime):
        """
        Generate fallback allocation when optimization fails
        """
        return {
            "success": False,
            "optimal_weights": current_weights,
            "expected_return": 0.08,
            "expected_risk": 0.15,
            "sharpe_ratio": 0.4,
            "sharpe_improvement": {"absolute_improvement": 0.0},
            "regime_justification": {
                "regime": market_regime,
                "reasoning": "Optimization failed - maintaining current allocation",
                "key_changes": [],
                "risk_considerations": ["Review optimization parameters", "Check data quality"]
            },
            "error": "Dynamic allocation optimization failed - using current weights",
            "fallback_mode": True,
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Main entry point for the dynamic allocation service"""
    try:
        # Read input from command line
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        # Create service instance and calculate allocation
        allocation_service = DynamicAllocationService()
        result = allocation_service.calculate_dynamic_allocation(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "optimal_weights": {},
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))


if __name__ == "__main__":
    main()
