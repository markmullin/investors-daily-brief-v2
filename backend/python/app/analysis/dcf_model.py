"""
DCF (Discounted Cash Flow) Model Engine
Standard complexity DCF models for individual stock analysis with educational explanations.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import warnings

@dataclass
class DCFInputs:
    """Input parameters for DCF model"""
    ticker: str
    current_price: float
    
    # Financial Statement Data
    revenue: float  # Most recent annual revenue
    operating_margin: float  # Operating margin %
    tax_rate: float  # Effective tax rate %
    
    # Balance Sheet Data
    total_debt: float
    cash: float
    shares_outstanding: float
    
    # Growth Assumptions
    revenue_growth_rate: float  # Expected revenue growth %
    terminal_growth_rate: float  # Long-term growth rate %
    
    # Discount Rate Components
    risk_free_rate: float  # 10-year treasury rate
    market_risk_premium: float  # Market risk premium
    beta: float  # Stock beta
    
    # Model Parameters
    projection_years: int = 10
    
class DCFModel:
    """
    Standard complexity DCF model for stock valuation
    Provides clear, educational explanations for retail investors
    """
    
    def __init__(self):
        self.model_assumptions = {}
        self.calculation_steps = []
        
    def calculate_wacc(self, inputs: DCFInputs) -> Dict[str, float]:
        """
        Calculate Weighted Average Cost of Capital (WACC)
        
        Formula: WACC = (E/V × Re) + (D/V × Rd × (1-Tc))
        Where:
        - E = Market value of equity
        - D = Market value of debt  
        - V = E + D (total value)
        - Re = Cost of equity (using CAPM)
        - Rd = Cost of debt
        - Tc = Tax rate
        """
        
        # Calculate cost of equity using CAPM
        cost_of_equity = inputs.risk_free_rate + (inputs.beta * inputs.market_risk_premium)
        
        # Estimate cost of debt (simplified approach)
        cost_of_debt = inputs.risk_free_rate + 0.02  # Risk-free rate + credit spread
        
        # Calculate market values
        market_value_equity = inputs.current_price * inputs.shares_outstanding
        market_value_debt = inputs.total_debt
        total_value = market_value_equity + market_value_debt
        
        # Calculate weights
        equity_weight = market_value_equity / total_value if total_value > 0 else 1.0
        debt_weight = market_value_debt / total_value if total_value > 0 else 0.0
        
        # Calculate WACC
        wacc = (equity_weight * cost_of_equity) + (debt_weight * cost_of_debt * (1 - inputs.tax_rate))
        
        self.calculation_steps.append({
            'step': 'WACC Calculation',
            'explanation': f'Calculated discount rate of {wacc:.1%} using CAPM model',
            'details': {
                'cost_of_equity': cost_of_equity,
                'cost_of_debt': cost_of_debt,
                'equity_weight': equity_weight,
                'debt_weight': debt_weight
            }
        })
        
        return {
            'wacc': wacc,
            'cost_of_equity': cost_of_equity,
            'cost_of_debt': cost_of_debt,
            'equity_weight': equity_weight,
            'debt_weight': debt_weight
        }
    
    def project_free_cash_flows(self, inputs: DCFInputs) -> List[Dict[str, float]]:
        """
        Project future free cash flows for the projection period
        
        Free Cash Flow = Operating Income × (1 - Tax Rate) + Depreciation - CapEx - Change in Working Capital
        Simplified approach: FCF = Revenue × Operating Margin × (1 - Tax Rate) × FCF Conversion Rate
        """
        
        projections = []
        current_revenue = inputs.revenue
        
        # Assume FCF conversion rate (simplified)
        fcf_conversion_rate = 0.85  # 85% of after-tax operating income converts to FCF
        
        for year in range(1, inputs.projection_years + 1):
            # Project revenue with declining growth rate
            growth_rate = inputs.revenue_growth_rate * (0.95 ** (year - 1))  # Growth declines 5% per year
            current_revenue = current_revenue * (1 + growth_rate)
            
            # Calculate operating income
            operating_income = current_revenue * inputs.operating_margin
            
            # Calculate after-tax operating income
            after_tax_operating_income = operating_income * (1 - inputs.tax_rate)
            
            # Calculate free cash flow
            free_cash_flow = after_tax_operating_income * fcf_conversion_rate
            
            projections.append({
                'year': year,
                'revenue': current_revenue,
                'operating_income': operating_income,
                'after_tax_operating_income': after_tax_operating_income,
                'free_cash_flow': free_cash_flow,
                'growth_rate': growth_rate
            })
        
        self.calculation_steps.append({
            'step': 'Cash Flow Projections',
            'explanation': f'Projected {inputs.projection_years} years of free cash flows with declining growth',
            'details': {
                'starting_revenue': inputs.revenue,
                'starting_growth_rate': inputs.revenue_growth_rate,
                'fcf_conversion_rate': fcf_conversion_rate
            }
        })
        
        return projections
    
    def calculate_terminal_value(self, inputs: DCFInputs, final_year_fcf: float, wacc: float) -> Dict[str, float]:
        """
        Calculate terminal value using Gordon Growth Model
        
        Terminal Value = FCF(final year) × (1 + terminal growth) / (WACC - terminal growth)
        """
        
        # Ensure terminal growth rate is reasonable (< WACC)
        terminal_growth = min(inputs.terminal_growth_rate, wacc - 0.001)
        
        # Calculate terminal value
        terminal_fcf = final_year_fcf * (1 + terminal_growth)
        terminal_value = terminal_fcf / (wacc - terminal_growth)
        
        # Present value of terminal value
        discount_factor = (1 + wacc) ** inputs.projection_years
        pv_terminal_value = terminal_value / discount_factor
        
        self.calculation_steps.append({
            'step': 'Terminal Value',
            'explanation': f'Calculated terminal value assuming {terminal_growth:.1%} perpetual growth',
            'details': {
                'terminal_fcf': terminal_fcf,
                'terminal_value': terminal_value,
                'pv_terminal_value': pv_terminal_value,
                'terminal_growth_used': terminal_growth
            }
        })
        
        return {
            'terminal_value': terminal_value,
            'pv_terminal_value': pv_terminal_value,
            'terminal_growth_rate': terminal_growth
        }
    
    def calculate_dcf_value(self, inputs: DCFInputs) -> Dict[str, any]:
        """
        Calculate complete DCF valuation
        
        Returns comprehensive valuation results with explanations
        """
        
        try:
            # Reset calculation steps
            self.calculation_steps = []
            
            # Step 1: Calculate WACC
            wacc_results = self.calculate_wacc(inputs)
            wacc = wacc_results['wacc']
            
            # Step 2: Project free cash flows
            projections = self.project_free_cash_flows(inputs)
            
            # Step 3: Calculate present value of projected cash flows
            pv_projections = []
            total_pv_projections = 0
            
            for projection in projections:
                discount_factor = (1 + wacc) ** projection['year']
                present_value = projection['free_cash_flow'] / discount_factor
                pv_projections.append(present_value)
                total_pv_projections += present_value
            
            # Step 4: Calculate terminal value
            final_year_fcf = projections[-1]['free_cash_flow']
            terminal_results = self.calculate_terminal_value(inputs, final_year_fcf, wacc)
            
            # Step 5: Calculate enterprise value
            enterprise_value = total_pv_projections + terminal_results['pv_terminal_value']
            
            # Step 6: Calculate equity value
            equity_value = enterprise_value + inputs.cash - inputs.total_debt
            
            # Step 7: Calculate value per share
            intrinsic_value_per_share = equity_value / inputs.shares_outstanding
            
            # Step 8: Calculate upside/downside
            upside_downside = (intrinsic_value_per_share / inputs.current_price) - 1
            
            # Assign DCF grade
            dcf_grade = self._assign_dcf_grade(upside_downside)
            
            # Create sensitivity analysis
            sensitivity = self._run_sensitivity_analysis(inputs, wacc)
            
            self.calculation_steps.append({
                'step': 'Final Valuation',
                'explanation': f'Calculated intrinsic value of ${intrinsic_value_per_share:.2f} per share',
                'details': {
                    'enterprise_value': enterprise_value,
                    'equity_value': equity_value,
                    'upside_downside': upside_downside
                }
            })
            
            return {
                'ticker': inputs.ticker,
                'current_price': inputs.current_price,
                'intrinsic_value': intrinsic_value_per_share,
                'upside_downside_percent': upside_downside * 100,
                'dcf_grade': dcf_grade,
                'enterprise_value': enterprise_value,
                'equity_value': equity_value,
                'wacc': wacc,
                'projections': projections,
                'pv_projections': pv_projections,
                'terminal_value': terminal_results,
                'key_assumptions': self._get_key_assumptions(inputs),
                'sensitivity_analysis': sensitivity,
                'calculation_steps': self.calculation_steps,
                'model_timestamp': datetime.now().isoformat(),
                'educational_summary': self._generate_educational_summary(inputs, intrinsic_value_per_share, upside_downside)
            }
            
        except Exception as e:
            raise ValueError(f"DCF calculation failed: {str(e)}")
    
    def _assign_dcf_grade(self, upside_downside: float) -> str:
        """Assign letter grade based on upside/downside potential"""
        if upside_downside > 0.30:  # >30% upside
            return 'A+'
        elif upside_downside > 0.20:  # 20-30% upside
            return 'A'
        elif upside_downside > 0.10:  # 10-20% upside
            return 'B+'
        elif upside_downside > 0.05:  # 5-10% upside
            return 'B'
        elif upside_downside > -0.05:  # -5% to +5%
            return 'B-'
        elif upside_downside > -0.15:  # -5% to -15%
            return 'C+'
        elif upside_downside > -0.25:  # -15% to -25%
            return 'C'
        else:  # >25% overvalued
            return 'D'
    
    def _get_key_assumptions(self, inputs: DCFInputs) -> Dict[str, any]:
        """Extract key assumptions for transparency"""
        return {
            'revenue_growth': f"{inputs.revenue_growth_rate:.1%} (declining over time)",
            'terminal_growth': f"{inputs.terminal_growth_rate:.1%}",
            'discount_rate_wacc': f"{self.calculate_wacc(inputs)['wacc']:.1%}",
            'operating_margin': f"{inputs.operating_margin:.1%}",
            'tax_rate': f"{inputs.tax_rate:.1%}",
            'projection_years': inputs.projection_years
        }
    
    def _run_sensitivity_analysis(self, inputs: DCFInputs, base_wacc: float) -> Dict[str, Dict[str, float]]:
        """
        Run sensitivity analysis on key variables
        Shows how valuation changes with different assumptions
        """
        
        sensitivity = {}
        base_dcf = self.calculate_dcf_value(inputs)['intrinsic_value']
        
        # Growth rate sensitivity
        growth_scenarios = [
            inputs.revenue_growth_rate - 0.02,  # 2% lower
            inputs.revenue_growth_rate,          # Base case
            inputs.revenue_growth_rate + 0.02    # 2% higher
        ]
        
        growth_values = []
        for growth in growth_scenarios:
            test_inputs = inputs
            test_inputs.revenue_growth_rate = growth
            test_value = self.calculate_dcf_value(test_inputs)['intrinsic_value']
            growth_values.append(test_value)
        
        sensitivity['revenue_growth'] = {
            'pessimistic': growth_values[0],
            'base_case': growth_values[1],
            'optimistic': growth_values[2]
        }
        
        # WACC sensitivity
        wacc_scenarios = [base_wacc - 0.01, base_wacc, base_wacc + 0.01]
        wacc_values = []
        for wacc in wacc_scenarios:
            # Simplified recalculation with different WACC
            test_value = base_dcf * (base_wacc / wacc)  # Approximation
            wacc_values.append(test_value)
        
        sensitivity['discount_rate'] = {
            'lower_rate': wacc_values[0],
            'base_case': wacc_values[1],
            'higher_rate': wacc_values[2]
        }
        
        return sensitivity
    
    def _generate_educational_summary(self, inputs: DCFInputs, intrinsic_value: float, upside_downside: float) -> str:
        """
        Generate beginner-friendly explanation of the DCF model and results
        """
        
        summary = f"""
        **What is DCF Analysis?**
        We estimated what {inputs.ticker} will earn in cash over the next 10 years, 
        then calculated what those future cash flows are worth today.
        
        **Our Model Says:**
        {inputs.ticker} is worth ${intrinsic_value:.2f} per share (vs current ${inputs.current_price:.2f})
        **Upside/Downside:** {upside_downside*100:+.1f}% {'undervalued' if upside_downside > 0 else 'overvalued'}
        
        **Key Assumptions:**
        - Revenue Growth: {inputs.revenue_growth_rate:.1%} annually (slowing over time)
        - Profit Margin: {inputs.operating_margin:.1%} (based on recent performance)
        - Discount Rate: {self.calculate_wacc(inputs)['wacc']:.1%} (company's cost of capital)
        
        **What This Means:**
        {'This suggests the stock may be a good value opportunity.' if upside_downside > 0.1 else 
         'The stock appears fairly valued.' if abs(upside_downside) < 0.1 else
         'The stock may be overvalued at current levels.'}
        """
        
        return summary.strip()

# Global DCF model instance
dcf_model = DCFModel()
