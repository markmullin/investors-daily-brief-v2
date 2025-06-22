import pandas as pd
from typing import List, Dict, Any, Optional
import json

def recommend_chart_type(data: List[Dict[str, Any]], user_prompt: str, additional_context: Optional[Dict[str, Any]] = None):
    """
    Recommend the best chart type based on the data and user prompt
    
    Args:
        data: List of dictionaries containing the data
        user_prompt: Natural language prompt from the user
        additional_context: Additional context for the recommendation
        
    Returns:
        Dict containing the chart recommendation
    """
    # Convert list of dicts to DataFrame for easier analysis
    df = pd.DataFrame(data)
    
    # Extract key data characteristics
    num_rows = len(df)
    num_cols = len(df.columns)
    
    # Get column types
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    datetime_cols = []
    
    # Try to identify datetime columns
    for col in df.columns:
        try:
            pd.to_datetime(df[col])
            datetime_cols.append(col)
        except:
            pass
    
    # Extract keywords from user prompt
    prompt_lower = user_prompt.lower()
    
    # Check for chart type hints in the prompt
    chart_hints = {
        'line': ['line', 'trend', 'time series', 'over time', 'movement', 'trajectory', 'progression'],
        'bar': ['bar', 'comparison', 'compare', 'ranking', 'rank', 'highest', 'lowest', 'top', 'bottom'],
        'scatter': ['scatter', 'correlation', 'relationship', 'versus', 'vs', 'against', 'compare'],
        'pie': ['pie', 'proportion', 'composition', 'breakdown', 'share', 'percentage', 'distribution'],
        'histogram': ['histogram', 'distribution', 'frequency', 'spread'],
        'box': ['box', 'distribution', 'range', 'outliers', 'quartile', 'median'],
        'heatmap': ['heatmap', 'correlation', 'matrix', 'grid', 'intensity'],
        'area': ['area', 'cumulative', 'stacked', 'accumulation'],
        'candlestick': ['candlestick', 'ohlc', 'stock', 'price', 'trading'],
        'radar': ['radar', 'spider', 'multi-dimensional', 'multiple metrics'],
        'bubble': ['bubble', 'three', '3d', 'size', 'magnitude']
    }
    
    # Score each chart type based on prompt and data
    scores = {chart_type: 0 for chart_type in chart_hints.keys()}
    
    # Score based on keyword matches in prompt
    for chart_type, keywords in chart_hints.items():
        for keyword in keywords:
            if keyword in prompt_lower:
                scores[chart_type] += 5  # Strong signal from explicit mention
    
    # Score based on data characteristics
    # For time series data (presence of datetime and numeric columns)
    if datetime_cols and numeric_cols:
        scores['line'] += 3
        scores['area'] += 2
        scores['candlestick'] += 1 if any(col.lower() in ['open', 'high', 'low', 'close'] for col in df.columns) else 0
    
    # For comparison between categories
    if categorical_cols and numeric_cols:
        scores['bar'] += 3
        scores['box'] += 2
        
    # For showing distributions
    if len(numeric_cols) >= 1:
        scores['histogram'] += 2
        scores['box'] += 1
    
    # For showing relationships between variables
    if len(numeric_cols) >= 2:
        scores['scatter'] += 3
        scores['bubble'] += 2 if len(numeric_cols) >= 3 else 0
    
    # For showing proportions
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        num_unique_cats = df[categorical_cols[0]].nunique()
        if num_unique_cats <= 10:  # Pie charts work best with few categories
            scores['pie'] += 3
    
    # For correlation matrices
    if len(numeric_cols) > 3:
        scores['heatmap'] += 3
    
    # For multi-dimensional data
    if len(numeric_cols) >= 5:
        scores['radar'] += 3
    
    # Find the best chart type
    best_chart = max(scores.items(), key=lambda x: x[1])
    
    # Get alternative suggestions (charts with high scores)
    alternatives = sorted([(chart, score) for chart, score in scores.items() if chart != best_chart[0]], 
                         key=lambda x: x[1], reverse=True)[:2]
    
    # Generate configuration based on the recommended chart
    config = generate_chart_config(best_chart[0], df, datetime_cols, numeric_cols, categorical_cols)
    
    return {
        'recommended_chart': best_chart[0],
        'confidence': min(100, best_chart[1] * 10),  # Scale score to a percentage
        'alternatives': [alt[0] for alt in alternatives],
        'config': config,
        'data_summary': {
            'rows': num_rows,
            'columns': num_cols,
            'numeric_columns': numeric_cols,
            'categorical_columns': categorical_cols,
            'datetime_columns': datetime_cols
        },
        'reasoning': generate_recommendation_reasoning(best_chart[0], df, user_prompt)
    }

def generate_chart_config(chart_type, df, datetime_cols, numeric_cols, categorical_cols):
    """Generate a chart configuration based on the recommended type"""
    config = {
        'type': chart_type,
        'layout': {
            'title': '',  # To be filled by the caller
            'showlegend': True
        },
        'data': []
    }
    
    if chart_type == 'line':
        # Determine x and y axes
        x_axis = datetime_cols[0] if datetime_cols else df.columns[0]
        y_axes = numeric_cols[:3]  # Limit to 3 series for clarity
        
        config['layout']['xaxis'] = {'title': x_axis}
        config['layout']['yaxis'] = {'title': ', '.join(y_axes)}
        
        for y_column in y_axes:
            config['data'].append({
                'x': x_axis,
                'y': y_column,
                'type': 'scatter',
                'mode': 'lines',
                'name': y_column
            })
    
    elif chart_type == 'bar':
        # Use categorical column as x-axis if available
        x_axis = categorical_cols[0] if categorical_cols else df.columns[0]
        y_axis = numeric_cols[0] if numeric_cols else df.columns[1]
        
        config['layout']['xaxis'] = {'title': x_axis}
        config['layout']['yaxis'] = {'title': y_axis}
        
        config['data'].append({
            'x': x_axis,
            'y': y_axis,
            'type': 'bar',
            'name': y_axis
        })
    
    elif chart_type == 'scatter':
        if len(numeric_cols) >= 2:
            config['layout']['xaxis'] = {'title': numeric_cols[0]}
            config['layout']['yaxis'] = {'title': numeric_cols[1]}
            
            config['data'].append({
                'x': numeric_cols[0],
                'y': numeric_cols[1],
                'type': 'scatter',
                'mode': 'markers',
                'name': f"{numeric_cols[0]} vs {numeric_cols[1]}"
            })
    
    elif chart_type == 'pie':
        if categorical_cols and numeric_cols:
            config['data'].append({
                'labels': categorical_cols[0],
                'values': numeric_cols[0],
                'type': 'pie',
                'name': f"{numeric_cols[0]} by {categorical_cols[0]}"
            })
    
    elif chart_type == 'histogram':
        if numeric_cols:
            config['data'].append({
                'x': numeric_cols[0],
                'type': 'histogram',
                'name': numeric_cols[0]
            })
            
    elif chart_type == 'box':
        if numeric_cols:
            for column in numeric_cols[:3]:  # Limit to 3 box plots
                config['data'].append({
                    'y': column,
                    'type': 'box',
                    'name': column
                })
    
    elif chart_type == 'heatmap':
        if len(numeric_cols) > 1:
            config['data'].append({
                'z': 'correlation_matrix',  # This will be filled by the frontend
                'x': numeric_cols,
                'y': numeric_cols,
                'type': 'heatmap',
                'colorscale': 'Viridis'
            })
    
    elif chart_type == 'candlestick':
        ohlc_cols = {
            'open': next((col for col in df.columns if 'open' in col.lower()), None),
            'high': next((col for col in df.columns if 'high' in col.lower()), None),
            'low': next((col for col in df.columns if 'low' in col.lower()), None),
            'close': next((col for col in df.columns if 'close' in col.lower()), None),
        }
        
        if all(ohlc_cols.values()) and datetime_cols:
            config['data'].append({
                'x': datetime_cols[0],
                'open': ohlc_cols['open'],
                'high': ohlc_cols['high'],
                'low': ohlc_cols['low'],
                'close': ohlc_cols['close'],
                'type': 'candlestick',
                'name': 'Price'
            })
    
    return config

def generate_recommendation_reasoning(chart_type, df, user_prompt):
    """Generate reasoning for the chart recommendation"""
    if chart_type == 'line':
        return "A line chart is recommended because it's excellent for showing trends over time and the data contains time-based information. Line charts help visualize how values change, showing patterns and trends clearly."
    
    elif chart_type == 'bar':
        return "A bar chart is recommended because it's ideal for comparing different categories. Bar charts make it easy to compare values across different groups and see which categories have higher or lower values."
    
    elif chart_type == 'scatter':
        return "A scatter plot is recommended because it's perfect for showing relationships between two variables. This helps identify correlations, patterns, or trends between different metrics."
    
    elif chart_type == 'pie':
        return "A pie chart is recommended because it's good for showing proportions and percentages of a whole. This helps visualize how different categories contribute to a total."
    
    elif chart_type == 'histogram':
        return "A histogram is recommended because it's excellent for showing the distribution of a single variable. This helps understand the frequency distribution and identify patterns in the data."
    
    elif chart_type == 'box':
        return "A box plot is recommended because it shows the distribution, median, and potential outliers in the data. This is useful for comparing distributions across different categories."
    
    elif chart_type == 'heatmap':
        return "A heatmap is recommended because it's great for visualizing complex relationships between multiple variables. The color intensity helps identify patterns and correlations in the data."
    
    elif chart_type == 'area':
        return "An area chart is recommended because it's good for showing cumulative totals over time. This helps visualize how different categories contribute to a total and how they change over time."
    
    elif chart_type == 'candlestick':
        return "A candlestick chart is recommended because it's specifically designed for financial data, showing opening, high, low, and closing prices. This is ideal for analyzing stock price movements."
    
    elif chart_type == 'radar':
        return "A radar chart is recommended because it's excellent for comparing multiple variables across different categories. This helps visualize performance or metrics across multiple dimensions."
    
    elif chart_type == 'bubble':
        return "A bubble chart is recommended because it can show relationships between three variables using position (x, y) and size. This adds an extra dimension to the visualization."
    
    return f"A {chart_type} chart is recommended based on the data characteristics and your request."
