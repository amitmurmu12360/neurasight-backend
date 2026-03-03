/**
 * Metric Formatter Utility
 * =========================
 * Formats financial metrics with proper unit scaling (Billion/Million/Thousand)
 * Prevents double-unit suffixes (e.g., $1.2M B)
 */

export type UnitScale = "B" | "M" | "K" | "Raw";

/**
 * Format a numeric value with appropriate unit suffix
 * @param value - The numeric value to format
 * @param currency - Currency symbol (default: "$")
 * @param detectedUnit - Pre-detected unit from Agent 2 (optional)
 * @returns Formatted string (e.g., "$1.2B", "$24.3M", "$1.5K")
 */
export function formatMetric(
  value: number | undefined,
  currency: string = "$",
  detectedUnit?: UnitScale
): string {
  if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
    return "N/A";
  }

  const numValue = typeof value === 'number' ? value : 0;
  if (isNaN(numValue) || numValue === 0) return "N/A";

  // Use detected unit from Agent 2 if available
  const unit = detectedUnit || "Raw";

  // UNIVERSAL FORMATTER: Handle unit mismatch and scaling disasters
  // Step 1: Convert to raw value if unit is provided
  let rawValue = numValue;
  if (unit === "M") {
    rawValue = numValue * 1000000; // Convert millions to raw
  } else if (unit === "K") {
    rawValue = numValue * 1000; // Convert thousands to raw
  } else if (unit === "B") {
    rawValue = numValue * 1000000000; // Convert billions to raw
  }
  // If unit is "Raw", rawValue = numValue (already set)

  // Step 2: Determine appropriate scale from raw value
  const absRawValue = Math.abs(rawValue);
  
  if (absRawValue >= 1000000000) {
    // Value is in billions, convert to B with 2 decimal precision (NEVER more than 2 decimals)
    return `${currency}${(rawValue / 1000000000).toFixed(2)}B`;
  } else if (absRawValue >= 1000000) {
    // Value is in millions, convert to M
    return `${currency}${(rawValue / 1000000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  } else if (absRawValue >= 1000) {
    // Value is in thousands, convert to K
    return `${currency}${(rawValue / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  }
  // Value is raw, display as-is
  return `${currency}${rawValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

