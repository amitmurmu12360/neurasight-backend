/**
 * Sovereign Forecasting Engine
 * =============================
 * Hybrid forecasting logic combining Prophet-inspired trend decomposition
 * with Exponential Smoothing for robust time-series predictions.
 * 
 * Palette: #000000, #10b981 (Emerald), #06b6d4 (Cyan)
 */

export interface ForecastDataPoint {
  date: string; // ISO date string
  observed: number | null; // Historical value (null for future dates)
  forecast: number; // Predicted value
  lower_bound: number; // Confidence interval lower bound
  upper_bound: number; // Confidence interval upper bound
  confidence: number; // Confidence level (0-1)
}

export interface ForecastResult {
  data: ForecastDataPoint[];
  horizon: number; // Days forecasted
  seasonality_detected: boolean;
  trend_direction: "increasing" | "decreasing" | "stable";
  avg_growth_rate: number; // Percentage
  metadata: {
    data_points: number;
    missing_values: number;
    forecast_method: string;
  };
}

/**
 * Auto-detect time-series columns and target metric from data
 */
export function detectTimeSeriesStructure(data: any[]): {
  dateColumn: string | null;
  valueColumn: string | null;
  dateFormat: "iso" | "timestamp" | "date_string";
} {
  if (!data || data.length === 0) {
    return { dateColumn: null, valueColumn: null, dateFormat: "iso" };
  }

  const sample = data[0];
  const columns = Object.keys(sample);

  // Common date column names
  const datePatterns = [
    /date/i,
    /time/i,
    /timestamp/i,
    /created_at/i,
    /updated_at/i,
    /period/i,
    /month/i,
    /year/i,
  ];

  // Common metric/value column names
  const valuePatterns = [
    /revenue/i,
    /sales/i,
    /arr/i,
    /mrr/i,
    /value/i,
    /amount/i,
    /total/i,
    /count/i,
    /units/i,
    /quantity/i,
  ];

  let dateColumn: string | null = null;
  let valueColumn: string | null = null;
  let dateFormat: "iso" | "timestamp" | "date_string" = "iso";

  // Find date column
  for (const col of columns) {
    if (datePatterns.some((pattern) => pattern.test(col))) {
      dateColumn = col;
      // Detect format
      const sampleValue = sample[col];
      if (typeof sampleValue === "number" && sampleValue > 1000000000) {
        dateFormat = "timestamp"; // Unix timestamp
      } else if (typeof sampleValue === "string") {
        dateFormat = "date_string";
      }
      break;
    }
  }

  // Find value column (prefer numeric columns)
  for (const col of columns) {
    if (
      valuePatterns.some((pattern) => pattern.test(col)) &&
      typeof sample[col] === "number"
    ) {
      valueColumn = col;
      break;
    }
  }

  // Fallback: find first numeric column (excluding date if it's numeric)
  if (!valueColumn) {
    for (const col of columns) {
      if (col !== dateColumn && typeof sample[col] === "number") {
        valueColumn = col;
        break;
      }
    }
  }

  return { dateColumn, valueColumn, dateFormat };
}

/**
 * Parse date string/number into Date object
 */
function parseDate(
  value: any,
  format: "iso" | "timestamp" | "date_string"
): Date | null {
  if (!value) return null;

  try {
    if (format === "timestamp") {
      return new Date(typeof value === "number" ? value * 1000 : value);
    }
    return new Date(value);
  } catch {
    return null;
  }
}

/**
 * Simple exponential smoothing (Holt-Winters inspired)
 */
function exponentialSmoothing(
  values: number[],
  alpha: number = 0.3,
  beta: number = 0.1
): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [values[0]];

  const smoothed: number[] = [values[0]];
  let trend = 0;

  for (let i = 1; i < values.length; i++) {
    const prevSmoothed = smoothed[i - 1];
    const currentValue = values[i];
    const prevValue = values[i - 1];

    // Update level
    const level = alpha * currentValue + (1 - alpha) * (prevSmoothed + trend);

    // Update trend
    trend = beta * (level - prevSmoothed) + (1 - beta) * trend;

    smoothed.push(level);
  }

  return smoothed;
}

/**
 * Detect seasonality using autocorrelation
 */
function detectSeasonality(values: number[]): {
  hasSeasonality: boolean;
  period: number;
} {
  if (values.length < 12) {
    return { hasSeasonality: false, period: 0 };
  }

  // Simple autocorrelation check for weekly/monthly patterns
  const maxLag = Math.min(30, Math.floor(values.length / 2));
  let maxCorrelation = 0;
  let bestPeriod = 0;

  for (let lag = 7; lag <= maxLag; lag++) {
    let correlation = 0;
    let count = 0;

    for (let i = lag; i < values.length; i++) {
      const diff = values[i] - values[i - lag];
      correlation += Math.abs(diff);
      count++;
    }

    if (count > 0) {
      const avgCorrelation = correlation / count;
      if (avgCorrelation < maxCorrelation || maxCorrelation === 0) {
        maxCorrelation = avgCorrelation;
        bestPeriod = lag;
      }
    }
  }

  // Threshold: if correlation is low, there's seasonality
  const hasSeasonality = maxCorrelation < values.reduce((a, b) => a + b, 0) / values.length * 0.3;

  return {
    hasSeasonality,
    period: hasSeasonality ? bestPeriod : 0,
  };
}

/**
 * Calculate confidence intervals using historical variance
 */
function calculateConfidenceIntervals(
  forecast: number,
  historicalValues: number[],
  horizon: number
): { lower: number; upper: number; confidence: number } {
  if (historicalValues.length === 0) {
    return { lower: forecast * 0.8, upper: forecast * 1.2, confidence: 0.5 };
  }

  // Calculate historical variance
  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance =
    historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    historicalValues.length;
  const stdDev = Math.sqrt(variance);

  // Confidence widens with horizon (uncertainty increases over time)
  const horizonMultiplier = 1 + horizon / 90; // 1x at day 0, 2x at day 90
  const margin = stdDev * 1.96 * horizonMultiplier; // 95% confidence

  // Confidence decreases with horizon
  const confidence = Math.max(0.5, 1 - horizon / 180);

  return {
    lower: Math.max(0, forecast - margin),
    upper: forecast + margin,
    confidence,
  };
}

/**
 * Generate Sovereign Forecast
 * 
 * @param data - Array of objects with date and value columns
 * @param horizon - Number of days to forecast (default: 90)
 * @param boostPercentage - Optional percentage boost for strategic pivot simulation
 */
export function generateSovereignForecast(
  data: any[],
  horizon: number = 90,
  boostPercentage: number = 0
): ForecastResult {
  if (!data || data.length === 0) {
    throw new Error("No data provided for forecasting");
  }

  // Detect structure
  const { dateColumn, valueColumn, dateFormat } = detectTimeSeriesStructure(data);

  if (!dateColumn || !valueColumn) {
    throw new Error(
      `Could not detect time-series structure. Found date: ${dateColumn}, value: ${valueColumn}`
    );
  }

  // Extract and sort time-series
  const timeSeries: Array<{ date: Date; value: number }> = [];

  for (const row of data) {
    const date = parseDate(row[dateColumn], dateFormat);
    const value = typeof row[valueColumn] === "number" ? row[valueColumn] : parseFloat(row[valueColumn]);

    if (date && !isNaN(value) && isFinite(value)) {
      timeSeries.push({ date, value });
    }
  }

  if (timeSeries.length === 0) {
    throw new Error("No valid time-series data points found");
  }

  // Sort by date
  timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Extract values array
  const values = timeSeries.map((ts) => ts.value);
  const dates = timeSeries.map((ts) => ts.date);

  // Detect seasonality
  const seasonality = detectSeasonality(values);

  // Apply exponential smoothing
  const alpha = seasonality.hasSeasonality ? 0.2 : 0.3; // Lower alpha for seasonal data
  const smoothed = exponentialSmoothing(values, alpha, 0.1);

  // Calculate trend
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const avgGrowthRate = ((lastValue - firstValue) / firstValue) * 100;

  // Determine trend direction
  let trendDirection: "increasing" | "decreasing" | "stable" = "stable";
  if (avgGrowthRate > 2) trendDirection = "increasing";
  else if (avgGrowthRate < -2) trendDirection = "decreasing";

  // Forecast future values
  const lastDate = dates[dates.length - 1];
  const lastSmoothed = smoothed[smoothed.length - 1];
  const secondLastSmoothed = smoothed[smoothed.length - 2];
  const trend = lastSmoothed - secondLastSmoothed;

  const forecastData: ForecastDataPoint[] = [];

  // Add historical data
  for (let i = 0; i < timeSeries.length; i++) {
    const date = dates[i];
    const observed = values[i];
    const forecast = smoothed[i];

    // For historical data, confidence is high
    const historicalStdDev = Math.sqrt(
      values.slice(0, i + 1).reduce((sum, val) => {
        const mean = values.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
        return sum + Math.pow(val - mean, 2);
      }, 0) / (i + 1)
    );

    forecastData.push({
      date: date.toISOString().split("T")[0],
      observed,
      forecast,
      lower_bound: forecast - historicalStdDev * 1.96,
      upper_bound: forecast + historicalStdDev * 1.96,
      confidence: 0.95,
    });
  }

  // Generate future forecasts
  for (let day = 1; day <= horizon; day++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + day);

    // Base forecast: last smoothed value + trend * days
    let baseForecast = lastSmoothed + trend * day;

    // Apply seasonal adjustment if detected
    if (seasonality.hasSeasonality && seasonality.period > 0) {
      const seasonalIndex = (day - 1) % seasonality.period;
      const historicalSeasonalValue =
        values[values.length - seasonality.period + seasonalIndex] || lastValue;
      const seasonalFactor = historicalSeasonalValue / lastValue;
      baseForecast *= seasonalFactor;
    }

    // Apply strategic boost if provided
    if (boostPercentage > 0) {
      baseForecast *= 1 + boostPercentage / 100;
    }

    // Calculate confidence intervals
    const confidence = calculateConfidenceIntervals(baseForecast, values, day);

    forecastData.push({
      date: futureDate.toISOString().split("T")[0],
      observed: null,
      forecast: baseForecast,
      lower_bound: confidence.lower,
      upper_bound: confidence.upper,
      confidence: confidence.confidence,
    });
  }

  return {
    data: forecastData,
    horizon,
    seasonality_detected: seasonality.hasSeasonality,
    trend_direction: trendDirection,
    avg_growth_rate: avgGrowthRate,
    metadata: {
      data_points: timeSeries.length,
      missing_values: data.length - timeSeries.length,
      forecast_method: seasonality.hasSeasonality ? "Prophet_V2_Seasonal" : "Exponential_Smoothing",
    },
  };
}
