/**
 * Agent 11: The Dynamic Strategy Engine
 * =======================================
 * Crown jewel of the NeuraSight Sovereign Swarm.
 * Replaces static templates with real-time Strategy Discovery Loop.
 * Thinks like a CEO, CMO, and VP Sales simultaneously using verified data.
 */

import type { DashboardState } from "@/types/dashboard";
import type { AgentResult } from "./orchestrator";
import type { MetricAuditResult } from "./mathAuditorTypes";
import type { VerificationCertificate } from "./agent0Validator";
import { getIndustryContext, type IndustryType } from "@/lib/intelligence/industryLibrary";
import { PrecisionHelper } from "./mathAuditorTypes";
import {
  getArchetypeDefinition,
  getArchetypeStrategyTemplates,
  type BusinessArchetype,
  CORE_INDUSTRY_TO_ARCHETYPE,
} from "@/lib/intelligence/archetypeLibrary";

/**
 * Persona Type
 */
export type Persona = "CEO" | "CMO" | "VP Sales";

/**
 * Strategic Action Output
 * Handshake format for the HUD
 */
export interface StrategicAction {
  /** Human-readable title */
  title: string;
  /** Impact analysis with quantified projections */
  impact_analysis: string;
  /** Risk level for this action */
  risk_level: "low" | "medium" | "high";
  /** Confidence score (0.0 to 1.0) */
  confidence_score: number;
  /** Persona alignment (which persona this serves) */
  persona_alignment: Persona;
  /** Industry-specific relevance */
  industry_relevance: IndustryType;
  /** One-click action payload for Phase 3 execution */
  one_click_action_payload: {
    action_type: string;
    parameters: Record<string, unknown>;
    target_metric?: string;
    expected_impact?: {
      metric: string;
      change_percent: number;
      timeframe: string;
    };
  };
  /** User feedback learning metadata */
  metadata?: {
    user_preference_bias?: string[];
    requires_manual_review?: boolean;
    conflict_resolution_applied?: boolean;
    anomaly_source?: string;
  };
}

/**
 * Anomaly Detection Result
 */
interface Anomaly {
  metric: string;
  deviation_type: "benchmark" | "trend" | "both";
  severity: "critical" | "warning" | "minor";
  current_value: number;
  benchmark_value?: number;
  trend_direction?: "increasing" | "decreasing" | "volatile";
  trend_magnitude?: number; // Percentage change
  description: string;
}

/**
 * Agent 2 Audit Result Structure
 */
interface Agent2AuditResult {
  verified: boolean;
  metrics: {
    arr?: MetricAuditResult;
    nrr?: MetricAuditResult;
    burn?: MetricAuditResult;
    deals_closed?: MetricAuditResult;
  };
  industry: string;
  forecast_verified?: boolean;
}

/**
 * Strategy Discovery Loop - Step A: Anomaly Detection
 * Scans MetricAuditResult from Agent 2 for deviations from benchmarks AND historical trends
 */
function detectAnomalies(
  auditResult: Agent2AuditResult,
  industryPolicy: ReturnType<typeof getIndustryContext>,
  edaInsights?: {
    trend_analysis?: {
      arr?: { latest_growth: number; previous_growth: number; trend: string; acceleration_rate: number };
      mqls?: { latest_growth: number; previous_growth: number; trend: string; acceleration_rate: number };
    };
  }
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check each verified metric
  Object.entries(auditResult.metrics).forEach(([metricKey, auditData]) => {
    if (!auditData.verified) return; // Zero Trust: Skip unverified metrics

    const metric = metricKey as keyof typeof auditResult.metrics;
    const status = auditData.benchmarked_status;
    const currentValue = auditData.raw_value;
    const growth = auditData.calculated_growth || 0;

    // Benchmark-based anomaly detection
    if (status === "critical" || status === "warning") {
      // Get benchmark threshold for this metric
      const healthyThreshold = industryPolicy.benchmarks.healthy[metric as keyof typeof industryPolicy.benchmarks.healthy];
      const criticalThreshold = industryPolicy.benchmarks.critical[metric as keyof typeof industryPolicy.benchmarks.critical];

      const benchmarkValue = healthyThreshold?.target || healthyThreshold?.min || healthyThreshold?.max;

      anomalies.push({
        metric,
        deviation_type: "benchmark",
        severity: status === "critical" ? "critical" : "warning",
        current_value: currentValue,
        benchmark_value: benchmarkValue,
        description: `${metric.toUpperCase()} is ${status}: ${currentValue} vs benchmark ${benchmarkValue || 'N/A'}`,
      });
    }

    // Trend-based anomaly detection (if EDA insights available)
    if (edaInsights?.trend_analysis) {
      const trendData = edaInsights.trend_analysis[metric as keyof typeof edaInsights.trend_analysis];
      if (trendData) {
        const { latest_growth, previous_growth, trend, acceleration_rate } = trendData;

        // Detect sudden spikes or drops (5% threshold for trend changes)
        const growthDelta = Math.abs(latest_growth - previous_growth);
        if (growthDelta > 5) {
          const trendDirection = latest_growth > previous_growth ? "increasing" : "decreasing";
          const severity = growthDelta > 10 ? "critical" : growthDelta > 7 ? "warning" : "minor";

          anomalies.push({
            metric,
            deviation_type: "trend",
            severity,
            current_value: currentValue,
            trend_direction: trendDirection,
            trend_magnitude: growthDelta,
            description: `${metric.toUpperCase()} showing ${trendDirection} trend: ${latest_growth.toFixed(1)}% change (${growthDelta.toFixed(1)}% deviation from previous)`,
          });
        }

        // Detect volatile trends (high acceleration rate)
        if (Math.abs(acceleration_rate) > 3) {
          anomalies.push({
            metric,
            deviation_type: "trend",
            severity: "warning",
            current_value: currentValue,
            trend_direction: "volatile",
            trend_magnitude: acceleration_rate,
            description: `${metric.toUpperCase()} showing volatile trend with ${acceleration_rate.toFixed(1)}x acceleration rate`,
          });
        }
      }
    }
  });

  return anomalies;
}

/**
 * Strategy Discovery Loop - Step B: Persona-Based Translation
 * Translates the same anomaly into different strategic insights based on Persona
 */
function translateAnomalyToPersonaStrategy(
  anomaly: Anomaly,
  persona: Persona,
  industry: IndustryType,
  auditResult: Agent2AuditResult,
  context?: Record<string, unknown>
): StrategicAction | null {
  const industryPolicy = getIndustryContext(industry);
  const metric = anomaly.metric;
  
  // Extract scenario_id for crisis mode adaptation
  const scenarioId = context?.scenario_id as string | undefined;
  const isCrisisMode = scenarioId === "market-crisis" || scenarioId === "saas-crisis";

  // CEO Lens: Focus on Valuation & Survival (Runway, NRR, Multiples)
  if (persona === "CEO") {
    if (metric === "arr" && anomaly.severity === "critical") {
      return {
        title: "Extend Runway: Reduce Burn Rate by 20%",
        impact_analysis: `Critical ARR decline detected (${anomaly.current_value}). Extending runway through strategic cost reduction protects valuation multiple and Series B positioning. Expected impact: +6 months runway extension.`,
        risk_level: "medium",
        confidence_score: 0.85,
        persona_alignment: "CEO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "reduce_burn_rate",
          parameters: { reduction_percent: 20, focus_areas: ["non-essential", "vendor_optimization"] },
          target_metric: "burn",
          expected_impact: {
            metric: "runway_months",
            change_percent: 30,
            timeframe: "30 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
          conflict_resolution_applied: false,
        },
      };
    }

    if (metric === "nrr" && anomaly.severity === "critical") {
      return {
        title: "Stabilize Net Revenue Retention: Launch Customer Success Initiative",
        impact_analysis: `NRR below 100% (${anomaly.current_value}%) signals retention risk. Customer Success program targeting expansion revenue can restore NRR to 110%+ within 90 days. Impact: +$2M ARR from expansion.`,
        risk_level: "low",
        confidence_score: 0.80,
        persona_alignment: "CEO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "launch_customer_success",
          parameters: { target_nrr: 110, focus_segment: "enterprise" },
          target_metric: "nrr",
          expected_impact: {
            metric: "nrr",
            change_percent: 10,
            timeframe: "90 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
        },
      };
    }

    if (metric === "burn" && anomaly.severity === "critical") {
      // Scenario-aware: Crisis mode prioritizes Cash Flow Preservation
      const isCrisis = (context as any)?.scenario_id === "market-crisis" || (context as any)?.scenario_id === "saas-crisis";
      return {
        title: isCrisis 
          ? "Cash Flow Preservation: Immediate Burn Rate Reduction (CRISIS MODE)"
          : "Address Burn Multiple: Accelerate Revenue or Reduce Spend",
        impact_analysis: isCrisis
          ? `CRISIS MODE: Burn Multiple > 1.5x requires immediate cash flow preservation. Prioritize: (1) Reduce non-essential spend by 30%, (2) Extend runway by 60+ days, (3) Focus on revenue retention over growth. Expected impact: Burn Multiple reduction to 0.8x, 90-day runway extension.`
          : `Burn Multiple > 1.5x indicates capital inefficiency. Strategic options: (1) Accelerate sales velocity to increase revenue, (2) Reduce marketing spend by 15% to optimize efficiency. Expected impact: Burn Multiple reduction to 1.0x.`,
        risk_level: "high",
        confidence_score: isCrisis ? 0.90 : 0.75,
        persona_alignment: "CEO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "optimize_burn_multiple",
          parameters: isCrisis 
            ? { target_multiple: 0.8, strategy: "cash_preservation", reduction_percent: 30 }
            : { target_multiple: 1.0, strategy: "balanced" },
          target_metric: "burn",
          expected_impact: {
            metric: "burn_multiple",
            change_percent: isCrisis ? -47 : -33,
            timeframe: isCrisis ? "30 days" : "60 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
          requires_manual_review: !isCrisis,
        },
      };
    }
  }

  // CMO Lens: Focus on Growth & Efficiency (CAC, LTV, Channel Attribution)
  if (persona === "CMO") {
    if (metric === "mqls" && anomaly.trend_direction === "decreasing" && anomaly.trend_magnitude && anomaly.trend_magnitude > 7) {
      return {
        title: "Restore MQL Pipeline: Reallocate Budget to High-ROI Channels",
        impact_analysis: `MQL pipeline declining by ${anomaly.trend_magnitude.toFixed(1)}%. Channel analysis shows content marketing underperforming. Reallocate 30% budget to paid search and account-based marketing. Expected impact: +25% MQLs in 60 days.`,
        risk_level: "medium",
        confidence_score: 0.82,
        persona_alignment: "CMO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "reallocate_marketing_budget",
          parameters: { from_channel: "content", to_channel: "paid_search", percent: 30 },
          target_metric: "mqls",
          expected_impact: {
            metric: "mqls",
            change_percent: 25,
            timeframe: "60 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
        },
      };
    }

    // For Retail/E-commerce: Focus on ROAS and Gross Margin
    if ((industry === "retail" || industry === "ecommerce") && metric === "nrr" && anomaly.severity === "critical") {
      return {
        title: "Optimize Gross Margin: Review Product Mix and Pricing",
        impact_analysis: `Gross Margin below 30% (${anomaly.current_value}%) indicates pricing or product mix issues. Analyze high-margin SKUs and adjust inventory mix. Expected impact: +5% margin improvement, +$500K annual profit.`,
        risk_level: "low",
        confidence_score: 0.78,
        persona_alignment: "CMO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "optimize_product_mix",
          parameters: { target_margin: 35, focus_category: "high_margin_skus" },
          target_metric: "gross_margin",
          expected_impact: {
            metric: "gross_margin",
            change_percent: 5,
            timeframe: "90 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
        },
      };
    }
  }

  // VP Sales Lens: Focus on Velocity & Revenue (Deal cycles, Pipeline health, Quota)
  if (persona === "VP Sales") {
    if (metric === "deals_closed" && anomaly.trend_direction === "decreasing") {
      return {
        title: "Accelerate Sales Velocity: Reduce Deal Cycle Time by 20%",
        impact_analysis: `Deals closed declining. Analysis shows average cycle time increased by 15 days. Implement sales acceleration playbook: (1) Faster qualification, (2) Technical pre-sales automation. Expected impact: +30% deal closure rate, 20% shorter cycles.`,
        risk_level: "medium",
        confidence_score: 0.85,
        persona_alignment: "VP Sales",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "accelerate_sales_velocity",
          parameters: { target_cycle_reduction: 20, focus_stage: "qualification" },
          target_metric: "deals_closed",
          expected_impact: {
            metric: "deals_closed",
            change_percent: 30,
            timeframe: "45 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
        },
      };
    }

    if (metric === "arr" && anomaly.trend_direction === "increasing" && anomaly.trend_magnitude && anomaly.trend_magnitude > 10) {
      return {
        title: "Capitalize on Growth Momentum: Expand Sales Team",
        impact_analysis: `ARR growing at ${anomaly.trend_magnitude.toFixed(1)}% - above target. Sales capacity is constraint. Hire 2 additional AEs to capture market momentum. Expected impact: +40% ARR growth acceleration.`,
        risk_level: "low",
        confidence_score: 0.88,
        persona_alignment: "VP Sales",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "expand_sales_team",
          parameters: { new_hires: 2, role: "account_executive" },
          target_metric: "arr",
          expected_impact: {
            metric: "arr",
            change_percent: 40,
            timeframe: "90 days",
          },
        },
        metadata: {
          anomaly_source: anomaly.description,
        },
      };
    }
  }

  return null; // No strategy generated for this anomaly/persona combination
}

/**
 * Conflict Resolution: Cross-check suggestions with Agent 0 Validator
 * Downgrade or block suggestions that contradict critical math alerts
 */
function resolveConflicts(
  strategies: StrategicAction[],
  validatorResult?: {
    success: boolean;
    certificate?: VerificationCertificate;
    error?: string;
    data?: { requiresReScan?: boolean; integrityFailure?: boolean };
  },
  auditResult?: Agent2AuditResult
): StrategicAction[] {
  if (!validatorResult || validatorResult.success) {
    return strategies; // No conflicts if validation passed
  }

  // If validation failed, downgrade all strategies
  return strategies.map((strategy) => {
    // Block strategies that contradict critical alerts
    if (validatorResult.data?.integrityFailure) {
      // If integrity failure, mark all strategies as requiring manual review
      return {
        ...strategy,
        confidence_score: Math.min(strategy.confidence_score, 0.5),
        metadata: {
          ...strategy.metadata,
          requires_manual_review: true,
          conflict_resolution_applied: true,
        },
      };
    }

    // If low runway detected, block strategies that increase spend
    if (
      auditResult?.metrics.burn?.benchmarked_status === "critical" &&
      (strategy.one_click_action_payload.action_type === "expand_sales_team" ||
        strategy.one_click_action_payload.action_type === "reallocate_marketing_budget")
    ) {
      return {
        ...strategy,
        risk_level: "high" as const,
        confidence_score: Math.min(strategy.confidence_score * 0.7, 0.6),
        metadata: {
          ...strategy.metadata,
          requires_manual_review: true,
          conflict_resolution_applied: true,
        },
      };
    }

    return strategy;
  });
}

/**
 * Industry-Specific Strategy Logic
 */
function generateIndustrySpecificStrategies(
  industry: IndustryType,
  anomalies: Anomaly[],
  auditResult: Agent2AuditResult,
  persona: Persona
): StrategicAction[] {
  const industryPolicy = getIndustryContext(industry);
  const strategies: StrategicAction[] = [];

  // SaaS: T2D3 growth heuristics and LTV/CAC ratios
  if (industry === "saas") {
    const arrValue = auditResult.metrics.arr?.raw_value || 0;
    const nrrValue = auditResult.metrics.nrr?.raw_value || 0;

    // T2D3 heuristic: If ARR < $2M, focus on growth over efficiency
    if (arrValue < 2 && persona === "CEO") {
      strategies.push({
        title: "T2D3 Growth Strategy: Accelerate to $2M ARR",
        impact_analysis: `At ${arrValue.toFixed(1)}M ARR, prioritize growth over efficiency. T2D3 framework: Double revenue every 12 months for 3 years. Focus on product-market fit and customer acquisition.`,
        risk_level: "medium",
        confidence_score: 0.85,
        persona_alignment: "CEO",
        industry_relevance: "saas",
        one_click_action_payload: {
          action_type: "t2d3_acceleration",
          parameters: { target_arr: 2, timeframe: "12 months" },
          target_metric: "arr",
          expected_impact: {
            metric: "arr",
            change_percent: 100,
            timeframe: "12 months",
          },
        },
      });
    }

    // LTV/CAC optimization
    if (persona === "CMO") {
      strategies.push({
        title: "Optimize LTV/CAC Ratio: Improve Customer Lifetime Value",
        impact_analysis: `SaaS benchmarks require LTV/CAC > 3:1. Current metrics suggest optimization needed. Focus on: (1) Reducing churn, (2) Increasing expansion revenue. Expected impact: +20% LTV improvement.`,
        risk_level: "low",
        confidence_score: 0.80,
        persona_alignment: "CMO",
        industry_relevance: "saas",
        one_click_action_payload: {
          action_type: "optimize_ltv_cac",
          parameters: { target_ratio: 3.5, focus: "retention_and_expansion" },
          target_metric: "ltv",
          expected_impact: {
            metric: "ltv",
            change_percent: 20,
            timeframe: "90 days",
          },
        },
      });
    }
  }

  // Retail: Inventory Turnover and Gross Margin ROI
  if (industry === "retail" || industry === "ecommerce") {
    const grossMargin = auditResult.metrics.nrr?.raw_value || 0; // In Retail, NRR = Gross Margin

    if (grossMargin < 30 && persona === "CMO") {
      strategies.push({
        title: "Improve Inventory Turnover: Reduce Dead Stock",
        impact_analysis: `Gross Margin at ${grossMargin.toFixed(1)}% below 30% target. Focus on inventory optimization: (1) Liquidate slow-moving SKUs, (2) Increase turnover rate. Expected impact: +8% margin improvement.`,
        risk_level: "medium",
        confidence_score: 0.82,
        persona_alignment: "CMO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "optimize_inventory_turnover",
          parameters: { target_margin: 35, liquidation_percent: 15 },
          target_metric: "gross_margin",
          expected_impact: {
            metric: "gross_margin",
            change_percent: 8,
            timeframe: "60 days",
          },
        },
      });
    }
  }

  // E-commerce: Repeat Purchase Rate and ROAS
  if (industry === "ecommerce") {
    if (persona === "CMO") {
      strategies.push({
        title: "Increase Repeat Purchase Rate: Launch Loyalty Program",
        impact_analysis: `E-commerce success depends on repeat customers. Launch tiered loyalty program targeting 30% repeat purchase rate. Expected impact: +15% customer lifetime value.`,
        risk_level: "low",
        confidence_score: 0.85,
        persona_alignment: "CMO",
        industry_relevance: "ecommerce",
        one_click_action_payload: {
          action_type: "launch_loyalty_program",
          parameters: { target_repeat_rate: 30, program_type: "tiered" },
          target_metric: "customer_repeat_rate",
          expected_impact: {
            metric: "customer_repeat_rate",
            change_percent: 15,
            timeframe: "90 days",
          },
        },
      });
    }
  }

  // Marketing Agency: Client Retention and Resource Utilization
  // Note: Using "analyst" as the industry ID for marketing agency (from industryLibrary)
  if (industry === "analyst") {
    const retention = auditResult.metrics.nrr?.raw_value || 0; // Client Retention

    if (retention < 80 && persona === "CEO") {
      strategies.push({
        title: "Improve Client Retention: Enhance Service Delivery",
        impact_analysis: `Client Retention at ${retention.toFixed(1)}% below 80% benchmark. Focus on: (1) Proactive account management, (2) Value-added reporting. Expected impact: +10% retention improvement.`,
        risk_level: "medium",
        confidence_score: 0.80,
        persona_alignment: "CEO",
        industry_relevance: industry,
        one_click_action_payload: {
          action_type: "improve_client_retention",
          parameters: { target_retention: 85, focus: "account_management" },
          target_metric: "client_retention",
          expected_impact: {
            metric: "client_retention",
            change_percent: 10,
            timeframe: "90 days",
          },
        },
      });
    }
  }

  return strategies;
}

/**
 * Main execution function for Agent 11: The Dynamic Strategy Engine
 */
export async function executeAgent11StrategyEngine(
  data: DashboardState,
  context?: Record<string, unknown>
): Promise<AgentResult> {
  try {
    // =============================================================================
    // ZERO TRUST: Extract Agent 2 (Math Auditor) results
    // =============================================================================
    const auditResult = context?.auditorResult as Agent2AuditResult | undefined;

    if (!auditResult || !auditResult.verified) {
      return {
        agentId: "strategy",
        success: false,
        error: "Agent 11: Cannot generate strategies - Agent 2 (Math Auditor) verification required.",
        data: {
          requiresAgent2Verification: true,
        },
        metadata: {
          strategyGenerationLevel: "agent2-required",
          allStrategiesGenerated: false,
          message: "Strategy generation halted: Agent 2 verification required.",
        },
      };
    }

    // Extract persona and industry
    const persona = (context?.persona as Persona) || "CEO";
    const industry = (auditResult.industry as IndustryType) || "saas";
    
    // =============================================================================
    // ARCHETYPE FALLBACK: Zero-Shot Reasoning for Non-Core Industries
    // =============================================================================
    const isCoreIndustry = industry === "saas" || industry === "retail" || industry === "ecommerce" || industry === "analyst";
    let businessArchetype: BusinessArchetype | undefined;
    
    // Get archetype from Agent 1 (Data Sentinel) result if industry is not core
    if (!isCoreIndustry && industry === "generic") {
      const sentinelResult = context?.sentinelResult as { businessArchetype?: BusinessArchetype } | undefined;
      businessArchetype = sentinelResult?.businessArchetype;
    } else if (isCoreIndustry) {
      // Map core industry to archetype (for consistency)
      businessArchetype = CORE_INDUSTRY_TO_ARCHETYPE[industry];
    }
    
    // Always use core industry policy if available (GOLD STANDARD - never override)
    const industryPolicy = isCoreIndustry ? getIndustryContext(industry) : undefined;

    // Extract EDA insights for trend analysis
    const edaInsights = context?.eda_insights as {
      trend_analysis?: {
        arr?: { latest_growth: number; previous_growth: number; trend: string; acceleration_rate: number };
        mqls?: { latest_growth: number; previous_growth: number; trend: string; acceleration_rate: number };
      };
    } | undefined;

    // Extract Agent 0 Validator result for conflict resolution
    const validatorResult = context?.validatorResult as {
      success: boolean;
      certificate?: VerificationCertificate;
      error?: string;
      data?: { requiresReScan?: boolean; integrityFailure?: boolean };
    } | undefined;

    // =============================================================================
    // STEP A: ANOMALY DETECTION
    // =============================================================================
    // Use archetype-based policy if not core industry, otherwise use core policy
    const policyForAnomalyDetection = industryPolicy || (businessArchetype && businessArchetype !== "unknown" ? getIndustryContext("generic") : getIndustryContext("saas"));
    const anomalies = detectAnomalies(auditResult, policyForAnomalyDetection, edaInsights);

    if (anomalies.length === 0) {
      return {
        agentId: "strategy",
        success: true,
        data: {
          strategies: [],
          anomalies_detected: 0,
          message: "No anomalies detected. All metrics within healthy ranges.",
        },
        metadata: {
          strategyGenerationLevel: "no-anomalies",
          allStrategiesGenerated: true,
          message: "Agent 11: No strategic actions required - all metrics healthy.",
        },
      };
    }

    // =============================================================================
    // STEP B: PERSONA-BASED TRANSLATION
    // =============================================================================
    let strategies: StrategicAction[] = [];

    // Translate each anomaly to persona-specific strategies (pass context for scenario awareness)
    anomalies.forEach((anomaly) => {
      const strategy = translateAnomalyToPersonaStrategy(anomaly, persona, industry, auditResult, context);
      if (strategy) {
        strategies.push(strategy);
      }
    });

    // =============================================================================
    // INDUSTRY-SPECIFIC STRATEGIES
    // =============================================================================
    const industryStrategies = generateIndustrySpecificStrategies(industry, anomalies, auditResult, persona);
    strategies = [...strategies, ...industryStrategies];

    // =============================================================================
    // CONFLICT RESOLUTION: Cross-check with Agent 0 Validator
    // =============================================================================
    strategies = resolveConflicts(strategies, validatorResult, auditResult);

    // =============================================================================
    // CONFIDENCE SCORING: Mark low-confidence strategies for manual review
    // =============================================================================
    strategies = strategies.map((strategy) => {
      if (strategy.confidence_score < 0.75) {
        return {
          ...strategy,
          metadata: {
            ...strategy.metadata,
            requires_manual_review: true,
          },
        };
      }
      return strategy;
    });

    // =============================================================================
    // ADAPTIVE LEARNING HOOKS: Prepare user feedback schema
    // =============================================================================
    // User preferences are stored in metadata.user_preference_bias
    // This will be populated when user feedback is received (Phase 3)

    // =============================================================================
    // SUCCESS: Return Strategic Actions
    // =============================================================================
    return {
      agentId: "strategy",
      success: true,
      data: {
        strategies,
        anomalies_detected: anomalies.length,
        persona,
        industry,
        confidence_breakdown: {
          high_confidence: strategies.filter((s) => s.confidence_score >= 0.75).length,
          needs_review: strategies.filter((s) => s.confidence_score < 0.75).length,
        },
      },
      metadata: {
        strategyGenerationLevel: "strategy-engine",
        allStrategiesGenerated: true,
        message: `Agent 11: Generated ${strategies.length} strategic actions for ${persona} in ${industry} industry. ${anomalies.length} anomalies detected.`,
        persona,
        industry,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("[Agent 11: Dynamic Strategy Engine] Error:", {
      error: errorMessage,
    });

    return {
      agentId: "strategy",
      success: false,
      error: errorMessage,
      data: {
        strategies: [],
      },
      metadata: {
        strategyGenerationLevel: "strategy-error",
        allStrategiesGenerated: false,
        message: `Agent 11: Strategy generation FAILED - ${errorMessage}`,
        errorType: "strategy_generation_error",
        errorDetails: errorMessage,
      },
    };
  }
}

