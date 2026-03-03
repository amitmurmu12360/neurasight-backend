"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  ArrowRight,
  BarChart2,
  Clock,
  CheckCircle,
  Loader2,
  Mail,
  Bot,
} from "lucide-react";
import type { PrioritizedMetric, MetricId } from "@/lib/intelligence";

// =============================================================================
// TYPES
// =============================================================================
interface InvestigationDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** The metric being investigated */
  metric: PrioritizedMetric | null;
  /** Optional: Raw metric value for sparkline generation */
  rawValue?: number;
  /** Callback when an action is completed */
  onActionComplete?: (metricId: MetricId, action: string) => void;
}

// =============================================================================
// ACTION STATE
// =============================================================================
type ActionState = "idle" | "executing" | "success" | "error";

// =============================================================================
// ROOT CAUSE ANALYSIS DATA
// =============================================================================
const RCA_DATA: Record<
  MetricId,
  { causes: string[]; impacts: string[]; mitigation: string }
> = {
  arr: {
    causes: [
      "New logo acquisition velocity change",
      "Expansion revenue from existing accounts",
      "Contraction or churn in customer base",
      "Pricing strategy adjustments",
      "Seasonal buying patterns",
    ],
    impacts: [
      "Direct impact on company valuation",
      "Affects runway and fundraising position",
      "Influences board and investor confidence",
    ],
    mitigation: "Launch Revenue Recovery Task Force",
  },
  nrr: {
    causes: [
      "Customer churn increase",
      "Expansion revenue slowdown",
      "Product adoption challenges",
      "Competitive displacement",
      "Economic headwinds affecting renewals",
    ],
    impacts: [
      "Indicates product-market fit health",
      "Affects long-term growth projections",
      "Signals customer satisfaction levels",
    ],
    mitigation: "Activate Customer Success Intervention",
  },
  burn_multiple: {
    causes: [
      "Headcount growth outpacing revenue",
      "Marketing spend efficiency decline",
      "Infrastructure cost increases",
      "Sales productivity challenges",
      "One-time expenses or investments",
    ],
    impacts: [
      "Runway compression risk",
      "May trigger early fundraising",
      "Affects team expansion plans",
    ],
    mitigation: "Initiate Cost Optimization Review",
  },
  mqls: {
    causes: [
      "Paid channel performance decline",
      "Organic traffic fluctuation",
      "Content marketing effectiveness",
      "Event/webinar attendance changes",
      "Partner referral volume shifts",
    ],
    impacts: [
      "Pipeline coverage in 60-90 days",
      "Sales team utilization",
      "Marketing budget ROI",
    ],
    mitigation: "Open Campaign Manager",
  },
  cac: {
    causes: [
      "Paid media cost inflation",
      "Conversion rate changes",
      "Sales cycle lengthening",
      "Channel mix optimization needed",
      "Targeting decay in ad platforms",
    ],
    impacts: [
      "LTV/CAC ratio compression",
      "Unit economics sustainability",
      "Growth investment decisions",
    ],
    mitigation: "Execute Channel Rebalancing",
  },
  top_risk: {
    causes: [
      "External market conditions",
      "Competitive dynamics",
      "Internal execution challenges",
      "Resource constraints",
      "Strategic misalignment",
    ],
    impacts: [
      "Quarterly target achievement",
      "Team morale and retention",
      "Stakeholder confidence",
    ],
    mitigation: "Convene Risk Mitigation Council",
  },
  deals_closed: {
    causes: [
      "Pipeline quality changes",
      "Sales rep performance variance",
      "Competitive win rate shifts",
      "Pricing and discounting patterns",
      "Economic buyer sentiment",
    ],
    impacts: [
      "Revenue recognition timing",
      "Commission and compensation",
      "Forecast accuracy",
    ],
    mitigation: "Launch Deal Acceleration Program",
  },
  velocity: {
    causes: [
      "Buyer decision complexity",
      "Internal approval processes",
      "Competitive evaluation duration",
      "Solution complexity",
      "Champion availability",
    ],
    impacts: [
      "Capacity and resource planning",
      "Revenue predictability",
      "Sales efficiency metrics",
    ],
    mitigation: "Implement Velocity Optimization",
  },
  top_opportunity: {
    causes: [
      "Market expansion signals",
      "Product differentiation",
      "Customer segment growth",
      "Partnership momentum",
      "Competitive positioning",
    ],
    impacts: [
      "Growth acceleration potential",
      "Strategic positioning",
      "Resource allocation priority",
    ],
    mitigation: "Assign Executive Sponsor",
  },
};

// =============================================================================
// SPARKLINE DATA GENERATOR
// =============================================================================
function generateSparklineData(
  currentValue: number,
  isUrgent: boolean,
  trend: "positive" | "negative" | "neutral"
): number[] {
  const points = 24; // 24 hours
  const data: number[] = [];

  // Generate historical data working backwards
  let value = currentValue;
  const volatility = isUrgent ? 0.08 : 0.03;

  for (let i = points - 1; i >= 0; i--) {
    // Add some randomness
    const noise = (Math.random() - 0.5) * 2 * volatility * value;

    // Trend direction
    const trendFactor =
      trend === "positive" ? 0.005 : trend === "negative" ? -0.005 : 0;
    const historicalValue = value * (1 - trendFactor * (points - i)) + noise;

    data.unshift(Math.max(0, historicalValue));
    value = historicalValue;
  }

  return data;
}

// =============================================================================
// MINI SPARKLINE COMPONENT
// =============================================================================
function Sparkline({
  data,
  trend,
}: {
  data: number[];
  trend: "positive" | "negative" | "neutral";
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 200;
  const height = 60;
  const padding = 4;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor =
    trend === "positive"
      ? "#10b981"
      : trend === "negative"
        ? "#ef4444"
        : "#64748b";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${trend}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#gradient-${trend})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={width - padding}
        cy={
          height -
          padding -
          ((data[data.length - 1] - min) / range) * (height - padding * 2)
        }
        r={4}
        fill={strokeColor}
        stroke="#0f172a"
        strokeWidth={2}
      />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function InvestigationDrawer({
  isOpen,
  onClose,
  metric,
  rawValue,
  onActionComplete,
}: InvestigationDrawerProps) {
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState<string>("");

  // Get RCA data for the metric
  const rcaData = metric ? RCA_DATA[metric.id] : null;

  // Generate sparkline data
  const sparklineData = useMemo(() => {
    if (!metric) return [];
    const value = rawValue || parseFloat(metric.value.replace(/[^0-9.]/g, "")) || 100;
    return generateSparklineData(value, metric.isUrgent, metric.trend);
  }, [metric, rawValue]);

  // Trend icon
  const TrendIcon =
    metric?.trend === "positive"
      ? TrendingUp
      : metric?.trend === "negative"
        ? TrendingDown
        : Minus;

  // Execute mitigation action with Slack notification
  const handleExecuteAction = useCallback(async () => {
    if (!metric || !rcaData) return;

    setActionState("executing");
    setActionMessage("AI Agent analyzing situation...");

    // Simulate AI agent execution steps
    await new Promise((resolve) => setTimeout(resolve, 800));
    setActionMessage("Generating action plan...");

    await new Promise((resolve) => setTimeout(resolve, 800));
    setActionMessage("Sending notifications to Slack...");

    // Call the execute API to send Slack notification
    let slackSuccess = false;
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metric: metric.title,
          action: rcaData.mitigation,
          persona: "Executive",
          severity: metric.isUrgent ? "warning" : "info",
        }),
      });

      const data = await response.json();
      slackSuccess = data.success === true;

      if (!slackSuccess) {
        console.warn("Slack notification failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to call execute API:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    // Set success state
    setActionState("success");

    // Generate action-specific message
    const actionMessages: Record<MetricId, string> = {
      arr: "Revenue recovery task force notified. Meeting scheduled for tomorrow 9 AM.",
      nrr: "Customer success team alerted. At-risk account review initiated.",
      burn_multiple: "Cost optimization report sent to Finance. Department heads notified.",
      mqls: "Marketing team alerted. Campaign audit scheduled for today 3 PM.",
      cac: "Channel efficiency report generated. Paid campaigns flagged for review.",
      top_risk: "Risk mitigation council assembled. Action items distributed.",
      deals_closed: "Sales leadership notified. Pipeline acceleration plan activated.",
      velocity: "Deal velocity analysis sent to Sales Ops. Bottleneck review scheduled.",
      top_opportunity: "Executive sponsor assigned. Opportunity acceleration in progress.",
    };

    const baseMessage = actionMessages[metric.id] || "Action plan executed successfully.";
    setActionMessage(
      slackSuccess
        ? `${baseMessage} Slack notification sent.`
        : baseMessage
    );

    // Log to console for demo
    console.log(`🤖 AI Agent Action Executed:`, {
      metric: metric.title,
      action: rcaData.mitigation,
      slackNotified: slackSuccess,
      timestamp: new Date().toISOString(),
    });

    // Notify parent with Slack status
    onActionComplete?.(metric.id, rcaData.mitigation);

    // Auto-close after delay
    setTimeout(() => {
      setActionState("idle");
      setActionMessage("");
      onClose();
    }, 2500);
  }, [metric, rcaData, onActionComplete, onClose]);

  return (
    <AnimatePresence>
      {isOpen && metric && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-slate-900 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-100">
                      {metric.title}
                    </h2>
                    {metric.isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                        <Zap className="h-3 w-3" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{metric.status}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Value Banner */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-800/50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Current Value
                  </p>
                  <p className="mt-1 text-3xl font-bold text-slate-100">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                    metric.trend === "positive"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : metric.trend === "negative"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{metric.subValue}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 p-6">
              {/* Historical Context */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-200">
                    24-Hour Trend
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                  <Sparkline data={sparklineData} trend={metric.trend} />
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>24h ago</span>
                    <span>Now</span>
                  </div>
                </div>
              </section>

              {/* Root Cause Analysis */}
              {rcaData && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      Why is this happening?
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {rcaData.causes.map((cause, index) => (
                      <motion.div
                        key={cause}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 rounded-lg bg-slate-800/30 p-3"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
                          {index + 1}
                        </div>
                        <p className="text-sm text-slate-300">{cause}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Business Impact */}
              {rcaData && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      Business Impact
                    </h3>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                    <ul className="space-y-2">
                      {rcaData.impacts.map((impact) => (
                        <li
                          key={impact}
                          className="flex items-start gap-2 text-sm text-slate-400"
                        >
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                          {impact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Related Metrics */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-200">
                    Correlated Metrics
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["ARR", "NRR", "CAC", "MQLs"]
                    .filter((m) => m.toLowerCase() !== metric.id)
                    .slice(0, 4)
                    .map((relatedMetric) => (
                      <div
                        key={relatedMetric}
                        className="rounded-lg border border-slate-800 bg-slate-800/20 p-3"
                      >
                        <p className="text-xs font-medium text-slate-500">
                          {relatedMetric}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          Correlated
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-800 bg-slate-900/95 p-6 backdrop-blur">
              {/* Success State */}
              {actionState === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-400">
                        Action Executed Successfully
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-300/80">
                        {actionMessage}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Executing State */}
              {actionState === "executing" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                      <Bot className="h-5 w-5 animate-pulse text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-400">
                        AI Agent Executing...
                      </p>
                      <p className="mt-0.5 text-xs text-blue-300/80">
                        {actionMessage}
                      </p>
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionState !== "idle"}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
                  actionState === "success"
                    ? "bg-emerald-600 text-white shadow-emerald-600/20"
                    : actionState === "executing"
                      ? "cursor-not-allowed bg-blue-500 text-white opacity-80 shadow-blue-500/20"
                      : "bg-emerald-500 text-slate-900 shadow-emerald-500/20 hover:bg-emerald-400"
                }`}
              >
                {actionState === "executing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : actionState === "success" ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    {rcaData?.mitigation || "Execute Mitigation Strategy"}
                  </>
                )}
              </button>

              {/* Secondary Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log(`📧 Email sent to team about ${metric?.title}`);
                    alert(`Action Plan sent via email to the ${metric?.title} team`);
                  }}
                  disabled={actionState !== "idle"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  Send Report
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={actionState === "executing"}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

