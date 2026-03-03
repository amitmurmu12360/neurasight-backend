"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Persona } from "./ExecutionLog";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type Trend = "up" | "down" | "flat";

interface Metric {
  label: string;
  value: string;
  helper: string;
  trend: Trend;
}

interface PersonaDashboardConfig {
  title: string;
  subtitle: string;
  metrics: Metric[];
  chartTitle: string;
  chartSubtitle: string;
}

const CEO_CHART_DATA = [
  { month: "Jan", arr: 18.2 },
  { month: "Feb", arr: 18.9 },
  { month: "Mar", arr: 19.7 },
  { month: "Apr", arr: 20.8 },
  { month: "May", arr: 22.1 },
  { month: "Jun", arr: 24.3 },
];

const CMO_CHART_DATA = [
  { source: "Paid", mql: 420, cac: 480, traffic: 54000 },
  { source: "Organic", mql: 610, cac: 140, traffic: 72000 },
  { source: "Partner", mql: 260, cac: 220, traffic: 31000 },
  { source: "Events", mql: 180, cac: 350, traffic: 15000 },
];

const SALES_CHART_DATA = [
  { quarter: "Q1", pipeline: 4.2, closed: 1.8, winRate: 0.31 },
  { quarter: "Q2", pipeline: 4.9, closed: 2.3, winRate: 0.34 },
  { quarter: "Q3", pipeline: 5.4, closed: 2.8, winRate: 0.37 },
  { quarter: "Q4", pipeline: 6.1, closed: 3.3, winRate: 0.39 },
];

const getPersonaConfig = (persona: Persona): PersonaDashboardConfig => {
  switch (persona) {
    case "CMO":
      return {
        title: "Growth Signal Board",
        subtitle:
          "Acquisition mix, unit economics, and demand capture for the last 30 days.",
        metrics: [
          {
            label: "Marketing Qualified Leads",
            value: "1,470",
            helper: "+24% vs. last month",
            trend: "up",
          },
          {
            label: "Blended CAC",
            value: "$246",
            helper: "-12% efficiency gain",
            trend: "down",
          },
          {
            label: "Web Traffic",
            value: "172k",
            helper: "+19% net new visitors",
            trend: "up",
          },
        ],
        chartTitle: "Lead Source Mix",
        chartSubtitle: "MQL contribution by primary channel",
      };
    case "VP Sales":
      return {
        title: "Pipeline & Conversion",
        subtitle:
          "Forward-looking coverage, conversion, and risk across current quarters.",
        metrics: [
          {
            label: "Deals Closed (QTD)",
            value: "142",
            helper: "+18% vs. plan",
            trend: "up",
          },
          {
            label: "Pipeline Coverage",
            value: "4.1×",
            helper: "Against next 2 quarters",
            trend: "flat",
          },
          {
            label: "Win Rate",
            value: "39%",
            helper: "+4 pts year-over-year",
            trend: "up",
          },
        ],
        chartTitle: "Quarterly Sales Composition",
        chartSubtitle: "Pipeline vs. closed revenue & win rate",
      };
    case "CEO":
    default:
      return {
        title: "Executive Financial Overview",
        subtitle:
          "Top-line durability, expansion, and capital efficiency for the current FY.",
        metrics: [
          {
            label: "Annual Recurring Revenue",
            value: "$24.3M",
            helper: "+18% YoY growth",
            trend: "up",
          },
          {
            label: "Net Revenue Retention",
            value: "132%",
            helper: "+7 pts expansion",
            trend: "up",
          },
          {
            label: "Burn Multiple",
            value: "0.9×",
            helper: "Capital efficient",
            trend: "down",
          },
        ],
        chartTitle: "Revenue Trend (ARR)",
        chartSubtitle: "Last 6 months, normalized to USD millions",
      };
  }
};

interface DashboardGridProps {
  persona: Persona;
  onReset?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const trendClasses: Record<Trend, string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-slate-400",
};

const trendIcon: Record<Trend, React.JSX.Element> = {
  up: <ArrowUpRight className="h-3 w-3" />,
  down: <ArrowDownRight className="h-3 w-3" />,
  flat: <Minus className="h-3 w-3" />,
};

export default function DashboardGrid({ persona, onReset }: DashboardGridProps) {
  const config = useMemo(() => getPersonaConfig(persona), [persona]);

  return (
    <motion.div
      className="flex h-full flex-col gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={cardVariants}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {config.title}
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            {config.subtitle}
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300 shadow-sm shadow-black/40 transition hover:border-rose-400/70 hover:text-rose-200"
          >
            Reset view
          </button>
        )}
      </motion.div>

      <div className="grid gap-3 md:grid-cols-3">
        {config.metrics.map((metric) => (
          <motion.div
            key={metric.label}
            variants={cardVariants}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-md shadow-black/40"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              {metric.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-50">
              {metric.value}
            </div>
            <div
              className={`mt-1 inline-flex items-center gap-1 text-[11px] ${trendClasses[metric.trend]}`}
            >
              {trendIcon[metric.trend]}
              <span>{metric.helper}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={cardVariants}
        className="min-h-[260px] rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-md shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              {config.chartTitle}
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              {config.chartSubtitle}
            </p>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
            {persona}
          </div>
        </div>

        <div className="h-[220px]">
          {persona === "CEO" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CEO_CHART_DATA}>
                <defs>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(value: number) => `$${value.toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="arr"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#arrGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {persona === "CMO" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CMO_CHART_DATA} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="source"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar
                  dataKey="mql"
                  name="MQLs"
                  radius={[6, 6, 0, 0]}
                  fill="#22c55e"
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {persona === "VP Sales" && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={SALES_CHART_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <XAxis
                  dataKey="quarter"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(value: number) => `$${value.toFixed(1)}M`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(value: number) => `${Math.round(
                    value * 100
                  )}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="pipeline"
                  name="Pipeline"
                  barSize={32}
                  radius={[6, 6, 0, 0]}
                  fill="#22c55e"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="winRate"
                  name="Win Rate"
                  stroke="#facc15"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


