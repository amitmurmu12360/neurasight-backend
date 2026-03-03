"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ForecastResult } from "@/lib/forecastingEngine";

interface FutureSightChartProps {
  forecast: ForecastResult;
  boostPercentage?: number;
  agent2Failed?: boolean;
}

/**
 * Future Sight Chart Component
 * =============================
 * Displays historical data (solid cyan) and forecast (dotted emerald)
 * with confidence intervals (subtle emerald glow/shadow).
 * 
 * Style: Pure OLED Black, no grid lines, JetBrains Mono font.
 */
export default function FutureSightChart({
  forecast,
  boostPercentage = 0,
  agent2Failed = false,
}: FutureSightChartProps) {
  const { data, trend_direction, avg_growth_rate, seasonality_detected } = forecast;

  // Separate historical and forecast data
  const historicalData = data.filter((d) => d.observed !== null);
  const forecastData = data.filter((d) => d.observed === null);

  // Calculate chart dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const allValues = data.map((d) => [
    d.observed ?? d.forecast,
    d.lower_bound,
    d.upper_bound,
  ]).flat().filter((v): v is number => v !== null);
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;
  const valuePadding = valueRange * 0.1;

  const scaleY = (value: number) => {
    return chartHeight - ((value - minValue + valuePadding) / (valueRange + valuePadding * 2)) * chartHeight;
  };

  const scaleX = (index: number) => {
    return (index / (data.length - 1)) * chartWidth;
  };

  // Generate path strings
  const historicalPath = useMemo(() => {
    const points = historicalData.map((d, i) => {
      const x = scaleX(i);
      const y = scaleY(d.observed!);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });
    return points.join(" ");
  }, [historicalData, scaleX, scaleY]);

  const forecastPath = useMemo(() => {
    const startIndex = historicalData.length;
    const points = forecastData.map((d, i) => {
      const x = scaleX(startIndex + i);
      const y = scaleY(d.forecast);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });
    return points.join(" ");
  }, [forecastData, historicalData.length, scaleX, scaleY]);

  // Confidence interval area path
  const confidenceAreaPath = useMemo(() => {
    const startIndex = historicalData.length;
    const upperPoints = forecastData.map((d, i) => {
      const x = scaleX(startIndex + i);
      const y = scaleY(d.upper_bound);
      return `${x},${y}`;
    });
    const lowerPoints = [...forecastData].reverse().map((d, i) => {
      const x = scaleX(startIndex + forecastData.length - 1 - i);
      const y = scaleY(d.lower_bound);
      return `${x},${y}`;
    });
    return `M ${upperPoints[0]} L ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`;
  }, [forecastData, historicalData.length, scaleX, scaleY]);

  // Format date for x-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate potential growth badge
  const potentialGrowth = useMemo(() => {
    if (boostPercentage === 0 || forecastData.length === 0) return null;
    const lastForecast = forecastData[forecastData.length - 1];
    const baseForecast = lastForecast.forecast / (1 + boostPercentage / 100);
    const growth = ((lastForecast.forecast - baseForecast) / baseForecast) * 100;
    return growth;
  }, [boostPercentage, forecastData]);

  // Show Math Anomaly warning if Agent 2 failed
  if (agent2Failed) {
    return (
      <div className="relative border border-red-500/30 bg-black p-6" style={{ borderRadius: "0px" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-red-400">
              MATH ANOMALY DETECTED
            </h4>
            <p className="mt-1 font-mono text-[10px] text-red-500/70">
              Agent 2 (Math Auditor) verification failed. Forecast unavailable until data integrity is restored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-slate-800 bg-black p-6" style={{ borderRadius: "0px" }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-white">
            FUTURE SIGHT
          </h4>
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {forecast.metadata.forecast_method} | {forecast.horizon} DAYS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Trend Indicator */}
          {trend_direction === "increasing" && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="font-mono text-xs uppercase">UP</span>
            </div>
          )}
          {trend_direction === "decreasing" && (
            <div className="flex items-center gap-1.5 text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span className="font-mono text-xs uppercase">DOWN</span>
            </div>
          )}
          {trend_direction === "stable" && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Minus className="h-4 w-4" />
              <span className="font-mono text-xs uppercase">STABLE</span>
            </div>
          )}
          {/* Potential Growth Badge */}
          {potentialGrowth !== null && potentialGrowth > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-emerald-500/60 bg-emerald-500/10 px-3 py-1"
              style={{ borderRadius: "0px" }}
            >
              <span className="font-mono text-xs font-semibold text-emerald-400">
                +{potentialGrowth.toFixed(1)}% ESTIMATED RECOVERY
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {/* Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="#000000"
          />

          {/* Confidence Interval Area (Forecast) */}
          {forecastData.length > 0 && (
            <path
              d={confidenceAreaPath}
              fill="rgba(16, 185, 129, 0.1)"
              stroke="rgba(16, 185, 129, 0.2)"
              strokeWidth="1"
              transform={`translate(${padding.left}, ${padding.top})`}
              style={{
                filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))",
              }}
            />
          )}

          {/* Historical Line (Solid Cyan) */}
          {historicalData.length > 0 && (
            <motion.path
              d={historicalPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${padding.left}, ${padding.top})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          )}

          {/* Forecast Line (Dotted Emerald) */}
          {forecastData.length > 0 && (
            <motion.path
              d={forecastPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              transform={`translate(${padding.left}, ${padding.top})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              style={{
                filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))",
              }}
            />
          )}

          {/* Y-Axis */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = minValue + valuePadding + (valueRange + valuePadding * 2) * (1 - ratio);
              const y = ratio * chartHeight;
              return (
                <g key={ratio}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={-10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* X-Axis */}
          <g transform={`translate(${padding.left}, ${padding.top + chartHeight})`}>
            {data
              .map((d, i) => ({ d, i }))
              .filter(({ i }) => i % Math.ceil(data.length / 8) === 0 || i === data.length - 1)
              .map(({ d, i }) => {
                const x = scaleX(i);
                return (
                  <text
                    key={i}
                    x={x}
                    y={20}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {formatDate(d.date)}
                  </text>
                );
              })}
          </g>

          {/* Legend */}
          <g transform={`translate(${padding.left + 20}, ${padding.top + 20})`}>
            <g>
              <line
                x1={0}
                y1={0}
                x2={40}
                y2={0}
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <text
                x={50}
                y={4}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                HISTORICAL
              </text>
            </g>
            <g transform="translate(0, 20)">
              <line
                x1={0}
                y1={0}
                x2={40}
                y2={0}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text
                x={50}
                y={4}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                FORECAST
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Metadata */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex gap-4 font-mono text-[10px] text-slate-500">
          <span>GROWTH: {avg_growth_rate.toFixed(1)}%</span>
          {seasonality_detected && <span>SEASONALITY: DETECTED</span>}
          <span>CONFIDENCE: {(forecastData[0]?.confidence || 0.5) * 100}%</span>
        </div>
      </div>
    </div>
  );
}
