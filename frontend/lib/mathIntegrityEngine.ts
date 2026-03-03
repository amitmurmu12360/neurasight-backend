/**
 * Quantum Math Integrity Engine
 * =============================
 * Statistical verification using deterministic calculations.
 * Facts overwrite Hallucinations.
 * 
 * Palette: #000000, #10b981 (Emerald), #06b6d4 (Cyan)
 */

export interface StatisticalVerification {
  mean: number;
  median: number;
  mode: number | null;
  zScores: number[];
  iqr: number;
  entityIntegrity: boolean;
  confidence: number; // 0-1
  anomalies: Array<{
    index: number;
    value: number;
    zScore: number;
    reason: string;
  }>;
}

export interface ToleranceLevel {
  name: "STRICT" | "STANDARD" | "AGILE";
  tolerance: number; // Percentage (0, 0.5, 2)
}

export const TOLERANCE_LEVELS: ToleranceLevel[] = [
  { name: "STRICT", tolerance: 0 },
  { name: "STANDARD", tolerance: 0.5 },
  { name: "AGILE", tolerance: 2 },
];

/**
 * Calculate Mean
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate Median
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate Mode
 */
function calculateMode(values: number[]): number | null {
  if (values.length === 0) return null;
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;

  for (const val of values) {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  }

  // If all values are unique, return null
  if (maxFreq === 1) return null;
  return mode;
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate Z-Score: Z = (x - μ) / σ
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate Interquartile Range (IQR)
 */
function calculateIQR(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  return q3 - q1;
}

/**
 * Detect outliers using IQR method
 */
function detectOutliersIQR(values: number[]): Array<{ index: number; value: number; reason: string }> {
  const iqr = calculateIQR(values);
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: Array<{ index: number; value: number; reason: string }> = [];
  values.forEach((val, index) => {
    if (val < lowerBound || val > upperBound) {
      outliers.push({
        index,
        value: val,
        reason: val < lowerBound ? "Below Q1 - 1.5*IQR" : "Above Q3 + 1.5*IQR",
      });
    }
  });

  return outliers;
}

/**
 * Verify Entity Integrity: Cross-verify sub-category sums match parent totals
 */
function verifyEntityIntegrity(
  data: Array<Record<string, unknown>>,
  parentColumn: string,
  subColumns: string[]
): boolean {
  if (!data || data.length === 0) return true;

  for (const row of data) {
    const parentValue = typeof row[parentColumn] === "number" ? row[parentColumn] : 0;
    const subSum = subColumns.reduce((sum, col) => {
      const val = typeof row[col] === "number" ? row[col] : 0;
      return sum + val;
    }, 0);

    // Allow 0.1% tolerance for floating point errors
    const tolerance = Math.abs(parentValue * 0.001);
    if (Math.abs(parentValue - subSum) > tolerance) {
      return false;
    }
  }

  return true;
}

/**
 * Perform Statistical Verification
 */
export function performStatisticalVerification(
  values: number[],
  entityData?: Array<Record<string, unknown>>,
  parentColumn?: string,
  subColumns?: string[]
): StatisticalVerification {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: null,
      zScores: [],
      iqr: 0,
      entityIntegrity: true,
      confidence: 0,
      anomalies: [],
    };
  }

  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const mode = calculateMode(values);
  const stdDev = calculateStdDev(values, mean);
  const zScores = values.map((val) => calculateZScore(val, mean, stdDev));
  const iqr = calculateIQR(values);

  // Detect outliers
  const outliers = detectOutliersIQR(values);
  const anomalies = outliers.map((outlier) => ({
    ...outlier,
    zScore: zScores[outlier.index],
  }));

  // Verify entity integrity if provided
  let entityIntegrity = true;
  if (entityData && parentColumn && subColumns) {
    entityIntegrity = verifyEntityIntegrity(entityData, parentColumn, subColumns);
  }

  // Calculate confidence based on data quality
  const outlierRatio = anomalies.length / values.length;
  const confidence = Math.max(0, 1 - outlierRatio * 2); // Reduce confidence if >50% outliers

  return {
    mean,
    median,
    mode,
    zScores,
    iqr,
    entityIntegrity,
    confidence,
    anomalies,
  };
}

/**
 * Compare AI narrative value against Python-calculated value
 * Returns true if within tolerance, false if "slap" is needed
 */
export function verifyAgainstTolerance(
  aiValue: number,
  pythonValue: number,
  tolerance: number
): { withinTolerance: boolean; difference: number; differencePercent: number } {
  const difference = Math.abs(aiValue - pythonValue);
  const differencePercent = pythonValue !== 0 ? (difference / pythonValue) * 100 : 0;
  const withinTolerance = differencePercent <= tolerance;

  return {
    withinTolerance,
    difference,
    differencePercent,
  };
}

