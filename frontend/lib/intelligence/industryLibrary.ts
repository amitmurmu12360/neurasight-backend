/**
 * Sovereign Industry Library - Single Source of Truth
 * ====================================================
 * Deterministic industry detection and policy enforcement for NeuraSight 2.0.
 * No AI guessing - 100% mathematical precision.
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type IndustryType = "saas" | "ecommerce" | "fintech" | "analyst" | "retail" | "generic";

export interface DNASignature {
  /** Variance threshold: High variance = transactional (Retail/E-commerce), Low = recurring (SaaS) */
  varianceThreshold: {
    low: number;    // Below this = SaaS (recurring)
    high: number;   // Above this = Retail/E-commerce (transactional)
  };
  /** Time delta frequency: Monthly = SaaS, Daily = Retail/E-commerce */
  frequencyPattern: "monthly" | "daily" | "weekly" | "irregular";
  /** Data sparsity: High sparsity = transactional, Low = subscription */
  sparsityRange: {
    min: number;
    max: number;
  };
  /** Recurring identifiers: Keywords that indicate subscription/recurring model */
  recurringIdentifiers: string[];
  /** Transactional identifiers: Keywords that indicate one-time transactions */
  transactionalIdentifiers: string[];
}

export interface IndustryMetrics {
  /** Primary metrics for this industry */
  primary: string[];
  /** Secondary metrics */
  secondary: string[];
  /** Metric aliases (e.g., "Sales" -> "ARR" for SaaS) */
  aliases: Record<string, string>;
}

export interface IndustryBenchmarks {
  /** Healthy threshold (green zone) */
  healthy: Record<string, { min?: number; max?: number; target?: number }>;
  /** Warning threshold (amber zone) */
  warning: Record<string, { min?: number; max?: number }>;
  /** Critical threshold (red zone) */
  critical: Record<string, { min?: number; max?: number }>;
}

export interface IndustryPolicy {
  /** Industry identifier */
  id: IndustryType;
  /** Display name */
  name: string;
  /** DNA Signature for detection */
  dnaSignature: DNASignature;
  /** Industry-specific metrics */
  metrics: IndustryMetrics;
  /** Industry benchmarks */
  benchmarks: IndustryBenchmarks;
  /** Detection confidence weight (0-1) */
  confidenceWeight: number;
}

// =============================================================================
// SYMBOLIC FEATURE VECTOR
// =============================================================================

/**
 * Symbolic Feature Vector: V = [σ²(amount), Δ(time), ρ(sparsity)]
 * 
 * Mathematical thresholds for industry detection:
 * - Variance (σ²): Low = SaaS, High = Retail/E-commerce
 * - Time Delta (Δ): Monthly = SaaS, Daily = Retail
 * - Sparsity (ρ): Low = Subscription, High = Transactional
 */
export interface FeatureVector {
  variance: number;      // σ²(amount) - Variance of transaction amounts
  timeDelta: number;     // Δ(time) - Average time between transactions (in days)
  sparsity: number;      // ρ(sparsity) - Data sparsity ratio (0-1)
}

/**
 * Calculate feature vector from data
 */
export function calculateFeatureVector(data: {
  amounts: number[];
  timestamps: Date[] | string[];
}): FeatureVector {
  const amounts = data.amounts.filter(a => !isNaN(a) && isFinite(a));
  
  if (amounts.length === 0) {
    return { variance: 0, timeDelta: 30, sparsity: 0.5 };
  }
  
  // Calculate variance (σ²)
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  
  // Calculate time delta (Δ)
  const timestamps = data.timestamps.map(ts => 
    typeof ts === 'string' ? new Date(ts) : ts
  ).filter(ts => !isNaN(ts.getTime()));
  
  let timeDelta = 30; // Default to monthly
  if (timestamps.length > 1) {
    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const deltas: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const delta = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24); // Convert to days
      if (delta > 0 && delta < 365) { // Sanity check: between 0 and 1 year
        deltas.push(delta);
      }
    }
    if (deltas.length > 0) {
      timeDelta = deltas.reduce((sum, val) => sum + val, 0) / deltas.length;
    }
  }
  
  // Calculate sparsity (ρ)
  // Sparsity = ratio of zero/null values or gaps in data
  const totalPossible = amounts.length;
  const nonZeroCount = amounts.filter(a => a !== 0).length;
  const sparsity = 1 - (nonZeroCount / totalPossible);
  
  return {
    variance,
    timeDelta,
    sparsity,
  };
}

/**
 * Match feature vector to industry based on mathematical thresholds
 */
export function matchFeatureVectorToIndustry(vector: FeatureVector): IndustryType {
  const { variance, timeDelta, sparsity } = vector;
  
  // B2B SaaS: Low variance, Monthly frequency, Low sparsity
  if (variance < 100 && timeDelta >= 20 && timeDelta <= 40 && sparsity < 0.3) {
    return "saas";
  }
  
  // D2C & E-commerce: High variance, Daily frequency, High sparsity
  if (variance > 1000 && timeDelta < 7 && sparsity > 0.5) {
    return "ecommerce";
  }
  
  // Fintech: Medium variance, Irregular frequency, Medium sparsity
  if (variance >= 100 && variance <= 1000 && timeDelta >= 7 && timeDelta <= 90 && sparsity >= 0.3 && sparsity <= 0.7) {
    return "fintech";
  }
  
  // Default to generic
  return "generic";
}

// =============================================================================
// INDUSTRY POLICIES (Single Source of Truth)
// =============================================================================

/**
 * B2B SaaS Industry Policy
 */
const B2B_SAAS_POLICY: IndustryPolicy = {
  id: "saas",
  name: "B2B SaaS",
  dnaSignature: {
    varianceThreshold: {
      low: 0,      // Below 100 = SaaS
      high: 100,   // Above 100 = Transactional
    },
    frequencyPattern: "monthly",
    sparsityRange: {
      min: 0,
      max: 0.3,   // Low sparsity = subscription model
    },
    recurringIdentifiers: [
      "arr", "mrr", "recurring", "subscription", "renewal", "churn", "nrr",
      "mrr", "arr", "customer", "seat", "license", "user"
    ],
    transactionalIdentifiers: [
      "one-time", "transaction", "purchase", "order", "cart"
    ],
  },
  metrics: {
    primary: ["arr", "nrr", "burn_multiple", "churn", "cac", "ltv"],
    secondary: ["mqls", "deals_closed", "velocity", "expansion_revenue"],
    aliases: {
      "revenue": "arr",
      "annual_revenue": "arr",
      "recurring_revenue": "arr",
      "net_revenue_retention": "nrr",
      "retention": "nrr",
      "burn": "burn_multiple",
      "efficiency": "burn_multiple",
    },
  },
  benchmarks: {
    healthy: {
      nrr: { min: 110, target: 120 },        // NRR > 110% (Healthy)
      burn_multiple: { max: 1.0, target: 0.8 }, // Burn Multiple < 1.0x (Efficient)
      arr: { min: 0 },                        // ARR always positive
      churn: { max: 5, target: 2 },          // Churn < 5% (Good)
      cac: { max: 300, target: 200 },        // CAC < $300 (Efficient)
    },
    warning: {
      nrr: { min: 100, max: 110 },            // NRR 100-110% (Warning)
      burn_multiple: { min: 1.0, max: 1.5 },  // Burn Multiple 1.0-1.5x (Warning)
      churn: { min: 5, max: 10 },             // Churn 5-10% (Warning)
    },
    critical: {
      nrr: { max: 100 },                      // NRR < 100% (Critical)
      burn_multiple: { min: 1.5 },            // Burn Multiple > 1.5x (Critical)
      churn: { min: 10 },                     // Churn > 10% (Critical)
    },
  },
  confidenceWeight: 1.0,
};

/**
 * D2C & E-commerce Industry Policy
 */
const D2C_ECOMMERCE_POLICY: IndustryPolicy = {
  id: "ecommerce",
  name: "D2C & E-commerce",
  dnaSignature: {
    varianceThreshold: {
      low: 1000,   // Above 1000 = E-commerce
      high: 10000,
    },
    frequencyPattern: "daily",
    sparsityRange: {
      min: 0.5,    // High sparsity = transactional
      max: 1.0,
    },
    recurringIdentifiers: [
      "subscription", "recurring", "membership"
    ],
    transactionalIdentifiers: [
      "sales", "revenue", "order", "transaction", "purchase", "cart",
      "sku", "product", "category", "quantity", "profit", "margin"
    ],
  },
  metrics: {
    primary: ["roas", "gross_margin", "customer_repeat_rate", "aov", "conversion_rate"],
    secondary: ["sales", "orders", "revenue", "profit", "traffic", "bounce_rate"],
    aliases: {
      "revenue": "sales",
      "total_revenue": "sales",
      "gross_profit": "gross_margin",
      "profit_margin": "gross_margin",
      "return_on_ad_spend": "roas",
      "roas": "roas",
      "average_order_value": "aov",
      "order_value": "aov",
    },
  },
  benchmarks: {
    healthy: {
      roas: { min: 3.0, target: 4.0 },              // ROAS > 3x (Good)
      gross_margin: { min: 40, target: 50 },         // Gross Margin > 40%
      customer_repeat_rate: { min: 30, target: 40 }, // Repeat Rate > 30%
      aov: { min: 50, target: 100 },                 // AOV > $50
      conversion_rate: { min: 2.0, target: 3.0 },    // Conversion > 2%
    },
    warning: {
      roas: { min: 2.0, max: 3.0 },                  // ROAS 2-3x (Warning)
      gross_margin: { min: 30, max: 40 },            // Gross Margin 30-40% (Warning)
      customer_repeat_rate: { min: 20, max: 30 },     // Repeat Rate 20-30% (Warning)
    },
    critical: {
      roas: { max: 2.0 },                            // ROAS < 2x (Critical)
      gross_margin: { max: 30 },                     // Gross Margin < 30% (Critical)
      customer_repeat_rate: { max: 20 },             // Repeat Rate < 20% (Critical)
    },
  },
  confidenceWeight: 0.95,
};

/**
 * Fintech / Lending Industry Policy
 */
const FINTECH_LENDING_POLICY: IndustryPolicy = {
  id: "fintech",
  name: "Fintech / Lending",
  dnaSignature: {
    varianceThreshold: {
      low: 100,    // Medium variance
      high: 1000,
    },
    frequencyPattern: "irregular",
    sparsityRange: {
      min: 0.3,
      max: 0.7,    // Medium sparsity
    },
    recurringIdentifiers: [
      "repayment", "installment", "recurring_payment", "subscription"
    ],
    transactionalIdentifiers: [
      "loan", "disbursement", "principal", "interest", "default",
      "ltv", "loan_to_value", "portfolio", "yield"
    ],
  },
  metrics: {
    primary: ["default_rate", "portfolio_yield", "ltv", "npl", "collection_rate"],
    secondary: ["loan_volume", "disbursements", "interest_income", "principal_outstanding"],
    aliases: {
      "revenue": "interest_income",
      "yield": "portfolio_yield",
      "loan_to_value": "ltv",
      "ltv_ratio": "ltv",
      "non_performing_loans": "npl",
      "npl_rate": "npl",
      "default": "default_rate",
      "default_rate_percentage": "default_rate",
    },
  },
  benchmarks: {
    healthy: {
      default_rate: { max: 4, target: 2 },           // Default Rate < 4% (Safe)
      portfolio_yield: { min: 12, target: 15 },       // Yield > 12%
      ltv: { max: 80, target: 70 },                   // LTV < 80%
      npl: { max: 5, target: 3 },                     // NPL < 5%
      collection_rate: { min: 95, target: 98 },       // Collection Rate > 95%
    },
    warning: {
      default_rate: { min: 4, max: 6 },              // Default Rate 4-6% (Warning)
      portfolio_yield: { min: 10, max: 12 },          // Yield 10-12% (Warning)
      ltv: { min: 80, max: 90 },                      // LTV 80-90% (Warning)
    },
    critical: {
      default_rate: { min: 6 },                       // Default Rate > 6% (Critical)
      portfolio_yield: { max: 10 },                   // Yield < 10% (Critical)
      ltv: { min: 90 },                               // LTV > 90% (Critical)
    },
  },
  confidenceWeight: 0.9,
};

/**
 * White-labeled Analyst (Custom) Industry Policy
 */
const WHITE_LABELED_ANALYST_POLICY: IndustryPolicy = {
  id: "analyst",
  name: "White-labeled Analyst",
  dnaSignature: {
    varianceThreshold: {
      low: 0,
      high: Infinity, // Flexible - no strict variance threshold
    },
    frequencyPattern: "irregular",
    sparsityRange: {
      min: 0,
      max: 1.0,       // Flexible sparsity
    },
    recurringIdentifiers: [
      "revenue", "income", "profit", "margin", "efficiency"
    ],
    transactionalIdentifiers: [
      "transaction", "order", "sale", "purchase"
    ],
  },
  metrics: {
    primary: ["revenue_per_head", "utilization_rate", "billable_hours", "project_margin"],
    secondary: ["revenue", "profit", "margin", "efficiency", "productivity"],
    aliases: {
      "revenue": "revenue",
      "sales": "revenue",
      "income": "revenue",
      "profit": "profit",
      "margin": "margin",
      "efficiency": "utilization_rate",
      "productivity": "utilization_rate",
    },
  },
  benchmarks: {
    healthy: {
      revenue_per_head: { min: 100000, target: 150000 }, // $100K+ per head
      utilization_rate: { min: 75, target: 85 },          // Utilization > 75%
      project_margin: { min: 20, target: 30 },            // Margin > 20%
    },
    warning: {
      revenue_per_head: { min: 75000, max: 100000 },      // $75K-$100K (Warning)
      utilization_rate: { min: 65, max: 75 },              // Utilization 65-75% (Warning)
      project_margin: { min: 15, max: 20 },                // Margin 15-20% (Warning)
    },
    critical: {
      revenue_per_head: { max: 75000 },                   // < $75K (Critical)
      utilization_rate: { max: 65 },                      // < 65% (Critical)
      project_margin: { max: 15 },                        // < 15% (Critical)
    },
  },
  confidenceWeight: 0.8,
};

/**
 * Retail Industry Policy (Legacy support - maps to E-commerce)
 */
const RETAIL_POLICY: IndustryPolicy = {
  ...D2C_ECOMMERCE_POLICY,
  id: "retail",
  name: "Retail",
  confidenceWeight: 0.95,
};

// =============================================================================
// INDUSTRY REGISTRY (Single Source of Truth)
// =============================================================================

const INDUSTRY_REGISTRY: Record<IndustryType, IndustryPolicy> = {
  saas: B2B_SAAS_POLICY,
  ecommerce: D2C_ECOMMERCE_POLICY,
  fintech: FINTECH_LENDING_POLICY,
  analyst: WHITE_LABELED_ANALYST_POLICY,
  retail: RETAIL_POLICY,
  generic: {
    id: "generic",
    name: "Generic",
    dnaSignature: {
      varianceThreshold: { low: 0, high: Infinity },
      frequencyPattern: "irregular",
      sparsityRange: { min: 0, max: 1.0 },
      recurringIdentifiers: [],
      transactionalIdentifiers: [],
    },
    metrics: {
      primary: ["revenue", "profit", "margin"],
      secondary: [],
      aliases: {},
    },
    benchmarks: {
      healthy: {},
      warning: {},
      critical: {},
    },
    confidenceWeight: 0.5,
  },
};

// =============================================================================
// EXPORT REGISTRY HELPER
// =============================================================================

/**
 * Get Industry Context - Single Source of Truth
 * 
 * Retrieves the locked JSON policy for a verified industry.
 * This is the deterministic source - no AI guessing.
 * 
 * @param verifiedIndustry - Verified industry identifier (from Orchestrator consensus)
 * @returns IndustryPolicy object with DNA signature, metrics, and benchmarks
 */
export function getIndustryContext(verifiedIndustry: string): IndustryPolicy {
  // Normalize industry identifier (case-insensitive)
  const normalized = verifiedIndustry.toLowerCase().trim();
  
  // Direct match
  if (normalized in INDUSTRY_REGISTRY) {
    return INDUSTRY_REGISTRY[normalized as IndustryType];
  }
  
  // Alias matching
  const aliases: Record<string, IndustryType> = {
    "b2b saas": "saas",
    "saas": "saas",
    "software": "saas",
    "subscription": "saas",
    "d2c": "ecommerce",
    "e-commerce": "ecommerce",
    "ecommerce": "ecommerce",
    "retail": "retail",
    "fintech": "fintech",
    "lending": "fintech",
    "financial": "fintech",
    "analyst": "analyst",
    "white-labeled": "analyst",
    "professional services": "analyst",
    "consulting": "analyst",
  };
  
  if (normalized in aliases) {
    return INDUSTRY_REGISTRY[aliases[normalized]];
  }
  
  // Default to generic
  return INDUSTRY_REGISTRY.generic;
}

/**
 * Get all available industries
 */
export function getAllIndustries(): IndustryPolicy[] {
  return Object.values(INDUSTRY_REGISTRY);
}

/**
 * Get industry by ID
 */
export function getIndustryById(id: IndustryType): IndustryPolicy {
  return INDUSTRY_REGISTRY[id] || INDUSTRY_REGISTRY.generic;
}

/**
 * Check if metric belongs to industry
 */
export function isMetricInIndustry(metric: string, industry: IndustryType): boolean {
  const policy = getIndustryById(industry);
  const normalizedMetric = metric.toLowerCase().trim();
  
  // Check primary metrics
  if (policy.metrics.primary.some(m => m.toLowerCase() === normalizedMetric)) {
    return true;
  }
  
  // Check secondary metrics
  if (policy.metrics.secondary.some(m => m.toLowerCase() === normalizedMetric)) {
    return true;
  }
  
  // Check aliases
  if (normalizedMetric in policy.metrics.aliases) {
    return true;
  }
  
  // Check if alias value matches
  if (Object.values(policy.metrics.aliases).some(alias => alias.toLowerCase() === normalizedMetric)) {
    return true;
  }
  
  return false;
}

/**
 * Get benchmark threshold for a metric in an industry
 */
export function getBenchmarkThreshold(
  industry: IndustryType,
  metric: string,
  level: "healthy" | "warning" | "critical"
): { min?: number; max?: number; target?: number } | null {
  const policy = getIndustryById(industry);
  const normalizedMetric = metric.toLowerCase().trim();
  
  // Resolve alias
  const resolvedMetric = policy.metrics.aliases[normalizedMetric] || normalizedMetric;
  
  // Get benchmark
  const benchmarks = policy.benchmarks[level];
  if (resolvedMetric in benchmarks) {
    return benchmarks[resolvedMetric];
  }
  
  return null;
}

/**
 * Evaluate metric against industry benchmarks
 */
export function evaluateMetric(
  industry: IndustryType,
  metric: string,
  value: number
): {
  status: "healthy" | "warning" | "critical" | "unknown";
  message: string;
  threshold?: { min?: number; max?: number; target?: number };
} {
  const policy = getIndustryById(industry);
  const normalizedMetric = metric.toLowerCase().trim();
  
  // Resolve alias
  const resolvedMetric = policy.metrics.aliases[normalizedMetric] || normalizedMetric;
  
  // Check critical first
  const critical = policy.benchmarks.critical[resolvedMetric];
  if (critical) {
    if ((critical.min !== undefined && value < critical.min) ||
        (critical.max !== undefined && value > critical.max)) {
      return {
        status: "critical",
        message: `${metric} is in critical zone (${value})`,
        threshold: critical,
      };
    }
  }
  
  // Check warning
  const warning = policy.benchmarks.warning[resolvedMetric];
  if (warning) {
    if ((warning.min !== undefined && value < warning.min) ||
        (warning.max !== undefined && value > warning.max)) {
      return {
        status: "warning",
        message: `${metric} is in warning zone (${value})`,
        threshold: warning,
      };
    }
  }
  
  // Check healthy
  const healthy = policy.benchmarks.healthy[resolvedMetric];
  if (healthy) {
    if ((healthy.min === undefined || value >= healthy.min) &&
        (healthy.max === undefined || value <= healthy.max)) {
      return {
        status: "healthy",
        message: `${metric} is in healthy zone (${value})`,
        threshold: healthy,
      };
    }
  }
  
  return {
    status: "unknown",
    message: `No benchmark defined for ${metric} in ${industry} industry`,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getIndustryContext,
  getAllIndustries,
  getIndustryById,
  isMetricInIndustry,
  getBenchmarkThreshold,
  evaluateMetric,
  calculateFeatureVector,
  matchFeatureVectorToIndustry,
};

