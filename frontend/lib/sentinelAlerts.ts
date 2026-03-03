/**
 * Sentinel Alerts - The Guardian
 * ================================
 * Anomaly detection logic for strategic drift monitoring.
 * 
 * Palette: #000000, #10b981 (Emerald), #06b6d4 (Cyan)
 */

import type { ForecastResult } from "./forecastingEngine";
import type { DashboardState } from "@/types/dashboard";

export interface SentinelAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  detected_at: Date;
  anomaly_type: "forecast_drop" | "health_decline" | "trend_reversal";
  metadata?: Record<string, unknown>;
}

export interface SentinelStatus {
  is_active: boolean;
  alerts: SentinelAlert[];
  last_scan: Date | null;
  anomaly_count: number;
}

/**
 * Check for strategic anomalies in forecast and health data
 * 
 * @param data - Current dashboard state
 * @param forecast - Forecast result from forecasting engine
 * @returns Array of detected alerts
 */
export function checkStrategicAnomalies(
  data: DashboardState | null,
  forecast: ForecastResult | null
): SentinelAlert[] {
  const alerts: SentinelAlert[] = [];

  if (!forecast || !data) {
    return alerts;
  }

  // Check 1: Forecast drop > 20% in next 30 days
  const forecastData = forecast.data.filter((d) => d.observed === null);
  if (forecastData.length >= 30) {
    const currentValue = forecast.data.find((d) => d.observed !== null)?.observed;
    const day30Forecast = forecastData[29]?.forecast;

    if (currentValue && day30Forecast) {
      const dropPercentage = ((currentValue - day30Forecast) / currentValue) * 100;

      if (dropPercentage > 20) {
        alerts.push({
          id: `forecast-drop-${Date.now()}`,
          severity: "critical",
          message: `FORECAST INDICATES ${dropPercentage.toFixed(1)}% DROP IN NEXT 30 DAYS.`,
          detected_at: new Date(),
          anomaly_type: "forecast_drop",
          metadata: {
            current_value: currentValue,
            forecast_30d: day30Forecast,
            drop_percentage: dropPercentage,
          },
        });
      } else if (dropPercentage > 10) {
        alerts.push({
          id: `forecast-warning-${Date.now()}`,
          severity: "warning",
          message: `FORECAST INDICATES ${dropPercentage.toFixed(1)}% DECLINE IN NEXT 30 DAYS.`,
          detected_at: new Date(),
          anomaly_type: "forecast_drop",
          metadata: {
            current_value: currentValue,
            forecast_30d: day30Forecast,
            drop_percentage: dropPercentage,
          },
        });
      }
    }
  }

  // Check 2: Health score < 50
  // Note: Health score is not directly in DashboardState, but we can infer from metrics
  // For now, we'll check if critical metrics are declining
  const arrValue = data.financials.arr.value;
  const arrGrowth = data.financials.arr.growth_yoy;
  const burnMultiple = data.financials.burn_multiple.value;
  const nrr = data.financials.nrr.value;

  // Calculate a proxy health score
  let healthScore = 100;

  // Deduct points for negative growth
  if (arrGrowth < 0) {
    healthScore -= Math.abs(arrGrowth) * 2;
  }

  // Deduct points for high burn multiple (> 1.5 is concerning)
  if (burnMultiple > 1.5) {
    healthScore -= (burnMultiple - 1.5) * 20;
  }

  // Deduct points for low NRR (< 100% is concerning)
  if (nrr < 100) {
    healthScore -= (100 - nrr) * 0.5;
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  if (healthScore < 50) {
    alerts.push({
      id: `health-decline-${Date.now()}`,
      severity: healthScore < 30 ? "critical" : "warning",
      message: `ESTIMATED HEALTH SCORE: ${healthScore.toFixed(0)}%. STRATEGIC INTERVENTION REQUIRED.`,
      detected_at: new Date(),
      anomaly_type: "health_decline",
      metadata: {
        health_score: healthScore,
        arr_growth: arrGrowth,
        burn_multiple: burnMultiple,
        nrr: nrr,
      },
    });
  }

  // Check 3: Trend reversal (forecast trend doesn't match historical trend)
  if (forecast.trend_direction === "decreasing" && arrGrowth > 0) {
    alerts.push({
      id: `trend-reversal-${Date.now()}`,
      severity: "warning",
      message: "FORECAST TREND REVERSAL DETECTED. HISTORICAL GROWTH VS DECLINING FORECAST.",
      detected_at: new Date(),
      anomaly_type: "trend_reversal",
      metadata: {
        historical_growth: arrGrowth,
        forecast_trend: forecast.trend_direction,
      },
    });
  }

  return alerts;
}

/**
 * Get Sentinel status summary
 */
export function getSentinelStatus(
  data: DashboardState | null,
  forecast: ForecastResult | null
): SentinelStatus {
  const alerts = checkStrategicAnomalies(data, forecast);

  return {
    is_active: true,
    alerts,
    last_scan: new Date(),
    anomaly_count: alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length,
  };
}

