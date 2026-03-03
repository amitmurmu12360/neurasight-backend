/**
 * Agent 7: Narrative Synthesizer - Type Definitions
 * ==================================================
 * Types for narrative generation with strict Agent 2 synchronization.
 */

import type { MetricAuditResult } from "./mathAuditorTypes";

/**
 * Narrative Conflict Error
 * Thrown when narrative contradicts Agent 2's verified metrics
 */
export class NarrativeConflictError extends Error {
  constructor(
    message: string,
    public conflictingMetric: string,
    public agent2Value: number,
    public narrativeValue: number
  ) {
    super(message);
    this.name = "NarrativeConflictError";
  }
}

/**
 * Agent 2 Audit Handshake
 * Complete audit results from Agent 2 (Source of Truth)
 */
export interface Agent2AuditHandshake {
  verified: boolean;
  metrics: {
    arr: MetricAuditResult;
    nrr: MetricAuditResult;
    burn: MetricAuditResult;
    deals_closed?: MetricAuditResult;
  };
  forecast_verified: boolean;
  industry: string;
  requiresReScan: boolean;
}

/**
 * Narrative Status Tone Mapping
 * Maps benchmarked_status to narrative tone
 */
export const STATUS_TONE_MAP: Record<
  "healthy" | "warning" | "critical" | "unknown",
  {
    urgency: "low" | "medium" | "high";
    language: string[];
    forbiddenTerms: string[];
  }
> = {
  healthy: {
    urgency: "low",
    language: ["strong", "robust", "exceptional", "world-class", "excellent"],
    forbiddenTerms: ["critical", "urgent", "immediate intervention"],
  },
  warning: {
    urgency: "medium",
    language: ["monitoring", "attention required", "optimization opportunity"],
    forbiddenTerms: ["world-class", "exceptional", "critical risk"],
  },
  critical: {
    urgency: "high",
    language: ["critical risk", "immediate intervention required", "urgent action needed"],
    forbiddenTerms: ["world-class", "satisfactory", "healthy", "strong"],
  },
  unknown: {
    urgency: "low",
    language: ["under review", "data pending"],
    forbiddenTerms: ["world-class", "exceptional", "critical"],
  },
};

/**
 * Industry-Specific Vocabulary
 */
export const INDUSTRY_VOCABULARY: Record<
  string,
  {
    revenue: string;
    retention: string;
    efficiency: string;
    growth: string;
    risk: string;
  }
> = {
  saas: {
    revenue: "ARR",
    retention: "NRR",
    efficiency: "Burn Multiple",
    growth: "YoY Growth",
    risk: "Churn/LTV",
  },
  retail: {
    revenue: "Sales",
    retention: "Profit Margin",
    efficiency: "Efficiency Ratio",
    growth: "MoM Growth",
    risk: "Inventory/AOV",
  },
  ecommerce: {
    revenue: "GMV",
    retention: "Repeat Rate",
    efficiency: "ROAS",
    growth: "MoM Growth",
    risk: "Inventory/AOV",
  },
  generic: {
    revenue: "Revenue",
    retention: "Retention",
    efficiency: "Efficiency",
    growth: "Growth",
    risk: "Risk Factors",
  },
};
