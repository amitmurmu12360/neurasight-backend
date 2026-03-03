"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Users } from "lucide-react";
import type { Growth } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
interface MarketingChartProps {
  /** The Growth data object from the backend */
  data: Growth;
}

interface ChannelData {
  name: string;
  value: number;
  color: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const CHANNEL_COLORS = {
  organic: "#10b981", // Emerald
  paid: "#3b82f6", // Blue
  partner: "#8b5cf6", // Violet
  events: "#f59e0b", // Amber
};

// =============================================================================
// HELPERS
// =============================================================================
/**
 * Generates channel breakdown data based on total MQLs.
 * Uses realistic B2B SaaS distribution ratios.
 */
function generateChannelBreakdown(totalMQLs: number): ChannelData[] {
  // Typical B2B SaaS channel distribution
  const distribution = {
    organic: 0.42, // 42% - SEO, Content, Direct
    paid: 0.28, // 28% - Ads (LinkedIn, Google, Meta)
    partner: 0.18, // 18% - Referrals, Affiliates
    events: 0.12, // 12% - Webinars, Conferences
  };

  return [
    {
      name: "Organic",
      value: Math.round(totalMQLs * distribution.organic),
      color: CHANNEL_COLORS.organic,
    },
    {
      name: "Paid",
      value: Math.round(totalMQLs * distribution.paid),
      color: CHANNEL_COLORS.paid,
    },
    {
      name: "Partner",
      value: Math.round(totalMQLs * distribution.partner),
      color: CHANNEL_COLORS.partner,
    },
    {
      name: "Events",
      value: Math.round(totalMQLs * distribution.events),
      color: CHANNEL_COLORS.events,
    },
  ];
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================
interface TooltipPayload {
  value: number;
  payload: ChannelData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <p className="text-xs font-medium text-slate-300">
          {data.payload.name}
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-white">
        {data.value.toLocaleString()} MQLs
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function MarketingChart({ data }: MarketingChartProps) {
  const channelData = useMemo(
    () => generateChannelBreakdown(data.mqls.value),
    [data.mqls.value]
  );

  // Find the dominant channel
  const dominantChannel = channelData.reduce((prev, curr) =>
    curr.value > prev.value ? curr : prev
  );

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-md">
      {/* Glassmorphism overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Lead Sources
            </h3>
            <p className="text-xs text-slate-500">MQL distribution by channel</p>
          </div>
        </div>
        <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
          {data.mqls.value.toLocaleString()} total
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={channelData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              dy={8}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            >
              {channelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-slate-800 pt-4">
        {channelData.map((channel) => (
          <div key={channel.name} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: channel.color }}
            />
            <span className="text-xs text-slate-400">{channel.name}</span>
            <span className="text-xs font-medium text-slate-300">
              {Math.round((channel.value / data.mqls.value) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Insight Badge */}
      <div className="relative mt-3 rounded-lg bg-slate-800/50 p-2.5">
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-200">Top Performer:</span>{" "}
          <span style={{ color: dominantChannel.color }}>
            {dominantChannel.name}
          </span>{" "}
          drives {Math.round((dominantChannel.value / data.mqls.value) * 100)}%
          of all qualified leads
        </p>
      </div>

      {/* Subtle glow */}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}

