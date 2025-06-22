#!/usr/bin/env python3
"""
sector_rotation.py - Advanced Sector Rotation Analysis
Analyzes sector performance patterns and market cycle positioning using scientific Python libraries
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

def analyze_sector_rotation(sector_data, historical_data=None):
    """
    Analyze sector rotation patterns and determine market cycle phase
    Returns comprehensive sector leadership and rotation analysis
    """
    try:
        if not sector_data or len(sector_data) == 0:
            return {
                'market_cycle': {'phase': 'Unknown', 'confidence': 0},
                'current_leadership': {'leading_sectors': [], 'lagging_sectors': []},
                'rotation_strength': 0,
                'actionable_insights': ['Insufficient sector data for analysis'],
                'error': 'No sector data provided'
            }
        
        # Process sector data
        processed_sectors = process_sector_data(sector_data)
        
        # Analyze sector performance
        sector_performance = analyze_sector_performance(processed_sectors)
        
        # Determine market cycle phase
        market_cycle = determine_market_cycle_phase(sector_performance)
        
        # Identify current leadership
        current_leadership = identify_sector_leadership(sector_performance)
        
        # Calculate rotation strength
        rotation_strength = calculate_rotation_strength(sector_performance)
        
        # Generate actionable insights
        actionable_insights = generate_rotation_insights(market_cycle, current_leadership, rotation_strength)
        
        return {
            'market_cycle': market_cycle,
            'current_leadership': current_leadership,
            'rotation_strength': rotation_strength,
            'sector_performance': sector_performance,
            'actionable_insights': actionable_insights,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': f'Sector rotation analysis failed: {str(e)}',
            'market_cycle': {'phase': 'Error', 'confidence': 0},
            'current_leadership': {'leading_sectors': [], 'lagging_sectors': []},
            'rotation_strength': 0,
            'actionable_insights': ['Analysis failed due to technical error']
        }

def process_sector_data(sector_data):
    """Process and standardize sector data"""
    try:
        processed = []
        
        for sector in sector_data:
            if isinstance(sector, dict):
                # Extract key metrics
                name = sector.get('name', sector.get('sector', 'Unknown'))
                change_1d = float(sector.get('change_percent', sector.get('dayChange', 0)))
                change_1w = float(sector.get('week_change', sector.get('weekChange', change_1d * 5)))
                change_1m = float(sector.get('month_change', sector.get('monthChange', change_1d * 20)))
                change_3m = float(sector.get('quarter_change', sector.get('quarterChange', change_1d * 60)))
                
                # Calculate relative strength
                relative_strength = calculate_sector_relative_strength(change_1d, change_1w, change_1m, change_3m)
                
                # Categorize sector type
                sector_type = categorize_sector_type(name)
                
                processed.append({
                    'name': name,
                    'change_1d': change_1d,
                    'change_1w': change_1w,
                    'change_1m': change_1m,
                    'change_3m': change_3m,
                    'relative_strength': relative_strength,
                    'sector_type': sector_type,
                    'momentum_score': calculate_momentum_score(change_1d, change_1w, change_1m)
                })
        
        return processed
        
    except Exception as e:
        return []

def calculate_sector_relative_strength(change_1d, change_1w, change_1m, change_3m):
    """Calculate sector relative strength score"""
    # Weight different timeframes
    weights = {'1d': 0.1, '1w': 0.2, '1m': 0.3, '3m': 0.4}
    
    weighted_performance = (
        change_1d * weights['1d'] +
        change_1w * weights['1w'] +
        change_1m * weights['1m'] +
        change_3m * weights['3m']
    )
    
    # Normalize to 0-100 scale
    # Assume -20% to +20% range maps to 0-100
    normalized_score = ((weighted_performance + 20) / 40) * 100
    return max(0, min(100, normalized_score))

def categorize_sector_type(sector_name):
    """Categorize sectors by economic sensitivity"""
    sector_name_lower = sector_name.lower()
    
    # Cyclical sectors (sensitive to economic cycles)
    cyclical_keywords = ['technology', 'financial', 'industrial', 'material', 'energy', 'consumer discretionary']
    
    # Defensive sectors (less sensitive to economic cycles)
    defensive_keywords = ['utilities', 'consumer staples', 'healthcare', 'real estate']
    
    # Interest rate sensitive
    rate_sensitive_keywords = ['financial', 'real estate', 'utilities']
    
    for keyword in cyclical_keywords:
        if keyword in sector_name_lower:
            return 'cyclical'
    
    for keyword in defensive_keywords:
        if keyword in sector_name_lower:
            return 'defensive'
    
    for keyword in rate_sensitive_keywords:
        if keyword in sector_name_lower:
            return 'rate_sensitive'
    
    return 'mixed'

def calculate_momentum_score(change_1d, change_1w, change_1m):
    """Calculate momentum score for sector"""
    # Recent momentum gets higher weight
    momentum = (change_1d * 0.5 + change_1w * 0.3 + change_1m * 0.2)
    
    # Check for acceleration/deceleration
    if change_1d > change_1w > change_1m:
        momentum *= 1.2  # Accelerating momentum
    elif change_1d < change_1w < change_1m:
        momentum *= 0.8  # Decelerating momentum
    
    return momentum

def analyze_sector_performance(processed_sectors):
    """Analyze sector performance patterns"""
    try:
        if not processed_sectors:
            return {}
        
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(processed_sectors)
        
        # Calculate sector rankings
        df['rank_1d'] = df['change_1d'].rank(ascending=False)
        df['rank_1w'] = df['change_1w'].rank(ascending=False)
        df['rank_1m'] = df['change_1m'].rank(ascending=False)
        df['rank_3m'] = df['change_3m'].rank(ascending=False)
        
        # Calculate consistency score (lower variance in rankings = more consistent)
        df['consistency_score'] = df[['rank_1d', 'rank_1w', 'rank_1m', 'rank_3m']].var(axis=1)
        
        # Analyze by sector type
        cyclical_performance = df[df['sector_type'] == 'cyclical']['change_1m'].mean() if 'cyclical' in df['sector_type'].values else 0
        defensive_performance = df[df['sector_type'] == 'defensive']['change_1m'].mean() if 'defensive' in df['sector_type'].values else 0
        
        # Calculate sector dispersion (how spread out performance is)
        sector_dispersion = df['change_1m'].std()
        
        return {
            'sectors': df.to_dict('records'),
            'cyclical_vs_defensive': cyclical_performance - defensive_performance,
            'sector_dispersion': sector_dispersion,
            'top_performers': df.nlargest(3, 'change_1m')[['name', 'change_1m']].to_dict('records'),
            'bottom_performers': df.nsmallest(3, 'change_1m')[['name', 'change_1m']].to_dict('records'),
            'most_consistent': df.nsmallest(3, 'consistency_score')[['name', 'consistency_score']].to_dict('records')
        }
        
    except Exception as e:
        return {'error': f'Performance analysis failed: {str(e)}'}

def determine_market_cycle_phase(sector_performance):
    """Determine current market cycle phase based on sector rotation"""
    try:
        if 'error' in sector_performance:
            return {'phase': 'Unknown', 'confidence': 0, 'characteristics': []}
        
        cyclical_vs_defensive = sector_performance.get('cyclical_vs_defensive', 0)
        sector_dispersion = sector_performance.get('sector_dispersion', 0)
        top_performers = sector_performance.get('top_performers', [])
        
        # Analyze top performing sectors
        top_sector_types = []
        for performer in top_performers:
            sector_name = performer.get('name', '').lower()
            if any(word in sector_name for word in ['technology', 'financial', 'industrial']):
                top_sector_types.append('cyclical')
            elif any(word in sector_name for word in ['utilities', 'staples', 'healthcare']):
                top_sector_types.append('defensive')
            elif any(word in sector_name for word in ['energy', 'material']):
                top_sector_types.append('commodity')
        
        # Determine phase based on patterns
        cyclical_count = top_sector_types.count('cyclical')
        defensive_count = top_sector_types.count('defensive')
        commodity_count = top_sector_types.count('commodity')
        
        confidence = 0
        characteristics = []
        
        if cyclical_vs_defensive > 2 and cyclical_count >= 2:
            phase = 'Early Bull Market'
            confidence = min(90, 60 + cyclical_vs_defensive * 5)
            characteristics = [
                'Cyclical sectors outperforming',
                'Economic recovery expectations',
                'Risk appetite increasing'
            ]
        elif cyclical_vs_defensive > 0 and sector_dispersion > 3:
            phase = 'Bull Market'
            confidence = min(90, 50 + cyclical_vs_defensive * 5 + sector_dispersion * 2)
            characteristics = [
                'Broad market participation',
                'Strong sector rotation',
                'Growth momentum building'
            ]
        elif defensive_count >= 2 and cyclical_vs_defensive < -1:
            phase = 'Late Bull Market'
            confidence = min(90, 60 + abs(cyclical_vs_defensive) * 5)
            characteristics = [
                'Defensive sectors gaining leadership',
                'Growth concerns emerging',
                'Market maturity signals'
            ]
        elif defensive_count >= 2 and cyclical_vs_defensive < -2:
            phase = 'Bear Market'
            confidence = min(90, 70 + abs(cyclical_vs_defensive) * 3)
            characteristics = [
                'Defensive sectors dominating',
                'Risk aversion widespread',
                'Economic contraction concerns'
            ]
        elif commodity_count >= 2:
            phase = 'Inflationary Growth'
            confidence = min(80, 50 + commodity_count * 10)
            characteristics = [
                'Commodity sectors leading',
                'Inflation pressures building',
                'Resource scarcity themes'
            ]
        else:
            phase = 'Mixed Conditions'
            confidence = 30
            characteristics = [
                'No clear sector leadership',
                'Transitional market environment',
                'Mixed economic signals'
            ]
        
        return {
            'phase': phase,
            'confidence': round(confidence, 1),
            'characteristics': characteristics,
            'cyclical_advantage': round(cyclical_vs_defensive, 2)
        }
        
    except Exception as e:
        return {
            'phase': 'Error',
            'confidence': 0,
            'characteristics': [f'Analysis failed: {str(e)}']
        }

def identify_sector_leadership(sector_performance):
    """Identify current sector leadership patterns"""
    try:
        if 'error' in sector_performance or 'sectors' not in sector_performance:
            return {
                'leading_sectors': [],
                'lagging_sectors': [],
                'leadership_strength': 'weak',
                'rotation_direction': 'unclear'
            }
        
        sectors_df = pd.DataFrame(sector_performance['sectors'])
        
        # Identify leaders and laggards based on 1-month performance
        leading_threshold = sectors_df['change_1m'].quantile(0.67)  # Top third
        lagging_threshold = sectors_df['change_1m'].quantile(0.33)  # Bottom third
        
        leading_sectors = sectors_df[sectors_df['change_1m'] >= leading_threshold]['name'].tolist()
        lagging_sectors = sectors_df[sectors_df['change_1m'] <= lagging_threshold]['name'].tolist()
        
        # Analyze leadership strength
        performance_spread = sectors_df['change_1m'].max() - sectors_df['change_1m'].min()
        
        if performance_spread > 10:
            leadership_strength = 'strong'
        elif performance_spread > 5:
            leadership_strength = 'moderate'
        else:
            leadership_strength = 'weak'
        
        # Determine rotation direction
        cyclical_sectors = sectors_df[sectors_df['sector_type'] == 'cyclical']
        defensive_sectors = sectors_df[sectors_df['sector_type'] == 'defensive']
        
        if not cyclical_sectors.empty and not defensive_sectors.empty:
            cyclical_avg = cyclical_sectors['change_1m'].mean()
            defensive_avg = defensive_sectors['change_1m'].mean()
            
            if cyclical_avg > defensive_avg + 2:
                rotation_direction = 'risk_on'
            elif defensive_avg > cyclical_avg + 2:
                rotation_direction = 'risk_off'
            else:
                rotation_direction = 'neutral'
        else:
            rotation_direction = 'unclear'
        
        return {
            'leading_sectors': leading_sectors,
            'lagging_sectors': lagging_sectors,
            'leadership_strength': leadership_strength,
            'rotation_direction': rotation_direction,
            'performance_spread': round(performance_spread, 2)
        }
        
    except Exception as e:
        return {
            'leading_sectors': [],
            'lagging_sectors': [],
            'leadership_strength': 'error',
            'rotation_direction': 'unclear',
            'error': str(e)
        }

def calculate_rotation_strength(sector_performance):
    """Calculate the strength of sector rotation"""
    try:
        if 'error' in sector_performance or 'sector_dispersion' not in sector_performance:
            return 0
        
        sector_dispersion = sector_performance['sector_dispersion']
        
        # Higher dispersion indicates stronger rotation
        # Normalize to 0-100 scale (assume 0-15% dispersion range)
        rotation_strength = min(100, (sector_dispersion / 15) * 100)
        
        return round(rotation_strength, 1)
        
    except Exception as e:
        return 0

def generate_rotation_insights(market_cycle, current_leadership, rotation_strength):
    """Generate actionable insights based on rotation analysis"""
    try:
        insights = []
        
        phase = market_cycle.get('phase', 'Unknown')
        confidence = market_cycle.get('confidence', 0)
        leading_sectors = current_leadership.get('leading_sectors', [])
        rotation_direction = current_leadership.get('rotation_direction', 'unclear')
        
        # Phase-specific insights
        if phase == 'Early Bull Market' and confidence > 60:
            insights.append("Consider overweighting cyclical sectors as economic recovery gains momentum")
            insights.append("Financials and Consumer Discretionary may outperform in this phase")
            
        elif phase == 'Bull Market' and confidence > 60:
            insights.append("Broad sector participation suggests healthy bull market conditions")
            insights.append("Growth sectors like Technology may continue leadership")
            
        elif phase == 'Late Bull Market' and confidence > 60:
            insights.append("Begin reducing cyclical exposure as defensive sectors gain leadership")
            insights.append("Consider taking profits in extended growth positions")
            
        elif phase == 'Bear Market' and confidence > 60:
            insights.append("Focus on defensive sectors: Utilities, Healthcare, Consumer Staples")
            insights.append("Consider reducing overall equity exposure and increasing cash/bonds")
            
        elif phase == 'Inflationary Growth':
            insights.append("Energy and Materials sectors may benefit from inflation themes")
            insights.append("Consider inflation-protected assets and companies with pricing power")
        
        # Rotation strength insights
        if rotation_strength > 70:
            insights.append("Strong sector rotation provides tactical opportunities for active management")
        elif rotation_strength < 30:
            insights.append("Weak sector rotation suggests broad market forces dominating individual sectors")
        
        # Leadership insights
        if leading_sectors:
            top_sector = leading_sectors[0] if leading_sectors else "Unknown"
            insights.append(f"Current market leadership from {top_sector} suggests specific thematic focus")
        
        # Rotation direction insights
        if rotation_direction == 'risk_on':
            insights.append("Risk-on rotation favors growth, cyclicals, and higher beta sectors")
        elif rotation_direction == 'risk_off':
            insights.append("Risk-off rotation favors quality, dividends, and defensive characteristics")
        
        # Default insight if no specific ones generated
        if not insights:
            insights.append("Monitor sector rotation patterns for emerging trends and opportunities")
        
        return insights
        
    except Exception as e:
        return [f"Insight generation failed: {str(e)}"]

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Usage: python sector_rotation.py <data_file>'}))
            sys.exit(1)
        
        # Read input data
        data_file = sys.argv[1]
        with open(data_file, 'r') as f:
            input_data = json.load(f)
        
        # Extract data
        sector_data = input_data.get('sector_data', [])
        historical_data = input_data.get('historical_data', [])
        
        # Perform analysis
        result = analyze_sector_rotation(sector_data, historical_data)
        
        # Output result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': f'Sector rotation analysis failed: {str(e)}',
            'market_cycle': {'phase': 'Error', 'confidence': 0},
            'current_leadership': {'leading_sectors': [], 'lagging_sectors': []},
            'rotation_strength': 0,
            'actionable_insights': ['Analysis failed due to technical error']
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
