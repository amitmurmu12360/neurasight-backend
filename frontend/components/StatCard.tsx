"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Minus,
  Percent,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
export type TrendDirection = "positive" | "negative" | "neutral";

export interface StatCardProps {
  /** The metric title (e.g., "Annual Recurring Revenue") */
  title: string;
  /** The main value to display (e.g., "$24.3M") */
  value: string | number;
  /** Secondary context (e.g., "+18% YoY") */
  subValue: string;
  /** Status description (e.g., "Healthy but needs acceleration") */
  status: string;
  /** Trend direction for color coding */
  trend: TrendDirection;
  /** Optional icon type override */
  iconType?: "revenue" | "efficiency" | "retention" | "growth" | "users";
}

// =============================================================================
// ICON MAPPING
// =============================================================================
const iconMap: Record<string, LucideIcon> = {
  revenue: DollarSign,
  efficiency: Zap,
  retention: Percent,
  growth: TrendingUp,
  users: Users,
};

// =============================================================================
// TREND STYLING
// =============================================================================
const trendConfig: Record<
  TrendDirection,
  { color: string; bgColor: string; Icon: LucideIcon }
> = {
  positive: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    Icon: ArrowUpRight,
  },
  negative: {
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    Icon: ArrowDownRight,
  },
  neutral: {
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    Icon: Minus,
  },
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================
const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// =============================================================================
// COMPONENT
// =============================================================================
export default function StatCard({
  title,
  value,
  subValue,
  status,
  trend,
  iconType = "revenue",
}: StatCardProps) {
  const { color, bgColor, Icon: TrendIcon } = trendConfig[trend];
  const MetricIcon = iconMap[iconType] || DollarSign;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur-md transition-colors hover:border-emerald-500/30"
    >
      {/* Glassmorphism gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

      {/* Header: Icon + Title */}
      <div className="relative flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor}`}
        >
          <MetricIcon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          {title}
        </span>
      </div>

      {/* Main Value */}
      <div className="relative mt-4 text-3xl font-bold tracking-tight text-slate-50">
        {value}
      </div>

      {/* Sub Value with Trend */}
      <div className="relative mt-2 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${color}`}
        >
          <TrendIcon className="h-3 w-3" />
          {subValue}
        </span>
      </div>

      {/* Status */}
      <p className="relative mt-3 text-xs leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
        {status}
      </p>

      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}

