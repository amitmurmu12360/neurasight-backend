"""
Agent 0: The Janitor - Data Cleaning & Feature Vector Calculator
================================================================
Runs in E2B sandbox to provide 100% mathematical precision for industry detection.
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
import re

def clean_numeric_value(value: Any) -> Optional[float]:
    """
    Clean numeric values by stripping currency symbols and handling suffixes.
    Examples: "$24.3M" -> 24.3, "132%" -> 132.0, "₹1,234.56" -> 1234.56
    """
    if pd.isna(value) or value is None:
        return None
    
    # Convert to string for processing
    value_str = str(value).strip()
    
    # Remove currency symbols and commas
    value_str = re.sub(r'[₹$€£¥,\s]', '', value_str)
    
    # Handle percentage
    is_percentage = '%' in value_str
    value_str = value_str.replace('%', '')
    
    # Handle suffixes (M, K, B)
    multiplier = 1.0
    if value_str.upper().endswith('M'):
        multiplier = 1_000_000
        value_str = value_str[:-1]
    elif value_str.upper().endswith('K'):
        multiplier = 1_000
        value_str = value_str[:-1]
    elif value_str.upper().endswith('B'):
        multiplier = 1_000_000_000
        value_str = value_str[:-1]
    
    try:
        numeric_value = float(value_str) * multiplier
        return numeric_value
    except (ValueError, TypeError):
        return None

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean the dataframe:
    1. Strip currency symbols from numeric columns
    2. Handle null values (fillna with mean for numeric, mode for categorical)
    3. Convert date columns to datetime objects
    """
    df_cleaned = df.copy()
    
    # Identify numeric columns (excluding dates)
    numeric_columns = []
    date_columns = []
    categorical_columns = []
    
    for col in df_cleaned.columns:
        # Check if column contains dates
        if df_cleaned[col].dtype == 'object':
            # Try to detect date columns
            sample_values = df_cleaned[col].dropna().head(10)
            is_date = False
            for val in sample_values:
                try:
                    pd.to_datetime(val)
                    is_date = True
                    break
                except:
                    pass
            
            if is_date:
                date_columns.append(col)
            else:
                # Check if it's numeric with currency symbols
                sample_str = str(sample_values.iloc[0]) if len(sample_values) > 0 else ""
                if any(char in sample_str for char in ['$', '₹', '€', '£', '%', 'M', 'K', 'B']):
                    numeric_columns.append(col)
                else:
                    categorical_columns.append(col)
        elif pd.api.types.is_numeric_dtype(df_cleaned[col]):
            numeric_columns.append(col)
    
    # Clean numeric columns (strip currency symbols)
    for col in numeric_columns:
        df_cleaned[col] = df_cleaned[col].apply(clean_numeric_value)
    
    # Convert date columns to datetime
    for col in date_columns:
        try:
            df_cleaned[col] = pd.to_datetime(df_cleaned[col], errors='coerce')
        except:
            pass
    
    # Handle null values
    for col in numeric_columns:
        if df_cleaned[col].isna().any():
            mean_value = df_cleaned[col].mean()
            if pd.notna(mean_value):
                df_cleaned[col].fillna(mean_value, inplace=True)
    
    for col in categorical_columns:
        if df_cleaned[col].isna().any():
            mode_value = df_cleaned[col].mode()
            if len(mode_value) > 0:
                df_cleaned[col].fillna(mode_value[0], inplace=True)
    
    return df_cleaned

def calculate_feature_vector(df: pd.DataFrame, primary_amount_column: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculate Symbolic Feature Vector: V = [σ²(amount), Δ(time), ρ(sparsity)]
    
    Returns:
        {
            "variance_amount": float,  # σ²(amount) - Variance of transaction amounts
            "time_delta": float,       # Δ(time) - Average time between transactions (days)
            "sparsity": float          # ρ(sparsity) - Ratio of unique customers to total transactions
        }
    """
    feature_vector = {
        "variance_amount": 0.0,
        "time_delta": 30.0,  # Default to monthly
        "sparsity": 0.5,     # Default to medium sparsity
    }
    
    # 1. Calculate variance_amount (σ²)
    if primary_amount_column and primary_amount_column in df.columns:
        amounts = df[primary_amount_column].dropna()
        if len(amounts) > 0:
            variance = amounts.var()
            feature_vector["variance_amount"] = float(variance) if pd.notna(variance) else 0.0
    else:
        # Auto-detect primary amount column (largest numeric column)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            # Find column with highest mean (likely the primary revenue/amount column)
            max_mean = -1
            primary_col = None
            for col in numeric_cols:
                col_mean = df[col].mean()
                if pd.notna(col_mean) and col_mean > max_mean:
                    max_mean = col_mean
                    primary_col = col
            
            if primary_col:
                amounts = df[primary_col].dropna()
                if len(amounts) > 0:
                    variance = amounts.var()
                    feature_vector["variance_amount"] = float(variance) if pd.notna(variance) else 0.0
                    primary_amount_column = primary_col
    
    # 2. Calculate time_delta (Δ) - Average difference in days between consecutive transactions
    date_columns = df.select_dtypes(include=['datetime64']).columns
    if len(date_columns) > 0:
        date_col = date_columns[0]  # Use first date column
        dates = df[date_col].dropna().sort_values()
        if len(dates) > 1:
            deltas = []
            for i in range(1, len(dates)):
                delta = (dates.iloc[i] - dates.iloc[i-1]).days
                if delta > 0 and delta < 365:  # Sanity check: between 0 and 1 year
                    deltas.append(delta)
            if len(deltas) > 0:
                avg_delta = np.mean(deltas)
                feature_vector["time_delta"] = float(avg_delta)
    else:
        # Try to detect date columns in object columns
        for col in df.select_dtypes(include=['object']).columns:
            try:
                dates = pd.to_datetime(df[col], errors='coerce').dropna().sort_values()
                if len(dates) > 1:
                    deltas = []
                    for i in range(1, len(dates)):
                        delta = (dates.iloc[i] - dates.iloc[i-1]).days
                        if delta > 0 and delta < 365:
                            deltas.append(delta)
                    if len(deltas) > 0:
                        avg_delta = np.mean(deltas)
                        feature_vector["time_delta"] = float(avg_delta)
                        break
            except:
                pass
    
    # 3. Calculate sparsity (ρ) - Ratio of unique customers to total transactions
    # Look for customer/ID columns
    customer_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in 
                     ['customer', 'id', 'user', 'client', 'account', 'order', 'transaction'])]
    
    if len(customer_columns) > 0:
        customer_col = customer_columns[0]
        unique_customers = df[customer_col].nunique()
        total_transactions = len(df)
        if total_transactions > 0:
            # Sparsity = 1 - (unique_customers / total_transactions)
            # High sparsity (close to 1) = many repeat transactions (transactional)
            # Low sparsity (close to 0) = mostly unique transactions (subscription)
            sparsity = 1 - (unique_customers / total_transactions)
            feature_vector["sparsity"] = float(sparsity)
    else:
        # If no customer column, estimate sparsity from variance pattern
        # High variance suggests transactional (high sparsity)
        if feature_vector["variance_amount"] > 1000:
            feature_vector["sparsity"] = 0.7  # High sparsity (transactional)
        elif feature_vector["variance_amount"] < 100:
            feature_vector["sparsity"] = 0.3  # Low sparsity (subscription)
    
    return feature_vector

def calculate_summary_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate summary statistics for the cleaned dataframe.
    
    CRITICAL: This function MUST calculate mean, std (standard deviation), min, and max
    for ALL numeric columns, including object columns that were converted to numeric.
    These stats are required by Agent 2 (Math Auditor) for verification.
    """
    stats = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "numeric_columns": [],
        "categorical_columns": [],
        "date_columns": [],
    }
    
    for col in df.columns:
        if df[col].dtype == 'datetime64[ns]':
            stats["date_columns"].append(col)
        elif pd.api.types.is_numeric_dtype(df[col]):
            # Standard numeric column - calculate all stats
            col_data = df[col].dropna()
            if len(col_data) > 0:
                stats["numeric_columns"].append({
                    "name": col,
                    "mean": float(col_data.mean()) if pd.notna(col_data.mean()) else None,
                    "std": float(col_data.std()) if pd.notna(col_data.std()) and len(col_data) > 1 else 0.0,  # std requires at least 2 values
                    "min": float(col_data.min()) if pd.notna(col_data.min()) else None,
                    "max": float(col_data.max()) if pd.notna(col_data.max()) else None,
                })
            else:
                # Column exists but all values are NaN
                stats["numeric_columns"].append({
                    "name": col,
                    "mean": None,
                    "std": None,
                    "min": None,
                    "max": None,
                })
        else:
            # Check if object column contains numeric data (after cleaning)
            # This handles columns that were cleaned by clean_dataframe but still have object dtype
            try:
                # Try to convert to numeric (handles cleaned numeric strings)
                numeric_series = pd.to_numeric(df[col], errors='coerce').dropna()
                if len(numeric_series) > 0 and numeric_series.notna().sum() > len(df[col]) * 0.5:  # At least 50% numeric
                    # Treat as numeric column
                    stats["numeric_columns"].append({
                        "name": col,
                        "mean": float(numeric_series.mean()) if pd.notna(numeric_series.mean()) else None,
                        "std": float(numeric_series.std()) if pd.notna(numeric_series.std()) and len(numeric_series) > 1 else 0.0,
                        "min": float(numeric_series.min()) if pd.notna(numeric_series.min()) else None,
                        "max": float(numeric_series.max()) if pd.notna(numeric_series.max()) else None,
                    })
                else:
                    # Categorical column
                    stats["categorical_columns"].append({
                        "name": col,
                        "unique_count": int(df[col].nunique()),
                        "mode": str(df[col].mode().iloc[0]) if len(df[col].mode()) > 0 else None,
                    })
            except Exception:
                # If conversion fails, treat as categorical
                stats["categorical_columns"].append({
                    "name": col,
                    "unique_count": int(df[col].nunique()),
                    "mode": str(df[col].mode().iloc[0]) if len(df[col].mode()) > 0 else None,
                })
    
    return stats

def main(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to clean data and calculate feature vector.
    
    Input:
        {
            "data": List[Dict] or DataFrame JSON,
            "primary_amount_column": Optional[str]  # Column name for primary amount/revenue
        }
    
    Output:
        {
            "cleaned_headers": List[str],
            "summary_stats": Dict,
            "feature_vector": {
                "variance_amount": float,
                "time_delta": float,
                "sparsity": float
            }
        }
    """
    try:
        # Load data
        if isinstance(input_data, dict) and "data" in input_data:
            data = input_data["data"]
            primary_amount_column = input_data.get("primary_amount_column")
        else:
            data = input_data
            primary_amount_column = None
        
        # Convert to DataFrame
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = pd.DataFrame(data)
        
        if df.empty:
            return {
                "error": "Empty dataframe",
                "cleaned_headers": [],
                "summary_stats": {},
                "feature_vector": {
                    "variance_amount": 0.0,
                    "time_delta": 30.0,
                    "sparsity": 0.5,
                }
            }
        
        # Clean data
        df_cleaned = clean_dataframe(df)
        
        # Calculate feature vector
        feature_vector = calculate_feature_vector(df_cleaned, primary_amount_column)
        
        # Calculate summary stats
        summary_stats = calculate_summary_stats(df_cleaned)
        
        # Return results
        return {
            "cleaned_headers": list(df_cleaned.columns),
            "summary_stats": summary_stats,
            "feature_vector": feature_vector,
            "success": True,
        }
    
    except Exception as e:
        return {
            "error": str(e),
            "cleaned_headers": [],
            "summary_stats": {},
            "feature_vector": {
                "variance_amount": 0.0,
                "time_delta": 30.0,
                "sparsity": 0.5,
            },
            "success": False,
        }

# Entry point for E2B sandbox
if __name__ == "__main__":
    import sys
    
    # Read input from stdin
    input_json = sys.stdin.read()
    input_data = json.loads(input_json)
    
    # Process and output
    result = main(input_data)
    print(json.dumps(result, indent=2))

