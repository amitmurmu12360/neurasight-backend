/**
 * Agent 2: Math Auditor - Type Definitions
 * =========================================
 * Strictly typed interfaces for mathematical verification outputs.
 */

/**
 * Critical Integrity Exception
 * Thrown when critical statistical fields are missing - forces Agent 0 re-scan
 */
export class CriticalIntegrityException extends Error {
  constructor(
    message: string,
    public missingFields: string[],
    public requiresReScan: boolean = true
  ) {
    super(message);
    this.name = "CriticalIntegrityException";
  }
}

/**
 * Standardized Metric Audit Result
 * Output format for each audited metric (Source of Truth)
 */
export interface MetricAuditResult {
  /** Raw value from data source */
  raw_value: number;
  /** Calculated growth (YoY/MoM) */
  calculated_growth?: number;
  /** Benchmarked status from Sovereign Policy Hub */
  benchmarked_status: "healthy" | "warning" | "critical" | "unknown";
  /** Math integrity hash (SHA-256 hash of raw_value + calculated_growth) */
  math_integrity_hash: string;
  /** Verification passed */
  verified: boolean;
  /** Policy threshold that was checked */
  threshold?: {
    min?: number;
    max?: number;
    target?: number;
  };
}

/**
 * Precision Helper for Financial Calculations
 * Prevents floating-point errors using fixed decimal precision
 */
export class PrecisionHelper {
  /**
   * Round to specified decimal places (prevents 60.5 vs 60.6 mismatches)
   */
  static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Compare two numbers with strict threshold (0.01% variance)
   */
  static compareWithThreshold(
    value1: number,
    value2: number,
    thresholdPercent: number = 0.01
  ): boolean {
    if (value1 === 0 && value2 === 0) return true;
    if (value1 === 0 || value2 === 0) return false;
    
    const difference = Math.abs(value1 - value2);
    const percentVariance = (difference / Math.max(Math.abs(value1), Math.abs(value2))) * 100;
    
    return percentVariance <= thresholdPercent;
  }

  /**
   * Calculate percentage change with precision
   */
  static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    const growth = ((current - previous) / previous) * 100;
    return this.round(growth, 4);
  }
}

/**
 * Generate math integrity hash
 * SHA-256 hash of metric values for verification
 */
export function generateMathIntegrityHash(
  rawValue: number,
  calculatedGrowth?: number
): string {
  // Simple hash function (in production, use crypto.subtle.digest)
  const data = `${rawValue}:${calculatedGrowth ?? 0}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

