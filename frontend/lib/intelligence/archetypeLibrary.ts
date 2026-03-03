/**
 * Sovereign Archetype Adapter - Global Business DNA Library
 * ==========================================================
 * Enables NeuraSight to handle any global business model by detecting
 * underlying Business DNA Archetypes beyond the 4 core industries.
 */

import type { IndustryType } from "./industryLibrary";

/**
 * Business DNA Archetypes (Universal Classification)
 */
export type BusinessArchetype = "subscription" | "transactional" | "lead-gen" | "unit-economy" | "unknown";

/**
 * Business DNA Signature
 */
export interface DNASignature {
  /** Recurring payment frequency (monthly, quarterly, annual) */
  recurringPattern?: "monthly" | "quarterly" | "annual" | "irregular";
  /** Transaction volume variance (high = transactional, low = subscription) */
  transactionVariance: number;
  /** Lead-to-close ratio (high = lead-gen) */
  leadToCloseRatio?: number;
  /** Unit economics focus (high = unit-economy) */
  unitEconomicsFocus?: number;
  /** SKU/product variance (high = transactional) */
  skuVariance?: number;
}

/**
 * Archetype Definition
 */
export interface ArchetypeDefinition {
  id: BusinessArchetype;
  name: string;
  description: string;
  /** Primary metrics for this archetype */
  primaryMetrics: string[];
  /** Metric mappings (generic -> archetype-specific) */
  metricMappings: Record<string, string>;
  /** Typical growth patterns */
  growthPatterns: string[];
  /** Strategy templates (for Agent 11) */
  strategyTemplates: string[];
}

/**
 * Core Industry to Archetype Mapping (Gold Standard)
 */
export const CORE_INDUSTRY_TO_ARCHETYPE: Record<IndustryType, BusinessArchetype> = {
  saas: "subscription",
  ecommerce: "transactional",
  retail: "transactional",
  fintech: "subscription", // Most fintech is subscription-based
  analyst: "lead-gen", // Marketing agencies are lead-gen focused
  generic: "unknown",
};

/**
 * Archetype Definitions (Universal Templates)
 */
export const ARCHETYPE_DEFINITIONS: Record<BusinessArchetype, ArchetypeDefinition> = {
  subscription: {
    id: "subscription",
    name: "Subscription / Recurring",
    description: "Business model based on recurring revenue and customer retention",
    primaryMetrics: ["arr", "nrr", "churn", "mrr", "ltv", "cac"],
    metricMappings: {
      revenue: "arr",
      recurring_revenue: "arr",
      monthly_revenue: "mrr",
      annual_revenue: "arr",
      retention: "nrr",
      customer_retention: "nrr",
      churn_rate: "churn",
      customer_churn: "churn",
      lifetime_value: "ltv",
      ltv: "ltv",
      customer_acquisition_cost: "cac",
      cac: "cac",
    },
    growthPatterns: ["expansion_revenue", "upsells", "cross_sells", "retention"],
    strategyTemplates: [
      "Improve Net Revenue Retention (NRR) through expansion revenue",
      "Reduce churn through customer success initiatives",
      "Optimize LTV/CAC ratio for sustainable growth",
      "Implement tiered pricing for upselling opportunities",
    ],
  },
  transactional: {
    id: "transactional",
    name: "Transactional / Trade",
    description: "Business model based on one-time transactions and product sales",
    primaryMetrics: ["gmv", "gross_margin", "inventory_velocity", "aov", "roas"],
    metricMappings: {
      revenue: "gmv",
      sales: "gmv",
      total_revenue: "gmv",
      gross_profit: "gross_margin",
      profit_margin: "gross_margin",
      margin: "gross_margin",
      inventory_turnover: "inventory_velocity",
      turnover: "inventory_velocity",
      average_order_value: "aov",
      order_value: "aov",
      return_on_ad_spend: "roas",
      roas: "roas",
    },
    growthPatterns: ["volume_growth", "margin_expansion", "inventory_optimization"],
    strategyTemplates: [
      "Optimize gross margin through product mix adjustments",
      "Improve inventory turnover to reduce holding costs",
      "Increase average order value (AOV) through bundling",
      "Optimize ROAS for paid acquisition channels",
    ],
  },
  "lead-gen": {
    id: "lead-gen",
    name: "Lead Generation / Pipeline",
    description: "Business model focused on generating and converting leads",
    primaryMetrics: ["mqls", "cac", "conversion_rate", "lead_velocity", "sqls"],
    metricMappings: {
      leads: "mqls",
      marketing_qualified_leads: "mqls",
      mql: "mqls",
      qualified_leads: "mqls",
      customer_acquisition_cost: "cac",
      cac: "cac",
      lead_cost: "cac",
      conversion: "conversion_rate",
      close_rate: "conversion_rate",
      lead_to_customer: "conversion_rate",
      sales_qualified_leads: "sqls",
      sql: "sqls",
    },
    growthPatterns: ["lead_volume", "conversion_optimization", "pipeline_velocity"],
    strategyTemplates: [
      "Increase MQL volume through channel optimization",
      "Improve conversion rate from lead to customer",
      "Optimize CAC through channel mix analysis",
      "Accelerate pipeline velocity through qualification",
    ],
  },
  "unit-economy": {
    id: "unit-economy",
    name: "Unit Economy / Efficiency",
    description: "Business model focused on unit-level profitability and operational efficiency",
    primaryMetrics: ["unit_margin", "contribution_margin", "cogs", "efficiency_ratio"],
    metricMappings: {
      unit_profit: "unit_margin",
      profit_per_unit: "unit_margin",
      margin_per_unit: "unit_margin",
      contribution: "contribution_margin",
      gross_contribution: "contribution_margin",
      cost_of_goods: "cogs",
      cogs: "cogs",
      operational_efficiency: "efficiency_ratio",
      efficiency: "efficiency_ratio",
    },
    growthPatterns: ["margin_expansion", "scale_efficiency", "cost_optimization"],
    strategyTemplates: [
      "Improve unit margin through cost reduction",
      "Scale operations while maintaining efficiency ratios",
      "Optimize contribution margin per unit",
      "Reduce COGS through supplier optimization",
    ],
  },
  unknown: {
    id: "unknown",
    name: "Unknown / Unrecognized",
    description: "Business model cannot be classified",
    primaryMetrics: ["revenue", "profit", "customers"],
    metricMappings: {},
    growthPatterns: [],
    strategyTemplates: [],
  },
};

/**
 * Detect Business DNA Archetype from Data Patterns
 * 
 * @param dnaSignature - DNA signature calculated from data
 * @param industry - Detected industry (if known)
 * @returns Business DNA Archetype
 */
export function detectBusinessArchetype(
  dnaSignature: DNASignature,
  industry?: IndustryType
): BusinessArchetype {
  // If industry is one of our core industries, use gold standard mapping
  if (industry && industry !== "generic" && CORE_INDUSTRY_TO_ARCHETYPE[industry]) {
    return CORE_INDUSTRY_TO_ARCHETYPE[industry];
  }

  const { transactionVariance, recurringPattern, leadToCloseRatio, unitEconomicsFocus, skuVariance } = dnaSignature;

  // Subscription DNA: Low variance, recurring pattern, high retention indicators
  if (recurringPattern && transactionVariance < 100 && !skuVariance) {
    return "subscription";
  }

  // Transactional DNA: High variance, high SKU variance, no recurring pattern
  if (transactionVariance > 1000 && (skuVariance || 0) > 0.5) {
    return "transactional";
  }

  // Lead-Gen DNA: High lead-to-close ratio, moderate variance
  if (leadToCloseRatio !== undefined && leadToCloseRatio > 0.1 && transactionVariance < 500) {
    return "lead-gen";
  }

  // Unit-Economy DNA: Focus on unit-level metrics, moderate variance
  if (unitEconomicsFocus !== undefined && unitEconomicsFocus > 0.7 && transactionVariance < 200) {
    return "unit-economy";
  }

  // Fallback to subscription if recurring pattern is detected
  if (recurringPattern) {
    return "subscription";
  }

  // Fallback to transactional if high variance
  if (transactionVariance > 500) {
    return "transactional";
  }

  // Default to unknown if no clear pattern
  return "unknown";
}

/**
 * Get Archetype Definition
 */
export function getArchetypeDefinition(archetype: BusinessArchetype): ArchetypeDefinition {
  return ARCHETYPE_DEFINITIONS[archetype];
}

/**
 * Map Generic Metric to Archetype-Specific Metric
 */
export function mapMetricToArchetype(
  genericMetric: string,
  archetype: BusinessArchetype
): string {
  const definition = ARCHETYPE_DEFINITIONS[archetype];
  const mapped = definition.metricMappings[genericMetric.toLowerCase()];
  return mapped || genericMetric;
}

/**
 * Get Primary Metrics for Archetype
 */
export function getArchetypePrimaryMetrics(archetype: BusinessArchetype): string[] {
  return ARCHETYPE_DEFINITIONS[archetype].primaryMetrics;
}

/**
 * Get Strategy Templates for Archetype (Agent 11)
 */
export function getArchetypeStrategyTemplates(archetype: BusinessArchetype): string[] {
  return ARCHETYPE_DEFINITIONS[archetype].strategyTemplates;
}

/**
 * Calculate DNA Signature from Data
 * 
 * This is a simplified version. In production, this would analyze:
 * - Payment frequency patterns
 * - Transaction amount variance
 * - Product/SKU diversity
 * - Lead-to-customer conversion patterns
 */
export function calculateDNASignature(data: {
  amounts: number[];
  timestamps?: Date[] | string[];
  products?: string[];
  leads?: number[];
  customers?: number[];
}): DNASignature {
  const amounts = data.amounts.filter((a) => !isNaN(a) && isFinite(a));

  // Calculate transaction variance
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;

  // Detect recurring pattern from timestamps
  let recurringPattern: "monthly" | "quarterly" | "annual" | "irregular" | undefined;
  if (data.timestamps && data.timestamps.length > 1) {
    const timestamps = data.timestamps.map((ts) => (typeof ts === "string" ? new Date(ts) : ts));
    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const deltas: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const delta = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24); // days
      if (delta > 0 && delta < 365) {
        deltas.push(delta);
      }
    }
    if (deltas.length > 0) {
      const avgDelta = deltas.reduce((sum, val) => sum + val, 0) / deltas.length;
      if (avgDelta >= 20 && avgDelta <= 40) {
        recurringPattern = "monthly";
      } else if (avgDelta >= 80 && avgDelta <= 120) {
        recurringPattern = "quarterly";
      } else if (avgDelta >= 300 && avgDelta <= 400) {
        recurringPattern = "annual";
      }
    }
  }

  // Calculate SKU variance (product diversity)
  let skuVariance: number | undefined;
  if (data.products && data.products.length > 0) {
    const uniqueProducts = new Set(data.products);
    skuVariance = uniqueProducts.size / data.products.length;
  }

  // Calculate lead-to-close ratio
  let leadToCloseRatio: number | undefined;
  if (data.leads && data.customers && data.leads.length > 0) {
    const totalLeads = data.leads.reduce((sum, val) => sum + val, 0);
    const totalCustomers = data.customers?.reduce((sum, val) => sum + val, 0) || 0;
    if (totalLeads > 0) {
      leadToCloseRatio = totalCustomers / totalLeads;
    }
  }

  // Unit economics focus (simplified - would analyze cost structures in production)
  let unitEconomicsFocus: number | undefined;
  if (amounts.length > 0 && variance < 200) {
    // Low variance suggests unit-level focus
    unitEconomicsFocus = 1 - variance / 1000; // Normalize to 0-1
  }

  return {
    transactionVariance: variance,
    recurringPattern,
    skuVariance,
    leadToCloseRatio,
    unitEconomicsFocus,
  };
}

/**
 * Unrecognized Business Model Exception
 */
export class UnrecognizedBusinessModelException extends Error {
  constructor(
    message: string,
    public dnaSignature?: DNASignature,
    public detectedIndustry?: IndustryType
  ) {
    super(message);
    this.name = "UnrecognizedBusinessModelException";
  }
}

