"use client";

import { useMemo, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { DashboardState } from "@/types/dashboard";
import {
  getPrioritizedMetrics,
  generateStrategicInsight,
  type Persona,
  type PrioritizedMetric,
  type IntelligenceResult,
  type CompositeInsight,
} from "@/lib/intelligence";
import AnalyticsSuite from "./dashboard/AnalyticsSuite";
import { useInsightLock } from "@/hooks/useInsightLock";

// =============================================================================
// TYPES
// =============================================================================
interface LiveDashboardProps {
  /** The dashboard data from the backend API */
  data: DashboardState;
  /** Current persona lens */
  persona: Persona;
  /** Callback when a metric card is clicked */
  onMetricClick?: (metric: PrioritizedMetric) => void;
  /** Detected industry (e.g., 'saas', 'retail') for industry-aware labels */
  industry?: string;
  /** Data source type for dynamic labels */
  dataSource?: "CSV" | "GOOGLE_SHEETS" | "DEMO";
}

// =============================================================================
// ICON MAPPING
// =============================================================================
const iconMap: Record<string, LucideIcon> = {
  revenue: Activity,
  efficiency: Zap,
  retention: Activity,
  growth: Sparkles,
  users: Activity,
};

// =============================================================================
// ANIMATION VARIANTS (Optimized Spring Physics)
// =============================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
    },
  },
};

// Spring config for layout animations (cards flying to new positions)
const layoutTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// =============================================================================
// PULSE ANIMATION (for urgent metrics)
// =============================================================================
const pulseAnimation = {
  boxShadow: [
    "0 0 0 0 rgba(16, 185, 129, 0)",
    "0 0 24px 6px rgba(16, 185, 129, 0.4)",
    "0 0 0 0 rgba(16, 185, 129, 0)",
  ],
};

const urgentPulseAnimation = {
  boxShadow: [
    "0 0 0 0 rgba(251, 191, 36, 0)",
    "0 0 28px 8px rgba(251, 191, 36, 0.35)",
    "0 0 0 0 rgba(251, 191, 36, 0)",
  ],
};

// =============================================================================
// SUB-COMPONENT: Metric Card (Adaptive)
// =============================================================================
interface MetricCardProps {
  metric: PrioritizedMetric;
  isHero?: boolean;
  onClick?: () => void;
  dataSource?: "CSV" | "GOOGLE_SHEETS" | "DEMO";
}

function MetricCard({ metric, isHero = false, onClick, dataSource = "GOOGLE_SHEETS" }: MetricCardProps) {
  const Icon = iconMap[metric.iconType] || Activity;

  // Trend colors
  const trendColors = {
    positive: "text-emerald-400 bg-emerald-500/10",
    negative: "text-rose-400 bg-rose-500/10",
    neutral: "text-slate-400 bg-slate-500/10",
  };

  const trendColor = trendColors[metric.trend];

  // Hero styling
  const heroClasses = isHero
    ? "border-emerald-500/40 bg-slate-900/80 shadow-lg shadow-emerald-500/10"
    : "border-slate-700/50 bg-slate-900/60";

  // Urgent styling
  const urgentClasses = metric.isUrgent
    ? "ring-2 ring-amber-500/30 border-amber-500/40"
    : "";

  return (
    <motion.div
      layout
      layoutId={`metric-${metric.id}`}
      variants={cardVariants}
      initial="hidden"
      animate={
        metric.isUrgent
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              ...urgentPulseAnimation,
            }
          : "visible"
      }
      exit="exit"
      transition={
        metric.isUrgent
          ? {
              ...layoutTransition,
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : layoutTransition
      }
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 ${heroClasses} ${urgentClasses}`}
    >
      {/* Hover Glow Effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: metric.trend === "positive"
            ? "radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)"
            : metric.trend === "negative"
            ? "radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)"
            : "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        }}
      />
      {/* Glassmorphism gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

      {/* Urgent Badge */}
      {metric.isUrgent && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Zap className="h-3 w-3" />
            Urgent
          </span>
        </div>
      )}

      {/* Hero Badge */}
      {isHero && !metric.isUrgent && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="h-3 w-3" />
            Priority
          </span>
        </div>
      )}

      {/* Header: Icon + Title */}
      <div className="relative flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${trendColor.split(" ")[1]}`}
        >
          <Icon className={`h-4 w-4 ${trendColor.split(" ")[0]}`} />
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
          {metric.title}
        </span>
      </div>

      {/* Main Value */}
      <div
        className={`relative mt-4 font-bold tracking-tight text-slate-50 ${
          isHero ? "text-4xl" : "text-3xl"
        }`}
      >
        {metric.value}
      </div>

      {/* Sub Value with Trend */}
      <div className="relative mt-2 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendColor}`}
        >
          {metric.subValue}
        </span>
      </div>

      {/* Status */}
      <p className="relative mt-3 text-xs leading-relaxed text-slate-500 transition-colors group-hover:text-slate-400">
        {metric.status}
      </p>

      {/* Data Source Label */}
      {isHero && (
        <div className="relative mt-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              dataSource === "CSV"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : dataSource === "GOOGLE_SHEETS"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-500/40 bg-slate-500/10 text-slate-400"
            }`}
          >
            <span
              className={`h-1 w-1 rounded-full ${
                dataSource === "CSV"
                  ? "bg-cyan-400"
                  : dataSource === "GOOGLE_SHEETS"
                  ? "bg-emerald-400"
                  : "bg-slate-400"
              }`}
            />
            {dataSource === "CSV"
              ? "Imported via CSV"
              : dataSource === "GOOGLE_SHEETS"
              ? "Live from Google Sheets"
              : "Demo Data"}
          </span>
        </div>
      )}

      {/* Priority Score (Debug - subtle) */}
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-700">
        P:{Math.round(metric.priorityScore)}
      </div>

      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}

// =============================================================================
// SUB-COMPONENT: Insight Card (Risk/Opportunity)
// =============================================================================
interface InsightCardProps {
  metric: PrioritizedMetric;
  isHero?: boolean;
  onClick?: () => void;
}

function InsightCard({ metric, isHero = false, onClick }: InsightCardProps) {
  const isRisk = metric.insightType === "risk";
  const borderColor = isRisk ? "border-amber-500/30" : "border-emerald-500/30";
  const bgColor = isRisk ? "bg-amber-500/5" : "bg-emerald-500/5";
  const iconBgColor = isRisk ? "bg-amber-500/10" : "bg-emerald-500/10";
  const textColor = isRisk ? "text-amber-400" : "text-emerald-400";
  const Icon = isRisk ? AlertCircle : Activity;

  return (
    <motion.div
      layout
      layoutId={`metric-${metric.id}`}
      variants={cardVariants}
      initial="hidden"
      animate={
        metric.isUrgent
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              ...urgentPulseAnimation,
            }
          : "visible"
      }
      exit="exit"
      transition={
        metric.isUrgent
          ? {
              ...layoutTransition,
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : layoutTransition
      }
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-5 shadow-xl shadow-black/30 backdrop-blur-xl transition-transform ${
        isHero ? "ring-2 ring-emerald-500/20" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBgColor}`}
        >
          <Icon className={`h-4 w-4 ${textColor}`} />
        </div>
        <span
          className={`text-xs font-medium uppercase tracking-[0.12em] ${textColor}`}
        >
          {metric.title}
        </span>
        {metric.isUrgent && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Zap className="h-3 w-3" />
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-200">
        {metric.insightText}
      </p>
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-700">
        P:{Math.round(metric.priorityScore)}
      </div>
    </motion.div>
  );
}

// =============================================================================
// SUB-COMPONENT: Strategic Insight Banner (Hyper-Reactive)
// =============================================================================
interface InsightBannerProps {
  result: IntelligenceResult;
  data: DashboardState;
}

// Severity-based styling
const severityStyles: Record<
  CompositeInsight["severity"],
  {
    border: string;
    bg: string;
    iconBg: string;
    iconColor: string;
    labelColor: string;
    hookColor: string;
  }
> = {
  critical: {
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    labelColor: "text-red-400",
    hookColor: "text-red-300",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    labelColor: "text-amber-400",
    hookColor: "text-amber-300",
  },
  stable: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    labelColor: "text-emerald-400",
    hookColor: "text-emerald-300",
  },
};

// Pulse animation for urgent banners
const bannerPulse = {
  boxShadow: [
    "0 0 0 0 rgba(251, 191, 36, 0)",
    "0 0 30px 8px rgba(251, 191, 36, 0.2)",
    "0 0 0 0 rgba(251, 191, 36, 0)",
  ],
};

const criticalPulse = {
  boxShadow: [
    "0 0 0 0 rgba(239, 68, 68, 0)",
    "0 0 35px 10px rgba(239, 68, 68, 0.25)",
    "0 0 0 0 rgba(239, 68, 68, 0)",
  ],
};

function InsightBanner({ result, data }: InsightBannerProps) {
  // Generate the new insight
  const newInsight = generateStrategicInsight(result, data);

  // Use insight locking to prevent "Narrative Fatigue"
  const { displayedInsight, isLocked, lockTimeRemaining, updateInsight, unlockInsight } =
    useInsightLock(newInsight);

  // Update the displayed insight when new data arrives
  useEffect(() => {
    updateInsight(newInsight);
  }, [newInsight, updateInsight]);

  // Use the locked/displayed insight
  const insight = displayedInsight || newInsight;
  const styles = severityStyles[insight.severity];
  const isUrgent = insight.severity !== "stable";
  const isCritical = insight.severity === "critical";

  // Choose icon based on severity
  const IconComponent = isCritical
    ? AlertCircle
    : isUrgent
      ? Zap
      : Sparkles;

  return (
    <motion.div
      key={`insight-${insight.primaryMetric}-${insight.severity}`}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={
        isUrgent
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              ...(isCritical ? criticalPulse : bannerPulse),
            }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        isUrgent
          ? {
              ...layoutTransition,
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : { ...layoutTransition, delay: 0.2 }
      }
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl ${styles.border} ${styles.bg}`}
    >
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

      {/* Urgent indicator bar */}
      {isUrgent && (
        <motion.div
          className={`absolute left-0 top-0 h-full w-1 ${
            isCritical ? "bg-red-500" : "bg-amber-500"
          }`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header with Lock Status */}
          <div className="flex items-center gap-2">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${styles.labelColor}`}
            >
              {result.persona} Strategic Insight
            </p>
            {isUrgent && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isCritical
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {isCritical ? "CRITICAL" : "URGENT"}
              </span>
            )}
            {/* Lock indicator */}
            {isLocked && (
              <button
                onClick={unlockInsight}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-700 hover:text-slate-300"
                title="Click to unlock and allow new insights"
              >
                🔒 {lockTimeRemaining}s
              </button>
            )}
          </div>

          {/* Hook (Main attention grabber) */}
          <p className={`text-sm font-semibold leading-snug ${styles.hookColor}`}>
            {insight.hook}
          </p>

          {/* Analysis */}
          <p className="text-sm leading-relaxed text-slate-400">
            {insight.analysis}
          </p>

          {/* Actionable (with markdown-style bold) */}
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p
              className="text-xs leading-relaxed text-slate-300"
              dangerouslySetInnerHTML={{
                __html: insight.actionable.replace(
                  /\*\*(.*?)\*\*/g,
                  '<span class="font-semibold text-slate-100">$1</span>'
                ),
              }}
            />
          </div>
        </div>
      </div>

      {/* Severity badge */}
      <div className="absolute right-4 top-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-mono uppercase ${
            isCritical
              ? "bg-red-500/10 text-red-500"
              : isUrgent
                ? "bg-amber-500/10 text-amber-500"
                : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {insight.primaryMetric || "overview"}
        </span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function LiveDashboard({
  data,
  persona,
  onMetricClick,
  industry,
  dataSource = "GOOGLE_SHEETS",
}: LiveDashboardProps) {
  // Run the intelligence engine
  const intelligenceResult = useMemo(
    () => getPrioritizedMetrics(persona, data),
    [persona, data]
  );

  const { heroMetrics, standardMetrics, prioritizedMetrics } =
    intelligenceResult;

  return (
    <LayoutGroup>
      <motion.section
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Adaptive Intelligence · {data.company.name}
              </h2>
              <p className="text-xs text-slate-500">
                {persona} View · {data.company.stage}
              </p>
            </div>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            {prioritizedMetrics.filter((m) => m.isUrgent).length} urgent
          </div>
        </div>

        {/* Strategic Insight Banner */}
        <InsightBanner result={intelligenceResult} data={data} />

        {/* Hero Metrics (Top 3 Priority) */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <Sparkles className="h-3 w-3 text-emerald-400" />
            Priority Focus
            <span className="h-px flex-1 bg-slate-800" />
          </h3>
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              transition={layoutTransition}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {heroMetrics.map((metric) =>
                metric.isInsightCard ? (
                  <InsightCard
                    key={metric.id}
                    metric={metric}
                    isHero
                    onClick={() => onMetricClick?.(metric)}
                  />
                ) : (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                    isHero
                    dataSource={dataSource}
                    onClick={() => onMetricClick?.(metric)}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Charts Row */}
        <AnalyticsSuite data={data} industry={industry} />

        {/* Standard Metrics Grid */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            Additional Metrics
            <span className="h-px flex-1 bg-slate-800" />
          </h3>
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              transition={layoutTransition}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {standardMetrics.map((metric) =>
                metric.isInsightCard ? (
                  <InsightCard
                    key={metric.id}
                    metric={metric}
                    onClick={() => onMetricClick?.(metric)}
                  />
                ) : (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                    dataSource={dataSource}
                    onClick={() => onMetricClick?.(metric)}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </LayoutGroup>
  );
}
