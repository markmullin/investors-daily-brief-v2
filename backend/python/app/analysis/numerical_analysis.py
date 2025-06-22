import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

def analyze_data(data: pd.DataFrame, analysis_type: str, parameters: Optional[Dict[str, Any]] = None):
    """
    Perform numerical analysis on financial data
    
    Args:
        data: DataFrame containing the financial data
        analysis_type: Type of analysis to perform (e.g., 'trend', 'correlation', 'volatility')
        parameters: Additional parameters for the analysis
        
    Returns:
        Dict containing the analysis results
    """
    if parameters is None:
        parameters = {}
    
    results = {}
    
    if analysis_type == "trend":
        results = perform_trend_analysis(data, parameters)
    elif analysis_type == "correlation":
        results = perform_correlation_analysis(data, parameters)
    elif analysis_type == "volatility":
        results = perform_volatility_analysis(data, parameters)
    elif analysis_type == "regression":
        results = perform_regression_analysis(data, parameters)
    elif analysis_type == "summary":
        results = perform_summary_statistics(data, parameters)
    else:
        raise ValueError(f"Unsupported analysis type: {analysis_type}")
    
    return results

def perform_trend_analysis(data: pd.DataFrame, parameters: Dict[str, Any]):
    """Analyze trends in the financial data"""
    try:
        # Extract the target column
        target_column = parameters.get('target_column', data.columns[-1])
        
        # Calculate simple moving averages if specified
        window_sizes = parameters.get('window_sizes', [7, 21, 50])
        
        results = {
            'target_column': target_column,
            'data_length': len(data),
            'analysis_type': 'trend',
            'first_value': float(data[target_column].iloc[0]),
            'last_value': float(data[target_column].iloc[-1]),
            'change': float(data[target_column].iloc[-1] - data[target_column].iloc[0]),
            'percent_change': float(((data[target_column].iloc[-1] / data[target_column].iloc[0]) - 1) * 100),
            'moving_averages': {}
        }
        
        # Calculate moving averages
        for window in window_sizes:
            if len(data) >= window:
                ma = data[target_column].rolling(window=window).mean()
                results['moving_averages'][f'MA{window}'] = {
                    'current': float(ma.iloc[-1]) if not np.isnan(ma.iloc[-1]) else None,
                    'trend': 'above' if data[target_column].iloc[-1] > ma.iloc[-1] else 'below'
                }
        
        # Add linear regression for trend direction
        if len(data) >= 2:
            x = np.arange(len(data))
            y = data[target_column].values
            slope, intercept = np.polyfit(x, y, 1)
            results['trend_line'] = {
                'slope': float(slope),
                'intercept': float(intercept),
                'direction': 'upward' if slope > 0 else 'downward',
                'strength': abs(float(slope)) * len(data) / np.mean(y)  # Normalized strength
            }
        
        return results
    except Exception as e:
        return {'error': str(e), 'analysis_type': 'trend'}

def perform_correlation_analysis(data: pd.DataFrame, parameters: Dict[str, Any]):
    """Analyze correlations between different assets or metrics"""
    try:
        # Get correlation columns (default to all numeric columns)
        columns = parameters.get('columns', data.select_dtypes(include=[np.number]).columns.tolist())
        method = parameters.get('method', 'pearson')  # 'pearson', 'kendall', 'spearman'
        
        # Calculate correlation matrix
        correlation_matrix = data[columns].corr(method=method)
        
        # Convert to dictionary format
        corr_dict = {}
        for col1 in correlation_matrix.columns:
            corr_dict[col1] = {}
            for col2 in correlation_matrix.columns:
                corr_dict[col1][col2] = float(correlation_matrix.loc[col1, col2])
        
        # Find highest and lowest correlations
        flat_corr = []
        for i, col1 in enumerate(columns):
            for j, col2 in enumerate(columns):
                if i < j:  # Only take the upper triangle to avoid duplicates
                    flat_corr.append({
                        'col1': col1,
                        'col2': col2,
                        'correlation': float(correlation_matrix.loc[col1, col2])
                    })
        
        # Sort by absolute correlation
        flat_corr.sort(key=lambda x: abs(x['correlation']), reverse=True)
        
        return {
            'analysis_type': 'correlation',
            'method': method,
            'correlation_matrix': corr_dict,
            'top_correlations': flat_corr[:5],
            'bottom_correlations': flat_corr[-5:] if len(flat_corr) > 5 else []
        }
    except Exception as e:
        return {'error': str(e), 'analysis_type': 'correlation'}

def perform_volatility_analysis(data: pd.DataFrame, parameters: Dict[str, Any]):
    """Analyze volatility in the financial data"""
    try:
        # Extract parameters
        price_column = parameters.get('price_column', 'Close')
        window = parameters.get('window', 21)  # Default to 21 days for rolling volatility
        
        if price_column not in data.columns:
            available_columns = data.columns.tolist()
            # Try to find a suitable price column
            for col in ['close', 'price', 'adj_close', 'adjusted_close']:
                matching_cols = [c for c in available_columns if col in c.lower()]
                if matching_cols:
                    price_column = matching_cols[0]
                    break
            else:
                # If no suitable column found, use the last numeric column
                numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
                if numeric_cols:
                    price_column = numeric_cols[-1]
                else:
                    raise ValueError(f"No suitable price column found in data. Available columns: {available_columns}")
        
        # Calculate returns
        data['returns'] = data[price_column].pct_change()
        
        # Calculate volatility (standard deviation of returns)
        overall_volatility = float(data['returns'].std() * np.sqrt(252))  # Annualized volatility
        
        # Calculate rolling volatility
        rolling_vol = data['returns'].rolling(window=window).std() * np.sqrt(252)
        
        # Recent volatility (last window period)
        recent_volatility = float(rolling_vol.iloc[-1]) if not np.isnan(rolling_vol.iloc[-1]) else None
        
        # Volatility trend
        vol_trend = "increasing" if rolling_vol.iloc[-1] > rolling_vol.iloc[-window//2] else "decreasing"
        
        # Max drawdown
        cum_returns = (1 + data['returns']).cumprod()
        running_max = cum_returns.cummax()
        drawdown = (cum_returns / running_max) - 1
        max_drawdown = float(drawdown.min())
        
        return {
            'analysis_type': 'volatility',
            'price_column': price_column,
            'overall_volatility': overall_volatility,
            'recent_volatility': recent_volatility,
            'volatility_window': window,
            'volatility_trend': vol_trend,
            'max_drawdown': max_drawdown,
            'sharpe_ratio': float(data['returns'].mean() * 252 / (data['returns'].std() * np.sqrt(252))) if data['returns'].std() > 0 else 0
        }
    except Exception as e:
        return {'error': str(e), 'analysis_type': 'volatility'}

def perform_regression_analysis(data: pd.DataFrame, parameters: Dict[str, Any]):
    """Perform regression analysis on the data"""
    try:
        from sklearn.linear_model import LinearRegression
        from sklearn.metrics import r2_score, mean_squared_error
        
        # Extract parameters
        dependent_var = parameters.get('dependent_var')
        independent_vars = parameters.get('independent_vars', [])
        
        if not dependent_var:
            # Try to infer the dependent variable (usually the last column)
            numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
            if numeric_cols:
                dependent_var = numeric_cols[-1]
            else:
                raise ValueError("No numeric columns found for regression analysis")
        
        if not independent_vars:
            # Use all other numeric columns except the dependent variable
            numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
            independent_vars = [col for col in numeric_cols if col != dependent_var]
        
        # Prepare data
        y = data[dependent_var].values
        X = data[independent_vars].values
        
        # Fit the model
        model = LinearRegression()
        model.fit(X, y)
        
        # Get predictions
        y_pred = model.predict(X)
        
        # Calculate metrics
        r2 = r2_score(y, y_pred)
        mse = mean_squared_error(y, y_pred)
        
        # Prepare coefficients
        coefficients = {}
        for i, var in enumerate(independent_vars):
            coefficients[var] = float(model.coef_[i])
        
        return {
            'analysis_type': 'regression',
            'dependent_var': dependent_var,
            'independent_vars': independent_vars,
            'coefficients': coefficients,
            'intercept': float(model.intercept_),
            'r_squared': float(r2),
            'mean_squared_error': float(mse),
            'model_summary': {
                'formula': f"{dependent_var} = {model.intercept_:.4f} + " + " + ".join([f"{coef:.4f}*{var}" for var, coef in coefficients.items()])
            }
        }
    except Exception as e:
        return {'error': str(e), 'analysis_type': 'regression'}

def perform_summary_statistics(data: pd.DataFrame, parameters: Dict[str, Any]):
    """Calculate summary statistics for the data"""
    try:
        # Get columns to analyze (default to all numeric columns)
        columns = parameters.get('columns', data.select_dtypes(include=[np.number]).columns.tolist())
        
        # Calculate statistics
        summary = {}
        for col in columns:
            col_data = data[col].dropna()
            if len(col_data) > 0:
                summary[col] = {
                    'mean': float(col_data.mean()),
                    'median': float(col_data.median()),
                    'min': float(col_data.min()),
                    'max': float(col_data.max()),
                    'std': float(col_data.std()),
                    'count': int(col_data.count()),
                    'missing': int(data[col].isna().sum()),
                    'percentiles': {
                        '25%': float(col_data.quantile(0.25)),
                        '50%': float(col_data.quantile(0.5)),
                        '75%': float(col_data.quantile(0.75)),
                        '90%': float(col_data.quantile(0.9)),
                        '95%': float(col_data.quantile(0.95))
                    }
                }
        
        return {
            'analysis_type': 'summary',
            'num_rows': len(data),
            'num_columns_analyzed': len(columns),
            'statistics': summary
        }
    except Exception as e:
        return {'error': str(e), 'analysis_type': 'summary'}
