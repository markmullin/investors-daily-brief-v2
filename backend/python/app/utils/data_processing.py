import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import json
import re

def process_financial_data(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Process financial data from a list of dictionaries to a pandas DataFrame
    
    Args:
        data: List of dictionaries containing financial data
        
    Returns:
        Processed pandas DataFrame
    """
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Convert date columns to datetime if present
    date_columns = identify_date_columns(df)
    for col in date_columns:
        df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Handle missing values
    df = handle_missing_values(df)
    
    # Detect and standardize OHLC columns
    df = standardize_ohlc_columns(df)
    
    # Add derived columns for financial analysis
    df = add_derived_columns(df)
    
    return df

def identify_date_columns(df: pd.DataFrame) -> List[str]:
    """Identify potential date/timestamp columns in the DataFrame"""
    date_columns = []
    
    # Check column names first
    date_patterns = ['date', 'time', 'timestamp', 'day', 'month', 'year']
    for col in df.columns:
        if any(pattern in col.lower() for pattern in date_patterns):
            date_columns.append(col)
    
    # If no date columns found by name, try to detect date patterns in string columns
    if not date_columns:
        for col in df.select_dtypes(include=['object']).columns:
            # Sample the first 5 non-null values
            sample = df[col].dropna().head(5).tolist()
            
            # Check if samples look like dates
            try:
                if sample and all(isinstance(val, str) for val in sample):
                    # Try converting to datetime
                    pd.to_datetime(sample)
                    date_columns.append(col)
            except:
                continue
    
    return date_columns

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values in the DataFrame"""
    # For numeric columns, fill NaN with median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        df[col] = df[col].fillna(df[col].median())
    
    # For categorical columns, fill with most frequent value
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in categorical_cols:
        if df[col].notna().any():  # Only if there are some non-null values
            most_frequent = df[col].mode()[0] if not df[col].mode().empty else None
            df[col] = df[col].fillna(most_frequent)
    
    # For date columns, forward fill (assume last known date)
    date_cols = df.select_dtypes(include=['datetime64']).columns
    for col in date_cols:
        df[col] = df[col].fillna(method='ffill')
    
    return df

def standardize_ohlc_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Detect and standardize OHLC (Open, High, Low, Close) columns"""
    # Define patterns for OHLC columns
    ohlc_patterns = {
        'open': ['open', 'opening', 'first'],
        'high': ['high', 'max', 'maximum', 'highest'],
        'low': ['low', 'min', 'minimum', 'lowest'],
        'close': ['close', 'closing', 'last']
    }
    
    # Try to identify OHLC columns
    ohlc_columns = {}
    for ohlc_type, patterns in ohlc_patterns.items():
        for col in df.columns:
            if any(pattern in col.lower() for pattern in patterns):
                ohlc_columns[ohlc_type] = col
                break
    
    # If we found all OHLC columns, standardize their names if needed
    if len(ohlc_columns) == 4:
        for ohlc_type, col in ohlc_columns.items():
            if col != ohlc_type.capitalize():
                df[ohlc_type.capitalize()] = df[col]
    
    return df

def add_derived_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Add derived columns useful for financial analysis"""
    # Check if we have OHLC data
    has_ohlc = all(col in df.columns for col in ['Open', 'High', 'Low', 'Close'])
    
    if has_ohlc:
        # Add typical price
        df['TypicalPrice'] = (df['High'] + df['Low'] + df['Close']) / 3
        
        # Add daily returns
        df['Returns'] = df['Close'].pct_change()
        
        # Add trading range
        df['Range'] = df['High'] - df['Low']
        
        # Add simple moving averages
        for window in [5, 10, 20, 50, 200]:
            if len(df) >= window:
                df[f'SMA_{window}'] = df['Close'].rolling(window=window).mean()
        
        # Add volatility (20-day rolling standard deviation of returns)
        if len(df) >= 20:
            df['Volatility_20d'] = df['Returns'].rolling(window=20).std() * np.sqrt(252)  # Annualized
    
    return df

def convert_df_to_json(df: pd.DataFrame) -> str:
    """Convert a DataFrame to JSON string in a format suitable for visualization"""
    # Handle datetime columns
    for col in df.select_dtypes(include=['datetime64']).columns:
        df[col] = df[col].dt.strftime('%Y-%m-%d')
    
    # Convert to dictionary records
    records = df.to_dict(orient='records')
    
    # Convert to JSON string
    return json.dumps(records)

def identify_time_frequency(df: pd.DataFrame) -> str:
    """
    Identify the time frequency of the data (daily, weekly, monthly, etc.)
    
    Args:
        df: DataFrame with a datetime index or column
        
    Returns:
        String indicating the time frequency
    """
    # Try to get datetime column
    date_cols = df.select_dtypes(include=['datetime64']).columns
    
    if len(date_cols) == 0:
        return "unknown"
    
    date_col = date_cols[0]
    
    # Sort by date and get differences
    sorted_df = df.sort_values(date_col)
    date_diffs = sorted_df[date_col].diff().dropna()
    
    if len(date_diffs) == 0:
        return "unknown"
    
    # Get the most common difference
    most_common_diff = date_diffs.mode()[0]
    days = most_common_diff.days
    
    # Determine frequency
    if days == 0:
        return "intraday"
    elif days == 1:
        return "daily"
    elif 2 <= days <= 3:
        return "custom"
    elif 4 <= days <= 8:
        return "weekly"
    elif 15 <= days <= 45:
        return "monthly"
    elif 60 <= days <= 100:
        return "quarterly"
    elif 350 <= days <= 380:
        return "yearly"
    else:
        return "custom"

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Clean column names to remove spaces, special characters, etc."""
    clean_df = df.copy()
    
    # Function to clean a column name
    def clean_name(name):
        # Convert to string
        name = str(name)
        # Replace spaces and special characters with underscore
        name = re.sub(r'[^\w\s]', '', name)
        name = re.sub(r'\s+', '_', name)
        # Ensure it starts with a letter
        if not name[0].isalpha():
            name = 'col_' + name
        return name
    
    # Clean all column names
    clean_df.columns = [clean_name(col) for col in clean_df.columns]
    
    return clean_df

def detect_outliers(df: pd.DataFrame, columns=None, method='zscore', threshold=3.0) -> pd.DataFrame:
    """
    Detect outliers in numeric columns
    
    Args:
        df: DataFrame to process
        columns: List of columns to check, or None for all numeric columns
        method: 'zscore' or 'iqr'
        threshold: Z-score threshold or IQR multiplier
        
    Returns:
        DataFrame with outlier flags
    """
    result_df = df.copy()
    
    # If no columns specified, use all numeric columns
    if columns is None:
        columns = df.select_dtypes(include=[np.number]).columns
    
    # Create a DataFrame to store outlier flags
    outliers_df = pd.DataFrame(index=df.index)
    
    for col in columns:
        if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
            continue
            
        # Get values
        values = df[col].dropna()
        
        if method == 'zscore':
            # Calculate Z-scores
            mean = values.mean()
            std = values.std()
            if std == 0:  # Avoid division by zero
                outliers_df[f'{col}_outlier'] = False
                continue
                
            z_scores = (df[col] - mean) / std
            outliers_df[f'{col}_outlier'] = abs(z_scores) > threshold
            
        elif method == 'iqr':
            # Calculate IQR
            q1 = values.quantile(0.25)
            q3 = values.quantile(0.75)
            iqr = q3 - q1
            
            # Define bounds
            lower_bound = q1 - (threshold * iqr)
            upper_bound = q3 + (threshold * iqr)
            
            # Identify outliers
            outliers_df[f'{col}_outlier'] = (df[col] < lower_bound) | (df[col] > upper_bound)
    
    # Add outlier flags to result
    result_df = pd.concat([result_df, outliers_df], axis=1)
    
    return result_df
