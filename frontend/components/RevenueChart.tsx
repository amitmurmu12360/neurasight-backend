"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface RevenueChartProps {
  /** Current ARR value in millions (e.g., 24.3) */
  currentARR: number;
  /** Year-over-year growth rate as percentage (e.g., 18) */
  growthRate: number;
  /** Detected industry (e.g., 'saas', 'retail') for industry-aware labels */
  industry?: string;
}

interface DataPoint {
  name: string;
  value: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// =============================================================================
// HELPERS
// =============================================================================
/**
 * Generates a 6-month revenue history by reverse-calculating from current ARR.
 * Assumes steady monthly growth derived from the annual growth rate.
 */
function generateRevenueHistory(
  currentARR: number,
  annualGrowthRate: number
): DataPoint[] {
  // Convert annual growth to monthly: (1 + annual)^(1/12) - 1
  const monthlyGrowth = Math.pow(1 + annualGrowthRate / 100, 1 / 12) - 1;

  // Build data backwards from current month
  const data: DataPoint[] = [];
  let value = currentARR;

  // Start from most recent (index 5) and go backwards
  for (let i = MONTHS.length - 1; i >= 0; i--) {
    data.unshift({
      name: MONTHS[i],
      value: Math.round(value * 100) / 100, // Round to 2 decimals
    });
    // Calculate previous month's value
    value = value / (1 + monthlyGrowth);
  }

  return data;
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================
interface TooltipPayload {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-emerald-400">
        ${payload[0].value.toFixed(1)}M
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function RevenueChart({
  currentARR,
  growthRate,
  industry,
}: RevenueChartProps) {
  // Defensive check: ensure values are valid numbers
  // Remove hardcoded fallbacks - use actual data or 0
  const safeARR = isNaN(currentARR) || !isFinite(currentARR) ? 0 : currentARR;
  const safeGrowthRate = isNaN(growthRate) || !isFinite(growthRate) ? 0 : growthRate;
  
  // Industry-aware labels
  const isRetail = industry?.toLowerCase() === 'retail';
  const revenueLabel = isRetail ? 'Total Retail Sales' : 'Annual Recurring Revenue';
  const subtitleLabel = isRetail ? '6-month sales trajectory' : '6-month ARR trajectory';
  const startingLabel = isRetail ? 'Starting Sales' : 'Starting ARR';
  const currentLabel = isRetail ? 'Current Sales' : 'Current ARR';
  
  const data = useMemo(
    () => generateRevenueHistory(safeARR, safeGrowthRate),
    [safeARR, safeGrowthRate]
  );

  // Calculate the range for display
  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const growth = maxValue - minValue;

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-md">
      {/* Glassmorphism overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {revenueLabel}
            </h3>
            <p className="text-xs text-slate-500">{subtitleLabel}</p>
          </div>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          +${growth.toFixed(1)}M
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              dy={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#colorArr)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#10b981",
                stroke: "#020617",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="relative mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs text-slate-500">{startingLabel}</p>
          <p className="text-sm font-semibold text-slate-200">
            ${data[0].value.toFixed(1)}M
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{currentLabel}</p>
          <p className="text-sm font-semibold text-emerald-400">
            ${safeARR.toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Subtle glow */}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}

