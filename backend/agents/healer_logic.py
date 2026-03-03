"""
Sovereign Healer Module - Deterministic Mathematical Healing
===========================================================
Identifies and corrects mathematical mismatches in datasets based on Agent 2's formula logic.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging

logger = logging.getLogger("neurasight.healer")


def heal_mathematical_mismatches(
    df: pd.DataFrame,
    target_col: str,
    formula_logic: Dict[str, Any],
    tolerance: float = 0.05
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Heal mathematical mismatches in a DataFrame based on formula logic from Agent 2.
    
    Args:
        df: Input DataFrame containing the data
        target_col: Column name to heal (e.g., 'Revenue', 'ARR')
        formula_logic: Dictionary containing formula information from Agent 2:
            - 'formula': String formula (e.g., "SUM(sub_category_1, sub_category_2)")
            - 'source_columns': List of column names used in the formula
            - 'expected_total': Optional expected total value
        tolerance: Tolerance percentage for mismatch detection (default: 5%)
    
    Returns:
        Tuple of (healed_dataframe, healing_report):
        - healed_dataframe: DataFrame with 'proposed_value' shadow column
        - healing_report: Dictionary containing:
            - 'rows_healed': List of dicts with row_id, original_value, corrected_value
            - 'total_mismatches': Number of rows that needed healing
            - 'healing_applied': Boolean indicating if any healing was applied
    """
    
    if target_col not in df.columns:
        logger.warning(f"Target column '{target_col}' not found in DataFrame")
        return df, {
            "rows_healed": [],
            "total_mismatches": 0,
            "healing_applied": False,
            "error": f"Target column '{target_col}' not found"
        }
    
    # Initialize healing report
    healing_report = {
        "rows_healed": [],
        "total_mismatches": 0,
        "healing_applied": False,
        "formula_used": formula_logic.get("formula", "Unknown"),
    }
    
    # Create a copy to avoid modifying original
    healed_df = df.copy()
    
    # Initialize shadow column for proposed values
    healed_df["proposed_value"] = healed_df[target_col].copy()
    
    # Extract formula information
    formula = formula_logic.get("formula", "")
    source_columns = formula_logic.get("source_columns", [])
    expected_total = formula_logic.get("expected_total")
    
    # If we have source columns, calculate expected values row by row
    if source_columns and all(col in df.columns for col in source_columns):
        logger.info(f"Healing '{target_col}' using formula: {formula}")
        logger.info(f"Source columns: {source_columns}")
        
        # Calculate expected value for each row based on source columns
        for idx in healed_df.index:
            row = healed_df.loc[idx]
            actual_value = row[target_col]
            
            # Calculate expected value from source columns
            # For SUM formulas, sum the source columns
            if "SUM" in formula.upper() or "sum" in formula.lower():
                expected_value = sum(
                    pd.to_numeric(row[col], errors='coerce') 
                    for col in source_columns 
                    if pd.notna(row.get(col))
                )
            # For other formulas, try to evaluate
            else:
                # Simple evaluation: sum of source columns
                expected_value = sum(
                    pd.to_numeric(row[col], errors='coerce') 
                    for col in source_columns 
                    if pd.notna(row.get(col))
                )
            
            # Convert to numeric, handling NaN
            actual_numeric = pd.to_numeric(actual_value, errors='coerce')
            expected_numeric = pd.to_numeric(expected_value, errors='coerce')
            
            if pd.isna(actual_numeric) or pd.isna(expected_numeric):
                continue
            
            # Calculate percentage difference
            if expected_numeric != 0:
                diff_percent = abs((actual_numeric - expected_numeric) / expected_numeric) * 100
            else:
                diff_percent = 100 if actual_numeric != 0 else 0
            
            # If difference exceeds tolerance, mark for healing
            if diff_percent > (tolerance * 100):
                # Store original value
                original_value = actual_numeric
                corrected_value = expected_numeric
                
                # Update proposed value
                healed_df.loc[idx, "proposed_value"] = corrected_value
                
                # Add to healing report
                healing_report["rows_healed"].append({
                    "row_id": int(idx),
                    "original_value": float(original_value),
                    "corrected_value": float(corrected_value),
                    "difference_percent": float(diff_percent),
                    "target_column": target_col,
                })
                healing_report["total_mismatches"] += 1
        
        healing_report["healing_applied"] = healing_report["total_mismatches"] > 0
        
    # If we have an expected total, verify against sum of target column
    elif expected_total is not None:
        logger.info(f"Healing '{target_col}' using expected total: {expected_total}")
        
        # Calculate actual total
        actual_total = pd.to_numeric(healed_df[target_col], errors='coerce').sum()
        expected_total_numeric = pd.to_numeric(expected_total, errors='coerce')
        
        if pd.notna(actual_total) and pd.notna(expected_total_numeric):
            # Calculate difference
            diff_percent = abs((actual_total - expected_total_numeric) / expected_total_numeric) * 100
            
            if diff_percent > (tolerance * 100):
                # Distribute the difference proportionally across rows
                if actual_total != 0:
                    scale_factor = expected_total_numeric / actual_total
                    
                    for idx in healed_df.index:
                        row = healed_df.loc[idx]
                        original_value = pd.to_numeric(row[target_col], errors='coerce')
                        
                        if pd.notna(original_value):
                            corrected_value = original_value * scale_factor
                            healed_df.loc[idx, "proposed_value"] = corrected_value
                            
                            # Add to healing report if significant change
                            if abs(original_value - corrected_value) > (original_value * tolerance):
                                healing_report["rows_healed"].append({
                                    "row_id": int(idx),
                                    "original_value": float(original_value),
                                    "corrected_value": float(corrected_value),
                                    "difference_percent": float(abs((original_value - corrected_value) / original_value) * 100),
                                    "target_column": target_col,
                                })
                    
                    healing_report["total_mismatches"] = len(healing_report["rows_healed"])
                    healing_report["healing_applied"] = healing_report["total_mismatches"] > 0
    
    else:
        logger.warning("No valid formula logic provided for healing")
        healing_report["error"] = "No valid formula logic provided"
    
    logger.info(f"Healing complete: {healing_report['total_mismatches']} rows healed")
    
    return healed_df, healing_report

