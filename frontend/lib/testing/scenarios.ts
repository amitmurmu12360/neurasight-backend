/**
 * Sovereign Playground - Scenario Data Library
 * ============================================
 * Pre-configured business scenarios for testing and demonstration.
 * Each scenario represents a different "Business Reality" to test the 11-agent swarm.
 */

import type { DashboardState } from "@/types/dashboard";
import type { Persona } from "@/components/ExecutionLog";

/**
 * Scenario Definition
 */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  industry: "saas" | "retail" | "generic";
  archetype?: "subscription" | "transactional" | "lead-gen" | "unit-economy";
  personaData: {
    CEO: DashboardState;
    CMO: DashboardState;
    "VP Sales": DashboardState;
  };
  expectedOutcome: {
    verified: boolean;
    criticalAlerts: number;
    strategicActions: number;
  };
  metadata: {
    theme: "healthy" | "crisis" | "gold" | "universal";
    color: string;
    icon: string;
  };
}

/**
 * Scenario 1: SaaS Healthy (Gold Standard)
 * High NRR (120%), Low Burn (0.5x), High Growth
 */
export const SCENARIO_SAAS_HEALTHY: Scenario = {
  id: "saas-healthy",
  name: "SaaS: Healthy",
  description: "High-performing SaaS company with strong retention and efficient growth",
  industry: "saas",
  archetype: "subscription",
  personaData: {
    CEO: {
      company: { name: "SaaS Company", stage: "growth" },
      financials: {
        arr: { value: 45.2, unit: "M", currency: "USD", growth_yoy: 28.5, status: "healthy" },
        nrr: { value: 120, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.5, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 1240, growth_mom: 12.3, status: "healthy" },
        cac: { value: 3200, currency: "USD", efficiency_gain: -8.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 142, period: "month" },
        velocity: { avg_cycle_days: 45, status: "healthy" },
        top_opportunity: "Enterprise expansion",
      },
    },
    CMO: {
      company: { name: "SaaS Company", stage: "growth" },
      financials: {
        arr: { value: 45.2, unit: "M", currency: "USD", growth_yoy: 28.5, status: "healthy" },
        nrr: { value: 120, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.5, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 1240, growth_mom: 12.3, status: "healthy" },
        cac: { value: 3200, currency: "USD", efficiency_gain: -8.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 142, period: "month" },
        velocity: { avg_cycle_days: 45, status: "healthy" },
        top_opportunity: "Enterprise expansion",
      },
    },
    "VP Sales": {
      company: { name: "SaaS Company", stage: "growth" },
      financials: {
        arr: { value: 45.2, unit: "M", currency: "USD", growth_yoy: 28.5, status: "healthy" },
        nrr: { value: 120, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.5, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 1240, growth_mom: 12.3, status: "healthy" },
        cac: { value: 3200, currency: "USD", efficiency_gain: -8.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 142, period: "month" },
        velocity: { avg_cycle_days: 45, status: "healthy" },
        top_opportunity: "Enterprise expansion",
      },
    },
  },
  expectedOutcome: {
    verified: true,
    criticalAlerts: 0,
    strategicActions: 2,
  },
  metadata: {
    theme: "healthy",
    color: "emerald",
    icon: "TrendingUp",
  },
};

/**
 * Scenario 2: SaaS Crisis/Chaos (Toxic Data)
 * NRR 35%, Burn 4.0x - Must trigger System Lockdown
 */
export const SCENARIO_SAAS_CRISIS: Scenario = {
  id: "saas-crisis",
  name: "SaaS: Crisis/Chaos",
  description: "Toxic data scenario - NRR collapse, extreme burn. Tests emergency recovery.",
  industry: "saas",
  archetype: "subscription",
  personaData: {
    CEO: {
      company: { name: "SaaS Company", stage: "crisis" },
      financials: {
        arr: { value: 12.8, unit: "M", currency: "USD", growth_yoy: -15.0, status: "critical" },
        nrr: { value: 35, unit: "%", status: "critical" },
        burn_multiple: { value: 4.0, benchmark: 1.0, status: "critical" },
      },
      growth: {
        mqls: { value: 320, growth_mom: -28.0, status: "critical" },
        cac: { value: 8500, currency: "USD", efficiency_gain: 65.0, status: "critical" },
        top_risk: "High CAC, low MQLs",
      },
      sales: {
        deals_closed: { value: 28, period: "month" },
        velocity: { avg_cycle_days: 180, status: "critical" },
        top_opportunity: "Reduce sales cycle",
      },
    },
    CMO: {
      company: { name: "SaaS Company", stage: "crisis" },
      financials: {
        arr: { value: 12.8, unit: "M", currency: "USD", growth_yoy: -15.0, status: "critical" },
        nrr: { value: 35, unit: "%", status: "critical" },
        burn_multiple: { value: 4.0, benchmark: 1.0, status: "critical" },
      },
      growth: {
        mqls: { value: 320, growth_mom: -28.0, status: "critical" },
        cac: { value: 8500, currency: "USD", efficiency_gain: 65.0, status: "critical" },
        top_risk: "High CAC, low MQLs",
      },
      sales: {
        deals_closed: { value: 28, period: "month" },
        velocity: { avg_cycle_days: 180, status: "critical" },
        top_opportunity: "Reduce sales cycle",
      },
    },
    "VP Sales": {
      company: { name: "SaaS Company", stage: "crisis" },
      financials: {
        arr: { value: 12.8, unit: "M", currency: "USD", growth_yoy: -15.0, status: "critical" },
        nrr: { value: 35, unit: "%", status: "critical" },
        burn_multiple: { value: 4.0, benchmark: 1.0, status: "critical" },
      },
      growth: {
        mqls: { value: 320, growth_mom: -28.0, status: "critical" },
        cac: { value: 8500, currency: "USD", efficiency_gain: 65.0, status: "critical" },
        top_risk: "High CAC, low MQLs",
      },
      sales: {
        deals_closed: { value: 28, period: "month" },
        velocity: { avg_cycle_days: 180, status: "critical" },
        top_opportunity: "Reduce sales cycle",
      },
    },
  },
  expectedOutcome: {
    verified: false, // Agent 0 must flag this
    criticalAlerts: 3,
    strategicActions: 5, // Emergency recovery actions
  },
  metadata: {
    theme: "crisis",
    color: "red",
    icon: "AlertTriangle",
  },
};

/**
 * Scenario 3: Retail Gold Standard (Transactional)
 * Tests Retail domain detection and Gold/Transactional theme
 */
export const SCENARIO_RETAIL_GOLD: Scenario = {
  id: "retail-gold",
  name: "Retail: Gold Standard",
  description: "High-performing retail business with strong margins and inventory efficiency",
  industry: "retail",
  archetype: "transactional",
  personaData: {
    CEO: {
      company: { name: "Retail Company", stage: "growth" },
      financials: {
        arr: { value: 243.16, unit: "M", currency: "USD", growth_yoy: 18.5, status: "healthy" },
        nrr: { value: 32.5, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.8, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 15420, growth_mom: 8.2, status: "healthy" },
        cac: { value: 45, currency: "USD", efficiency_gain: -5.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 9940, period: "month" },
        velocity: { avg_cycle_days: 14, status: "healthy" },
        top_opportunity: "Expand product line",
      },
    },
    CMO: {
      company: { name: "Retail Company", stage: "growth" },
      financials: {
        arr: { value: 243.16, unit: "M", currency: "USD", growth_yoy: 18.5, status: "healthy" },
        nrr: { value: 32.5, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.8, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 15420, growth_mom: 8.2, status: "healthy" },
        cac: { value: 45, currency: "USD", efficiency_gain: -5.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 9940, period: "month" },
        velocity: { avg_cycle_days: 14, status: "healthy" },
        top_opportunity: "Expand product line",
      },
    },
    "VP Sales": {
      company: { name: "Retail Company", stage: "growth" },
      financials: {
        arr: { value: 243.16, unit: "M", currency: "USD", growth_yoy: 18.5, status: "healthy" },
        nrr: { value: 32.5, unit: "%", status: "healthy" },
        burn_multiple: { value: 0.8, benchmark: 1.0, status: "healthy" },
      },
      growth: {
        mqls: { value: 15420, growth_mom: 8.2, status: "healthy" },
        cac: { value: 45, currency: "USD", efficiency_gain: -5.0, status: "healthy" },
        top_risk: "None",
      },
      sales: {
        deals_closed: { value: 9940, period: "month" },
        velocity: { avg_cycle_days: 14, status: "healthy" },
        top_opportunity: "Expand product line",
      },
    },
  },
  expectedOutcome: {
    verified: true,
    criticalAlerts: 0,
    strategicActions: 2,
  },
  metadata: {
    theme: "gold",
    color: "amber",
    icon: "ShoppingCart",
  },
};

/**
 * Scenario 4: Universal Unknown Subscription (Gym Chain)
 * Tests Archetype Adapter - Subscription DNA for non-core industry
 */
export const SCENARIO_UNIVERSAL_GYM: Scenario = {
  id: "universal-gym",
  name: "Universal: Unknown Subscription",
  description: "Gym Chain (not in core industries) - Tests Archetype Adapter Subscription DNA mapping",
  industry: "generic",
  archetype: "subscription",
  personaData: {
    CEO: {
      company: { name: "Gym Chain", stage: "growth" },
      financials: {
        arr: { value: 18.5, unit: "M", currency: "USD", growth_yoy: 15.0, status: "healthy" },
        nrr: { value: 95, unit: "%", status: "warning" },
        burn_multiple: { value: 1.2, benchmark: 1.0, status: "warning" },
      },
      growth: {
        mqls: { value: 850, growth_mom: 8.0, status: "healthy" },
        cac: { value: 120, currency: "USD", efficiency_gain: -10.0, status: "healthy" },
        top_risk: "Retention below 100%",
      },
      sales: {
        deals_closed: { value: 1250, period: "month" },
        velocity: { avg_cycle_days: 33, status: "healthy" },
        top_opportunity: "Improve retention",
      },
    },
    CMO: {
      company: { name: "Gym Chain", stage: "growth" },
      financials: {
        arr: { value: 18.5, unit: "M", currency: "USD", growth_yoy: 15.0, status: "healthy" },
        nrr: { value: 95, unit: "%", status: "warning" },
        burn_multiple: { value: 1.2, benchmark: 1.0, status: "warning" },
      },
      growth: {
        mqls: { value: 850, growth_mom: 8.0, status: "healthy" },
        cac: { value: 120, currency: "USD", efficiency_gain: -10.0, status: "healthy" },
        top_risk: "Retention below 100%",
      },
      sales: {
        deals_closed: { value: 1250, period: "month" },
        velocity: { avg_cycle_days: 33, status: "healthy" },
        top_opportunity: "Improve retention",
      },
    },
    "VP Sales": {
      company: { name: "Gym Chain", stage: "growth" },
      financials: {
        arr: { value: 18.5, unit: "M", currency: "USD", growth_yoy: 15.0, status: "healthy" },
        nrr: { value: 95, unit: "%", status: "warning" },
        burn_multiple: { value: 1.2, benchmark: 1.0, status: "warning" },
      },
      growth: {
        mqls: { value: 850, growth_mom: 8.0, status: "healthy" },
        cac: { value: 120, currency: "USD", efficiency_gain: -10.0, status: "healthy" },
        top_risk: "Retention below 100%",
      },
      sales: {
        deals_closed: { value: 1250, period: "month" },
        velocity: { avg_cycle_days: 33, status: "healthy" },
        top_opportunity: "Improve retention",
      },
    },
  },
  expectedOutcome: {
    verified: true,
    criticalAlerts: 1, // NRR < 100% for subscription
    strategicActions: 3,
  },
  metadata: {
    theme: "universal",
    color: "cyan",
    icon: "Dumbbell",
  },
};

/**
 * All Available Scenarios
 */
export const ALL_SCENARIOS: Scenario[] = [
  SCENARIO_SAAS_HEALTHY,
  SCENARIO_SAAS_CRISIS,
  SCENARIO_RETAIL_GOLD,
  SCENARIO_UNIVERSAL_GYM,
];

/**
 * Get Scenario by ID
 */
export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}

/**
 * Get Scenario Data for Persona
 */
export function getScenarioDataForPersona(
  scenario: Scenario,
  persona: Persona
): DashboardState {
  return scenario.personaData[persona];
}

/**
 * Generate Raw Data for Scenario (for Agent 0 Janitor)
 */
export function generateRawDataForScenario(
  scenario: Scenario,
  persona: Persona
): Array<Record<string, unknown>> {
  const data = getScenarioDataForPersona(scenario, persona);
  
  // Generate mock raw data rows based on scenario
  const rows: Array<Record<string, unknown>> = [];
  
  if (scenario.industry === "retail") {
    // Retail: Generate transaction rows
    for (let i = 0; i < 100; i++) {
      rows.push({
        Sales: data.financials?.arr?.value || 0,
        Profit: data.financials?.nrr?.value || 0,
        Quantity: data.growth?.mqls?.value || 0,
        Category: "Electronics",
        "Sub-Category": "Phones",
        "Ship Mode": "Standard",
      });
    }
  } else {
    // SaaS/Generic: Generate monthly data rows
    for (let i = 0; i < 12; i++) {
      rows.push({
        ARR: data.financials?.arr?.value || 0,
        NRR: data.financials?.nrr?.value || 0,
        "Burn Multiple": data.financials?.burn_multiple?.value || 0,
        MQLs: data.growth?.mqls?.value || 0,
        CAC: data.growth?.cac?.value || 0,
        "Deals Closed": data.sales?.deals_closed?.value || 0,
      });
    }
  }
  
  return rows;
}


