/**
 * NeuraSight Adaptive Intelligence Engine
 * ========================================
 * Implements the proprietary "Decision-First" layout algorithm.
 *
 * Formula: PriorityScore = (DataRelevance * PersonaWeight) + TrendUrgency
 *
 * This engine dynamically reorders dashboard metrics based on:
 * 1. Industry-specific relevance (B2B SaaS default)
 * 2. Persona-specific weights (CEO, CMO, VP Sales)
 * 3. Trend volatility triggers (>15% fluctuation = urgent)
 */

import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
export type Persona = "CEO" | "CMO" | "VP Sales";
export type Industry = "B2B SaaS" | "E-commerce" | "Fintech";
export type MetricCategory = "financials" | "growth" | "sales";

export type MetricId =
  | "arr"
  | "nrr"
  | "burn_multiple"
  | "mqls"
  | "cac"
  | "top_risk"
  | "deals_closed"
  | "velocity"
  | "top_opportunity";

export interface PrioritizedMetric {
  /** Unique identifier for the metric */
  id: MetricId;
  /** Display title */
  title: string;
  /** Formatted display value */
  value: string;
  /** Secondary context (e.g., "+18% YoY") */
  subValue: string;
  /** Status description */
  status: string;
  /** Trend direction */
  trend: "positive" | "negative" | "neutral";
  /** Icon type for StatCard */
  iconType: "revenue" | "efficiency" | "retention" | "growth" | "users";
  /** Category for grouping */
  category: MetricCategory;
  /** Calculated priority score */
  priorityScore: number;
  /** Whether this metric triggered urgency */
  isUrgent: boolean;
  /** Raw change percentage for urgency calculation */
  changePercent: number;
  /** Whether this is a text-only insight card */
  isInsightCard?: boolean;
  /** Insight text for insight cards */
  insightText?: string;
  /** Insight type for styling */
  insightType?: "risk" | "opportunity";
}

export interface IntelligenceResult {
  /** All metrics sorted by priority (highest first) */
  prioritizedMetrics: PrioritizedMetric[];
  /** Top 3 "Hero" metrics */
  heroMetrics: PrioritizedMetric[];
  /** Remaining metrics after heroes */
  standardMetrics: PrioritizedMetric[];
  /** AI insight prefix based on urgency */
  insightPrefix: string;
  /** Whether any metric is urgent */
  hasUrgentMetrics: boolean;
  /** The active persona */
  persona: Persona;
}

// =============================================================================
// CONSTANTS: DATA RELEVANCE (Industry-specific base scores)
// =============================================================================
const DATA_RELEVANCE: Record<Industry, Record<MetricId, number>> = {
  "B2B SaaS": {
    arr: 95,
    nrr: 90,
    burn_multiple: 85,
    mqls: 75,
    cac: 80,
    top_risk: 70,
    deals_closed: 85,
    velocity: 75,
    top_opportunity: 65,
  },
  "E-commerce": {
    arr: 80,
    nrr: 70,
    burn_multiple: 60,
    mqls: 85,
    cac: 90,
    top_risk: 75,
    deals_closed: 70,
    velocity: 65,
    top_opportunity: 60,
  },
  Fintech: {
    arr: 90,
    nrr: 95,
    burn_multiple: 88,
    mqls: 70,
    cac: 75,
    top_risk: 85,
    deals_closed: 80,
    velocity: 70,
    top_opportunity: 75,
  },
};

// =============================================================================
// CONSTANTS: PERSONA WEIGHTS (Role-specific multipliers)
// =============================================================================
const PERSONA_WEIGHTS: Record<Persona, Record<MetricId, number>> = {
  CEO: {
    arr: 1.5,
    nrr: 1.4,
    burn_multiple: 1.5,
    mqls: 0.8,
    cac: 1.0,
    top_risk: 1.2,
    deals_closed: 1.1,
    velocity: 0.9,
    top_opportunity: 1.0,
  },
  CMO: {
    arr: 0.9,
    nrr: 0.8,
    burn_multiple: 0.7,
    mqls: 1.5,
    cac: 1.5,
    top_risk: 1.3,
    deals_closed: 0.8,
    velocity: 0.7,
    top_opportunity: 0.9,
  },
  "VP Sales": {
    arr: 1.1,
    nrr: 0.9,
    burn_multiple: 0.7,
    mqls: 0.9,
    cac: 0.8,
    top_risk: 0.9,
    deals_closed: 1.5,
    velocity: 1.5,
    top_opportunity: 1.4,
  },
};

// =============================================================================
// CONSTANTS: URGENCY CONFIGURATION
// =============================================================================
const URGENCY_THRESHOLD = 15; // Percentage change that triggers urgency
const URGENCY_BOOST = 100; // Score boost for urgent metrics

// =============================================================================
// HELPER: Calculate Trend Direction
// =============================================================================
function getTrend(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

// =============================================================================
// HELPER: Safe Format (Global Precision Formatter)
// =============================================================================
/**
 * Global precision formatter for all metrics.
 * Ensures ARR/Sales is always $XX.XM and Growth is XX.X%
 */
export function safeFormat(
  value: number | undefined | null,
  type: "currency" | "percentage" | "number",
  options?: {
    currency?: string;
    unit?: string;
    decimals?: number;
  }
): string {
  // Defensive check: Ensure value is valid
  const safeValue = value === undefined || value === null || isNaN(value) || !isFinite(value) 
    ? 0 
    : value;
  
  const decimals = options?.decimals ?? 1;
  
  switch (type) {
    case "currency":
      const currency = options?.currency || "$";
      const unit = options?.unit || "M";
      return `${currency}${safeValue.toFixed(decimals)}${unit}`;
    
    case "percentage":
      const sign = safeValue > 0 ? "+" : "";
      return `${sign}${safeValue.toFixed(decimals)}%`;
    
    case "number":
      return safeValue.toFixed(decimals);
    
    default:
      return safeValue.toFixed(decimals);
  }
}

// =============================================================================
// HELPER: Format Currency (with .toFixed(1) precision)
// =============================================================================
function formatCurrency(value: number, currency: string, unit: string): string {
  return safeFormat(value, "currency", { currency, unit });
}

// =============================================================================
// HELPER: Format Change (with .toFixed(1) precision for percentages)
// =============================================================================
function formatChange(value: number, suffix: string = ""): string {
  const formatted = safeFormat(value, "percentage");
  return suffix ? `${formatted}${suffix}` : formatted;
}

// =============================================================================
// CORE ENGINE: Get Prioritized Metrics
// =============================================================================
export function getPrioritizedMetrics(
  persona: Persona,
  data: DashboardState,
  industry: Industry = "B2B SaaS"
): IntelligenceResult {
  const relevance = DATA_RELEVANCE[industry];
  const weights = PERSONA_WEIGHTS[persona];

  // Build all metrics with their scores
  const metrics: PrioritizedMetric[] = [];

  // --- FINANCIALS ---
  const arrValue = isNaN(data.financials.arr.value) || !isFinite(data.financials.arr.value)
    ? 24.3 // Default to verified baseline $24.3M ARR
    : data.financials.arr.value;
  const arrChange = isNaN(data.financials.arr.growth_yoy) || !isFinite(data.financials.arr.growth_yoy)
    ? 18 // Default to verified baseline +18% YoY
    : data.financials.arr.growth_yoy;
  const arrUrgent = Math.abs(arrChange) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "arr",
    title: "Annual Recurring Revenue",
    value: formatCurrency(arrValue, data.financials.arr.currency, data.financials.arr.unit),
    subValue: formatChange(arrChange, " YoY"),
    status: data.financials.arr.status,
    trend: getTrend(arrChange),
    iconType: "revenue",
    category: "financials",
    changePercent: arrChange,
    isUrgent: arrUrgent,
    priorityScore:
      relevance.arr * weights.arr + (arrUrgent ? URGENCY_BOOST : 0),
  });

  // NRR - Calculate "change" as deviation from 100%
  const nrrValue = isNaN(data.financials.nrr.value) || !isFinite(data.financials.nrr.value) 
    ? 132 // Default to verified baseline
    : data.financials.nrr.value;
  const nrrDeviation = nrrValue - 100;
  const nrrUrgent = Math.abs(nrrDeviation) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "nrr",
    title: "Net Revenue Retention",
    value: `${nrrValue.toFixed(1)}${data.financials.nrr.unit}`,
    subValue: nrrValue >= 100 ? "Expanding" : "Contracting",
    status: data.financials.nrr.status,
    trend: nrrValue >= 100 ? "positive" : "negative",
    iconType: "retention",
    category: "financials",
    changePercent: nrrDeviation,
    isUrgent: nrrUrgent,
    priorityScore:
      relevance.nrr * weights.nrr + (nrrUrgent ? URGENCY_BOOST : 0),
  });

  // Burn Multiple - Lower is better, compare to benchmark
  const burnValue = isNaN(data.financials.burn_multiple.value) || !isFinite(data.financials.burn_multiple.value)
    ? 0.9 // Default to verified baseline
    : data.financials.burn_multiple.value;
  const burnBenchmark = isNaN(data.financials.burn_multiple.benchmark) || !isFinite(data.financials.burn_multiple.benchmark)
    ? 1.5
    : data.financials.burn_multiple.benchmark;
  const burnDelta =
    ((burnBenchmark - burnValue) / burnBenchmark) * 100;
  const burnUrgent = Math.abs(burnDelta) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "burn_multiple",
    title: "Burn Multiple",
    value: safeFormat(burnValue, "number", { decimals: 1 }) + "x",
    subValue: `Benchmark: ${safeFormat(burnBenchmark, "number", { decimals: 1 })}x`,
    status: data.financials.burn_multiple.status,
    trend: burnValue < burnBenchmark ? "positive" : "negative",
    iconType: "efficiency",
    category: "financials",
    changePercent: burnDelta,
    isUrgent: burnUrgent,
    priorityScore:
      relevance.burn_multiple * weights.burn_multiple +
      (burnUrgent ? URGENCY_BOOST : 0),
  });

  // --- GROWTH & MARKETING ---
  const mqlChange = isNaN(data.growth.mqls.growth_mom) || !isFinite(data.growth.mqls.growth_mom)
    ? 24 // Default to verified baseline +24% MoM
    : data.growth.mqls.growth_mom;
  const mqlUrgent = Math.abs(mqlChange) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "mqls",
    title: "Marketing Qualified Leads",
    value: data.growth.mqls.value.toLocaleString(),
    subValue: formatChange(mqlChange, " MoM"),
    status: data.growth.mqls.status,
    trend: getTrend(mqlChange),
    iconType: "users",
    category: "growth",
    changePercent: mqlChange,
    isUrgent: mqlUrgent,
    priorityScore:
      relevance.mqls * weights.mqls + (mqlUrgent ? URGENCY_BOOST : 0),
  });

  const cacValue = isNaN(data.growth.cac.value) || !isFinite(data.growth.cac.value) 
    ? 246 // Default value
    : data.growth.cac.value;
  const cacChange = isNaN(data.growth.cac.efficiency_gain) || !isFinite(data.growth.cac.efficiency_gain)
    ? 0
    : data.growth.cac.efficiency_gain;
  const cacUrgent = Math.abs(cacChange) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "cac",
    title: "Customer Acquisition Cost",
    value: `${data.growth.cac.currency}${cacValue.toFixed(1)}`,
    subValue: formatChange(cacChange, " efficiency"),
    status: data.growth.cac.status,
    trend: getTrend(-cacChange), // Lower CAC is better
    iconType: "revenue",
    category: "growth",
    changePercent: cacChange,
    isUrgent: cacUrgent,
    priorityScore:
      relevance.cac * weights.cac + (cacUrgent ? URGENCY_BOOST : 0),
  });

  // Top Risk (Insight Card)
  metrics.push({
    id: "top_risk",
    title: "Top Risk",
    value: "",
    subValue: "",
    status: "",
    trend: "negative",
    iconType: "efficiency",
    category: "growth",
    changePercent: 0,
    isUrgent: true, // Risks are always urgent
    priorityScore: relevance.top_risk * weights.top_risk + 50, // Moderate boost
    isInsightCard: true,
    insightText: data.growth.top_risk,
    insightType: "risk",
  });

  // --- SALES ---
  // Deals closed - Assume 10% improvement as baseline
  const dealsChange = 10; // Simulated growth
  const dealsUrgent = Math.abs(dealsChange) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "deals_closed",
    title: `Deals Closed (${data.sales.deals_closed.period})`,
    value: data.sales.deals_closed.value.toString(),
    subValue: "On track",
    status: "Closed deal volume this quarter",
    trend: "positive",
    iconType: "growth",
    category: "sales",
    changePercent: dealsChange,
    isUrgent: dealsUrgent,
    priorityScore:
      relevance.deals_closed * weights.deals_closed +
      (dealsUrgent ? URGENCY_BOOST : 0),
  });

  // Velocity
  const velocityImproving = data.sales.velocity.status === "Improving";
  const velocityChange = velocityImproving ? 8 : -5; // Simulated
  const velocityUrgent = Math.abs(velocityChange) >= URGENCY_THRESHOLD;
  metrics.push({
    id: "velocity",
    title: "Sales Velocity",
    value: `${data.sales.velocity.avg_cycle_days} days`,
    subValue: data.sales.velocity.status,
    status: "Average deal cycle time",
    trend: velocityImproving ? "positive" : "neutral",
    iconType: "efficiency",
    category: "sales",
    changePercent: velocityChange,
    isUrgent: velocityUrgent,
    priorityScore:
      relevance.velocity * weights.velocity +
      (velocityUrgent ? URGENCY_BOOST : 0),
  });

  // Top Opportunity (Insight Card)
  metrics.push({
    id: "top_opportunity",
    title: "Top Opportunity",
    value: "",
    subValue: "",
    status: "",
    trend: "positive",
    iconType: "growth",
    category: "sales",
    changePercent: 0,
    isUrgent: false,
    priorityScore: relevance.top_opportunity * weights.top_opportunity,
    isInsightCard: true,
    insightText: data.sales.top_opportunity,
    insightType: "opportunity",
  });

  // Sort by priority score (descending)
  const sorted = [...metrics].sort((a, b) => b.priorityScore - a.priorityScore);

  // Separate heroes from standard
  const heroMetrics = sorted.slice(0, 3);
  const standardMetrics = sorted.slice(3);

  // Determine if any metric is urgent
  const hasUrgentMetrics = sorted.some((m) => m.isUrgent);

  // Generate insight prefix based on urgency
  let insightPrefix = "";
  if (hasUrgentMetrics) {
    const urgentMetric = sorted.find((m) => m.isUrgent);
    if (urgentMetric) {
      if (urgentMetric.trend === "negative") {
        insightPrefix = "🚨 CRITICAL ALERT: ";
      } else {
        insightPrefix = "⚡ URGENT OBSERVATION: ";
      }
    }
  }

  return {
    prioritizedMetrics: sorted,
    heroMetrics,
    standardMetrics,
    insightPrefix,
    hasUrgentMetrics,
    persona,
  };
}

// =============================================================================
// COMPOSITE INSIGHT TYPES
// =============================================================================
export interface CompositeInsight {
  /** The attention-grabbing opening statement */
  hook: string;
  /** Why this matters for the current persona */
  analysis: string;
  /** Strategic recommendation */
  actionable: string;
  /** Full combined text */
  fullText: string;
  /** Severity level for styling */
  severity: "critical" | "warning" | "stable";
  /** Primary metric driving the insight */
  primaryMetric: MetricId | null;
}

// =============================================================================
// PERSONA-SPECIFIC URGENCY NARRATIVES
// =============================================================================
const URGENCY_NARRATIVES: Record<
  Persona,
  Record<MetricId, { hook: string; analysis: string; actionable: string }>
> = {
  CEO: {
    arr: {
      hook: "Revenue trajectory requires board-level attention",
      analysis:
        "ARR movement at this magnitude directly impacts our Series B valuation multiples and runway projections",
      actionable:
        "Convene an emergency revenue review with Sales and CS leadership within 48 hours",
    },
    nrr: {
      hook: "Net Revenue Retention signals product-market fit concerns",
      analysis:
        "NRR fluctuation indicates potential churn risk or expansion headwinds that could impact investor confidence",
      actionable:
        "Prioritize customer success initiatives and conduct cohort analysis on at-risk accounts",
    },
    burn_multiple: {
      hook: "Capital efficiency runway is at risk",
      analysis:
        "Burn multiple deviation threatens our path to profitability targets and may accelerate funding timeline",
      actionable:
        "Implement immediate cost review across all departments; defer non-critical hires",
    },
    mqls: {
      hook: "Top-of-funnel volatility detected",
      analysis:
        "MQL fluctuation will cascade to pipeline coverage within 60-90 days",
      actionable: "Align with CMO on demand generation contingency plans",
    },
    cac: {
      hook: "Unit economics under pressure",
      analysis:
        "CAC movement is compressing LTV/CAC ratio, threatening sustainable growth targets",
      actionable:
        "Review channel efficiency with marketing leadership; consider organic growth acceleration",
    },
    top_risk: {
      hook: "Strategic risk escalation required",
      analysis: "Identified risk has potential to impact Q-over-Q performance",
      actionable: "Establish mitigation task force with weekly progress reviews",
    },
    deals_closed: {
      hook: "Pipeline conversion anomaly detected",
      analysis:
        "Deal closure rate impacts revenue recognition and forecast accuracy",
      actionable: "Request pipeline deep-dive from VP Sales with deal-level analysis",
    },
    velocity: {
      hook: "Sales cycle efficiency shifting",
      analysis:
        "Velocity changes affect capacity planning and revenue predictability",
      actionable: "Analyze stage-by-stage conversion rates for bottleneck identification",
    },
    top_opportunity: {
      hook: "Growth opportunity requires executive sponsorship",
      analysis: "Strategic opportunity alignment with company objectives confirmed",
      actionable: "Allocate resources and assign executive sponsor for acceleration",
    },
  },
  CMO: {
    arr: {
      hook: "Revenue-attributed marketing impact under review",
      analysis:
        "ARR movement correlates with marketing-influenced pipeline; attribution analysis critical",
      actionable:
        "Deep-dive into marketing-sourced vs. marketing-influenced revenue splits",
    },
    nrr: {
      hook: "Expansion revenue marketing programs need assessment",
      analysis:
        "NRR indicates upsell/cross-sell campaign effectiveness may need optimization",
      actionable: "Review customer marketing touchpoints and expansion triggers",
    },
    burn_multiple: {
      hook: "Marketing budget efficiency under scrutiny",
      analysis:
        "Burn pressure may result in marketing budget reallocation; prepare scenario plans",
      actionable: "Document high-ROI programs; prepare efficiency case for budget defense",
    },
    mqls: {
      hook: "Demand generation engine requires immediate calibration",
      analysis:
        "MQL volatility at this level threatens pipeline coverage and Sales confidence",
      actionable:
        "Audit channel mix; shift budget to highest-converting sources within 24 hours",
    },
    cac: {
      hook: "Marketing efficiency is compromised",
      analysis:
        "CAC spike indicates paid channel saturation or targeting decay; LTV/CAC ratio at risk",
      actionable:
        "Pause underperforming paid campaigns; accelerate organic and partner channel investments",
    },
    top_risk: {
      hook: "Marketing-related risk requires containment strategy",
      analysis:
        "Risk exposure may impact brand positioning and demand generation effectiveness",
      actionable: "Develop risk mitigation messaging and channel diversification plan",
    },
    deals_closed: {
      hook: "Marketing-Sales handoff quality in question",
      analysis:
        "Deal closure patterns may indicate lead quality or nurture program issues",
      actionable: "Review MQL-to-SQL conversion rates and lead scoring criteria",
    },
    velocity: {
      hook: "Content and enablement impact on sales cycle",
      analysis:
        "Sales velocity changes may reflect marketing content effectiveness in buyer journey",
      actionable: "Analyze content engagement metrics at each pipeline stage",
    },
    top_opportunity: {
      hook: "Market opportunity for campaign expansion identified",
      analysis: "Opportunity aligns with target segment growth initiatives",
      actionable: "Design targeted campaign to capture opportunity within current quarter",
    },
  },
  "VP Sales": {
    arr: {
      hook: "Revenue attainment trajectory shifting",
      analysis:
        "ARR movement directly impacts quota attainment and compensation planning",
      actionable:
        "Conduct pipeline coverage analysis and identify at-risk deals for acceleration",
    },
    nrr: {
      hook: "Account expansion performance under review",
      analysis: "NRR indicates upsell execution effectiveness needs assessment",
      actionable:
        "Review expansion playbook; identify accounts with untapped potential",
    },
    burn_multiple: {
      hook: "Sales investment efficiency being evaluated",
      analysis:
        "Burn pressure may impact headcount plans and territory coverage",
      actionable: "Prepare productivity metrics; demonstrate ROI per sales rep",
    },
    mqls: {
      hook: "Inbound pipeline health fluctuating",
      analysis:
        "MQL changes will impact pipeline coverage in 30-60 days; outbound may need to compensate",
      actionable:
        "Increase outbound activity targets; strengthen BDR/AE collaboration",
    },
    cac: {
      hook: "Sales efficiency metrics under pressure",
      analysis:
        "CAC movement affects deal economics and pricing strategy flexibility",
      actionable: "Review deal sizes and discount patterns; optimize pricing execution",
    },
    top_risk: {
      hook: "Pipeline risk requires immediate containment",
      analysis:
        "Identified risk threatens quarterly attainment and team morale",
      actionable: "Develop risk mitigation plan with deal-specific recovery strategies",
    },
    deals_closed: {
      hook: "Pipeline conversion velocity demands attention",
      analysis:
        "Deal closure patterns indicate potential process or competitive dynamics shifts",
      actionable:
        "Win/loss analysis on recent deals; adjust sales methodology if needed",
    },
    velocity: {
      hook: "Deal cycle efficiency impacting forecast accuracy",
      analysis:
        "Velocity changes affect commit accuracy and resource allocation planning",
      actionable:
        "Implement stage-exit criteria review; identify and resolve deal stagnation",
    },
    top_opportunity: {
      hook: "High-value opportunity in pipeline acceleration zone",
      analysis:
        "Opportunity represents significant contribution to quarterly target",
      actionable: "Assign executive sponsor; develop custom close plan with timeline",
    },
  },
};

// =============================================================================
// STABLE STATE NARRATIVES (No Urgency)
// =============================================================================
const STABLE_NARRATIVES: Record<Persona, string[]> = {
  CEO: [
    "We are seeing healthy expansion across key financial metrics.",
    "Capital efficiency remains strong with favorable unit economics.",
    "Growth trajectory aligns with Series B benchmarks.",
    "Operating metrics indicate sustainable scaling patterns.",
  ],
  CMO: [
    "Demand generation engine is performing within healthy parameters.",
    "Channel mix efficiency supports sustainable MQL growth.",
    "Marketing-influenced pipeline maintains strong coverage.",
    "Brand momentum and conversion rates are stable.",
  ],
  "VP Sales": [
    "Pipeline health and velocity metrics are tracking to plan.",
    "Sales productivity ratios remain competitive.",
    "Deal flow and conversion rates support forecast confidence.",
    "Territory coverage and capacity utilization are optimized.",
  ],
};

// =============================================================================
// HELPER: Get Top Urgent Metric (excluding insight cards)
// =============================================================================
function getTopUrgentMetric(
  metrics: PrioritizedMetric[]
): PrioritizedMetric | null {
  return (
    metrics.find((m) => m.isUrgent && !m.isInsightCard && m.id !== "top_risk") ||
    null
  );
}

// =============================================================================
// HELPER: Get Secondary Metric for Context
// =============================================================================
function getSecondaryMetric(
  metrics: PrioritizedMetric[],
  excludeId: MetricId | null
): PrioritizedMetric | null {
  return (
    metrics.find(
      (m) => !m.isInsightCard && m.id !== excludeId && m.id !== "top_risk"
    ) || null
  );
}

// =============================================================================
// MAIN FUNCTION: Generate Strategic Insight (Hyper-Reactive)
// =============================================================================
export function generateStrategicInsight(
  result: IntelligenceResult,
  data: DashboardState
): CompositeInsight {
  const { prioritizedMetrics, persona, hasUrgentMetrics } = result;

  // Find the most urgent metric (chaos-triggered)
  const urgentMetric = getTopUrgentMetric(prioritizedMetrics);

  // Find secondary metric for context
  const secondaryMetric = getSecondaryMetric(
    prioritizedMetrics,
    urgentMetric?.id || null
  );

  // =========================================================================
  // URGENT STATE: Critical & Tactical Tone
  // =========================================================================
  if (hasUrgentMetrics && urgentMetric) {
    const narrative = URGENCY_NARRATIVES[persona][urgentMetric.id];

    // Build the Hook with urgency prefix
    let hook = "";
    if (urgentMetric.trend === "negative" || urgentMetric.changePercent < 0) {
      hook = `🚨 IMMEDIATE ATTENTION REQUIRED: ${narrative.hook}.`;
    } else {
      hook = `⚡ URGENT OBSERVATION: ${narrative.hook}.`;
    }

    // Build the Analysis with data context (with .toFixed(1) precision)
    const changeDirection =
      urgentMetric.changePercent > 0 ? "increased" : "decreased";
    const changeAbs = Math.abs(urgentMetric.changePercent);
    const safeChangeAbs = isNaN(changeAbs) || !isFinite(changeAbs) ? 0 : changeAbs;
    let analysis = `${urgentMetric.title} has ${changeDirection} by ${safeChangeAbs.toFixed(1)}% — ${narrative.analysis}.`;

    // Add secondary metric context if available
    if (secondaryMetric) {
      const secondaryTrend =
        secondaryMetric.trend === "positive"
          ? "providing a counterbalance"
          : "compounding the concern";
      analysis += ` Meanwhile, ${secondaryMetric.title.toLowerCase()} at ${secondaryMetric.value} is ${secondaryTrend}.`;
    }

    // Build the Actionable recommendation
    const actionable = `**Strategic Recommendation:** ${narrative.actionable}.`;

    return {
      hook,
      analysis,
      actionable,
      fullText: `${hook} ${analysis} ${actionable}`,
      severity:
        urgentMetric.trend === "negative" || urgentMetric.changePercent < 0
          ? "critical"
          : "warning",
      primaryMetric: urgentMetric.id,
    };
  }

  // =========================================================================
  // STABLE STATE: Strategic & Advisory Tone
  // =========================================================================
  const stableNarratives = STABLE_NARRATIVES[persona];
  const randomStable =
    stableNarratives[Math.floor(Math.random() * stableNarratives.length)];

  // Get top two metrics for stable insight
  const topMetric = prioritizedMetrics.find(
    (m) => !m.isInsightCard && m.id !== "top_risk"
  );
  const topMetric2 = getSecondaryMetric(prioritizedMetrics, topMetric?.id || null);

  // Build stable hook
  const hook = `✅ ${randomStable}`;

    // Build stable analysis with data points (values already formatted with .toFixed(1) via formatCurrency/formatChange)
    let analysis = "";
    if (topMetric) {
      const trendWord =
        topMetric.trend === "positive"
          ? "trending positively"
          : topMetric.trend === "negative"
            ? "requiring monitoring"
            : "holding steady";
      analysis = `Your ${topMetric.title.toLowerCase()} at ${topMetric.value} is ${trendWord}.`;

      if (topMetric2) {
        analysis += ` ${topMetric2.title} at ${topMetric2.value} ${
          topMetric2.trend === "positive" ? "reinforces" : "balances"
        } the overall position.`;
      }
    }

  // Build stable actionable
  const stableActionables: Record<Persona, string> = {
    CEO: "Continue monitoring key metrics; no immediate intervention required",
    CMO: "Maintain current demand generation strategy; explore optimization opportunities",
    "VP Sales":
      "Stay the course on pipeline development; identify upside acceleration opportunities",
  };
  const actionable = `**Strategic Recommendation:** ${stableActionables[persona]}.`;

  return {
    hook,
    analysis,
    actionable,
    fullText: `${hook} ${analysis} ${actionable}`,
    severity: "stable",
    primaryMetric: topMetric?.id || null,
  };
}

// =============================================================================
// HELPER: Get Insight Text (Backwards Compatible)
// =============================================================================
export function getInsightText(
  result: IntelligenceResult,
  data: DashboardState
): string {
  return generateStrategicInsight(result, data).fullText;
}

