/**
 * Dashboard Type Definitions
 * ==========================
 * These interfaces match the Backend's GLOBAL_DASHBOARD_STATE exactly.
 * Any changes to the backend schema must be reflected here.
 */

// =============================================================================
// COMPANY
// =============================================================================
export interface Company {
  name: string;
  stage: string;
}

// =============================================================================
// FINANCIALS
// =============================================================================
export interface ARRMetric {
  value: number;
  unit: string;
  currency: string;
  growth_yoy: number;
  status: string;
}

export interface BurnMultipleMetric {
  value: number;
  benchmark: number;
  status: string;
}

export interface NRRMetric {
  value: number;
  unit: string;
  status: string;
}

export interface Financials {
  arr: ARRMetric;
  burn_multiple: BurnMultipleMetric;
  nrr: NRRMetric;
}

// =============================================================================
// GROWTH & MARKETING
// =============================================================================
export interface MQLsMetric {
  value: number;
  growth_mom: number;
  status: string;
}

export interface CACMetric {
  value: number;
  currency: string;
  efficiency_gain: number;
  status: string;
}

export interface Growth {
  mqls: MQLsMetric;
  cac: CACMetric;
  top_risk: string;
}

// =============================================================================
// SALES
// =============================================================================
export interface DealsClosedMetric {
  value: number;
  period: string;
}

export interface VelocityMetric {
  avg_cycle_days: number;
  status: string;
}

export interface Sales {
  deals_closed: DealsClosedMetric;
  velocity: VelocityMetric;
  top_opportunity: string;
}

// =============================================================================
// FULL DASHBOARD STATE
// =============================================================================
export interface DashboardState {
  company: Company;
  financials: Financials;
  growth: Growth;
  sales: Sales;
}

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================
export interface UseDashboardDataReturn {
  data: DashboardState | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

