"""
Semantic Ontology Engine - Dynamic Aggregation Type Detection
=============================================================
Uses LLM to map column headers to aggregation types (SUM vs MEAN).
Then performs full-spectrum aggregation on entire dataframe.
"""

import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import json
from pydantic import BaseModel, Field

logger = logging.getLogger("neurasight.semantic_ontology")


# =============================================================================
# PYDANTIC SCHEMA ENFORCEMENT
# =============================================================================
class MetricOntology(BaseModel):
    """Pydantic schema for metric ontology mapping."""
    column_name: str = Field(..., description="Original column name from dataset")
    aggregation_type: str = Field(..., description="Aggregation type: SUM, MEAN, or OTHER")
    standard_metric: Optional[str] = Field(None, description="Standardized metric name (ARR, NRR, etc.)")


class OntologyMappingResponse(BaseModel):
    """Pydantic schema for LLM response."""
    ontology_mapping: Dict[str, str] = Field(..., description="Mapping of column names to aggregation types")


def get_semantic_ontology(
    headers: List[str],
    industry: Optional[str] = None,
    df: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Generate semantic ontology mapping using LLM, then aggregate entire dataframe.
    
    Args:
        headers: List of column names from the dataframe
        industry: Optional industry context (e.g., "SAAS", "RETAIL")
        df: Optional dataframe for full aggregation (if None, returns mapping only)
    
    Returns:
        Dictionary containing:
        - ontology_mapping: { "column_name": "SUM" | "MEAN" | "OTHER" }
        - metrics: { "ARR": sum_val, "NRR": mean_val, ... } (if df provided)
        - total_rows: int (if df provided)
    """
    from google import genai
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        logger.error("[SEMANTIC ONTOLOGY] GEMINI_API_KEY not found")
        return {
            "ontology_mapping": {},
            "metrics": {},
            "total_rows": 0,
            "error": "GEMINI_API_KEY not configured"
        }
    
    # =============================================================================
    # DETERMINISTIC FALLBACK MAPPING (Zero-crash guarantee)
    # =============================================================================
    def get_deterministic_mapping(header: str) -> str:
        """Deterministic fallback for column mapping. Never crashes."""
        header_lower = header.lower()
        
        # Financial totals -> SUM
        if any(term in header_lower for term in ["revenue", "sales", "cost", "profit", "arr", "mrr", "income", "expense", "amount", "total"]):
            return "SUM"
        
        # Ratios/percentages -> MEAN
        if any(term in header_lower for term in ["nrr", "retention", "burn", "churn", "rate", "ratio", "percent", "efficiency", "multiple"]):
            return "MEAN"
        
        # Counts -> SUM
        if any(term in header_lower for term in ["deals", "mql", "customer", "count", "quantity", "number", "units"]):
            return "SUM"
        
        # Dates/IDs/Text -> OTHER
        if any(term in header_lower for term in ["date", "time", "id", "name", "email", "address", "description", "note", "comment"]):
            return "OTHER"
        
        # Default: SUM for numeric-looking columns
        return "SUM"
    
    try:
        # Initialize Gemini client with timeout and retry configuration
        # ONTOLOGY TIMEOUT: Increased to 60s for analyzing 45,000+ rows
        # Gemini needs more "Thinking" time for large datasets
        client = genai.Client(
            api_key=api_key,
            http_options={
                "api_version": "v1",
                "timeout": 60.0  # 60 second timeout for massive datasets (45,000+ rows)
            }
        )
        
        # Build prompt for semantic mapping
        industry_context = f"Industry: {industry.upper()}" if industry else "Industry: Unknown"
        
        prompt = f"""You are a data governance expert. Analyze the following column headers and determine the appropriate aggregation type for each.

{industry_context}

Column Headers:
{json.dumps(headers, indent=2)}

Rules:
1. Financial metrics that represent totals (Revenue, Sales, Cost, Profit, ARR, MRR) -> "SUM"
2. Ratios and percentages (NRR, Retention, Burn_Multiple, Churn, Efficiency) -> "MEAN"
3. Counts and quantities (Deals_Closed, MQLs, Customers) -> "SUM"
4. Dates and IDs -> "OTHER" (no aggregation)
5. Text fields -> "OTHER" (no aggregation)

Return ONLY a valid JSON object with this exact structure:
{{
  "ontology_mapping": {{
    "column_name_1": "SUM",
    "column_name_2": "MEAN",
    "column_name_3": "OTHER"
  }}
}}

Do not include any markdown, explanations, or additional text. Return ONLY the JSON object."""

        # RETRY LOGIC: Retry up to 3 times on RemoteProtocolError or ConnectError
        max_retries = 3
        retry_delay = 2.0  # 2 seconds between retries
        response = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"[SEMANTIC ONTOLOGY] Requesting LLM mapping for {len(headers)} columns (attempt {attempt + 1}/{max_retries})...")
                response = client.models.generate_content(
                    model="models/gemini-2.0-flash",
                    contents=prompt,
                )
                break  # Success, exit retry loop
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                # Check if error is retryable (RemoteProtocolError, ConnectError, timeout)
                is_retryable = (
                    "remoteprotocolerror" in error_str or
                    "connecterror" in error_str or
                    "timeout" in error_str or
                    "connection" in error_str
                )
                
                if is_retryable and attempt < max_retries - 1:
                    logger.warning(f"[SEMANTIC ONTOLOGY] Retryable error on attempt {attempt + 1}: {e}. Retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                else:
                    # Not retryable or final attempt
                    raise e
        
        if not response:
            raise last_error or Exception("Failed to get response from Gemini after retries")
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        # Parse JSON with Pydantic validation
        try:
            ontology_data = json.loads(response_text)
            # Validate with Pydantic schema
            validated_response = OntologyMappingResponse(**ontology_data)
            ontology_mapping = validated_response.ontology_mapping
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"[SEMANTIC ONTOLOGY] LLM response parsing failed: {e}. Using deterministic fallback.")
            ontology_mapping = {}
        
        # Apply deterministic fallback for any unmapped columns
        for header in headers:
            if header not in ontology_mapping:
                ontology_mapping[header] = get_deterministic_mapping(header)
                logger.info(f"[SEMANTIC ONTOLOGY] Applied deterministic mapping: {header} -> {ontology_mapping[header]}")
        
        logger.info(f"[SEMANTIC ONTOLOGY] Mapped {len(ontology_mapping)} columns ({len([h for h in headers if h in ontology_mapping])} from LLM, {len([h for h in headers if h not in ontology_mapping])} from fallback)")
        
        # =============================================================================
        # VECTORIZED AGGREGATION (Full-spectrum, 45,000+ rows)
        # =============================================================================
        metrics = {}
        total_rows = 0
        
        if df is not None and not df.empty:
            total_rows = len(df)
            logger.info(f"[SEMANTIC ONTOLOGY] Performing vectorized aggregation on {total_rows} rows...")
            
            # Map ontology results to standard metric names
            standard_metric_mapping = {
                "ARR": ["arr", "annual_recurring_revenue", "annual recurring revenue"],
                "NRR": ["nrr", "net_retention_rate", "net retention rate", "retention"],
                "BURN_MULTIPLE": ["burn_multiple", "burn multiple", "burn", "burn_rate"],
                "REVENUE": ["revenue", "sales", "income", "total_revenue"],
                "DEALS_CLOSED": ["deals_closed", "deals closed", "closed_deals", "deals"],
                "MQLS": ["mql", "mqls", "marketing_qualified_leads"],
                "CAC": ["cac", "customer_acquisition_cost", "acquisition_cost"],
            }
            
            # Aggregate each column based on ontology mapping (vectorized operations)
            for column_name, agg_type in ontology_mapping.items():
                if column_name not in df.columns:
                    continue
                
                try:
                    # Vectorized numeric conversion (coerces errors to NaN)
                    numeric_series = pd.to_numeric(df[column_name], errors='coerce')
                    
                    # Skip if column has no numeric data
                    if numeric_series.isna().all():
                        logger.warning(f"[SEMANTIC ONTOLOGY] Column '{column_name}' has no numeric data")
                        continue
                    
                    # Vectorized aggregation based on type
                    if agg_type == "SUM":
                        # Use vectorized sum (handles NaN automatically)
                        agg_value = numeric_series.sum()
                        metrics[column_name] = float(agg_value) if not pd.isna(agg_value) else 0.0
                    elif agg_type == "MEAN":
                        # Use vectorized mean (handles NaN automatically)
                        agg_value = numeric_series.mean()
                        metrics[column_name] = float(agg_value) if not pd.isna(agg_value) else 0.0
                    else:
                        # For "OTHER", store count of non-null values (vectorized)
                        metrics[column_name] = int(numeric_series.notna().sum())
                    
                    # Map to standard metric name if applicable
                    column_lower = column_name.lower()
                    for std_metric, aliases in standard_metric_mapping.items():
                        if column_lower in aliases or any(alias in column_lower for alias in aliases):
                            metrics[std_metric] = metrics[column_name]
                            logger.info(f"[SEMANTIC ONTOLOGY] Mapped '{column_name}' to standard metric '{std_metric}'")
                            break
                            
                except Exception as e:
                    logger.warning(f"[SEMANTIC ONTOLOGY] Failed to aggregate {column_name}: {e}")
                    # Apply deterministic fallback
                    metrics[column_name] = 0.0
            
            logger.info(f"[SEMANTIC ONTOLOGY] Vectorized aggregation complete: {len(metrics)} metrics from {total_rows} rows")
        
        return {
            "ontology_mapping": ontology_mapping,
            "metrics": metrics,
            "total_rows": total_rows,
        }
        
    except Exception as e:
        logger.error(f"[SEMANTIC ONTOLOGY] LLM call failed: {e}. Using deterministic fallback for all columns.", exc_info=True)
        # Apply deterministic fallback for ALL columns if LLM fails completely
        ontology_mapping = {}
        for header in headers:
            ontology_mapping[header] = get_deterministic_mapping(header)
        
        logger.info(f"[SEMANTIC ONTOLOGY] Applied deterministic fallback for {len(ontology_mapping)} columns")
        
        # If dataframe provided, perform aggregation with deterministic mapping
        metrics = {}
        total_rows = 0
        
        if df is not None and not df.empty:
            total_rows = len(df)
            logger.info(f"[SEMANTIC ONTOLOGY] Performing vectorized aggregation with deterministic mapping on {total_rows} rows...")
            
            # Standard metric mapping
            standard_metric_mapping = {
                "ARR": ["arr", "annual_recurring_revenue", "annual recurring revenue"],
                "NRR": ["nrr", "net_retention_rate", "net retention rate", "retention"],
                "BURN_MULTIPLE": ["burn_multiple", "burn multiple", "burn", "burn_rate"],
                "REVENUE": ["revenue", "sales", "income", "total_revenue"],
                "DEALS_CLOSED": ["deals_closed", "deals closed", "closed_deals", "deals"],
                "MQLS": ["mql", "mqls", "marketing_qualified_leads"],
                "CAC": ["cac", "customer_acquisition_cost", "acquisition_cost"],
            }
            
            # Aggregate each column (vectorized operations)
            for column_name, agg_type in ontology_mapping.items():
                if column_name not in df.columns:
                    continue
                
                try:
                    numeric_series = pd.to_numeric(df[column_name], errors='coerce')
                    if numeric_series.isna().all():
                        continue
                    
                    if agg_type == "SUM":
                        agg_value = numeric_series.sum()
                        metrics[column_name] = float(agg_value) if not pd.isna(agg_value) else 0.0
                    elif agg_type == "MEAN":
                        agg_value = numeric_series.mean()
                        metrics[column_name] = float(agg_value) if not pd.isna(agg_value) else 0.0
                    else:
                        metrics[column_name] = int(numeric_series.notna().sum())
                    
                    # Map to standard metric name
                    column_lower = column_name.lower()
                    for std_metric, aliases in standard_metric_mapping.items():
                        if column_lower in aliases or any(alias in column_lower for alias in aliases):
                            metrics[std_metric] = metrics[column_name]
                            break
                except Exception as agg_error:
                    logger.warning(f"[SEMANTIC ONTOLOGY] Failed to aggregate {column_name}: {agg_error}")
                    metrics[column_name] = 0.0
        
        return {
            "ontology_mapping": ontology_mapping,
            "metrics": metrics,
            "total_rows": total_rows,
            "error": f"LLM failed, used deterministic fallback: {str(e)}"
        }

