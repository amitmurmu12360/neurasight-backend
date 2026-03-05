/**
 * Mock Data Generator - Synthetic DashboardState Generator
 * ========================================================
 * Generates realistic but random DashboardState data for
 * "Ghost Mode" preview in the Sovereign Empty State.
 */

import type { DashboardState } from "@/types/dashboard";

/**
 * Generate a random but realistic DashboardState
 */
export function generateMockDashboardState(): DashboardState {
  // Generate random but realistic values
  const arrValue = Math.floor(Math.random() * 50) + 10; // 10-60M
  const arrGrowth = Math.floor(Math.random() * 30) + 10; // 10-40%
  const nrrValue = Math.floor(Math.random() * 50) + 90; // 90-140%
  const burnValue = Math.random() * 2 + 0.3; // 0.3-2.3x
  const mqlsValue = Math.floor(Math.random() * 2000) + 500; // 500-2500
  const mqlsGrowth = Math.floor(Math.random() * 40) - 10; // -10% to 30%
  const cacValue = Math.floor(Math.random() * 5000) + 200; // 200-5200
  const dealsValue = Math.floor(Math.random() * 200) + 50; // 50-250
  const velocityValue = Math.floor(Math.random() * 120) + 30; // 30-150 days

  // Determine status based on values
  const arrStatus =
    arrGrowth > 25
      ? "healthy"
      : arrGrowth > 15
        ? "warning"
        : "critical";
  const nrrStatus =
    nrrValue >= 110
      ? "healthy"
      : nrrValue >= 90
        ? "warning"
        : "critical";
  const burnStatus =
    burnValue < 1.0
      ? "healthy"
      : burnValue < 1.5
        ? "warning"
        : "critical";
  const mqlsStatus =
    mqlsGrowth > 15
      ? "healthy"
      : mqlsGrowth > 0
        ? "warning"
        : "critical";
  const cacStatus =
    cacValue < 3000
      ? "healthy"
      : cacValue < 5000
        ? "warning"
        : "critical";
  const velocityStatus =
    velocityValue < 60
      ? "healthy"
      : velocityValue < 90
        ? "warning"
        : "critical";

  return {
    company: {
      name: "Sample Company",
      stage: "growth",
    },
    financials: {
      arr: {
        value: arrValue,
        unit: "M",
        currency: "USD",
        growth_yoy: arrGrowth,
        status: arrStatus,
      },
      nrr: {
        value: nrrValue,
        unit: "%",
        status: nrrStatus,
      },
      burn_multiple: {
        value: Math.round(burnValue * 10) / 10,
        benchmark: 1.0,
        unit: "x",
        status: burnStatus,
      },
      gross_margin: {                 // ✅ ADD THIS
        value: 70 + Math.random() * 10,
        unit: "%",
        status: "Healthy",
      },
    },
    growth: {
      mqls: {
        value: mqlsValue,
        growth_mom: mqlsGrowth,
        status: mqlsStatus,
      },
      cac: {
        value: cacValue,
        unit: "%",
        efficiency_gain: Math.floor(Math.random() * 30) - 15, // -15% to 15%
        status: cacStatus,
      },
      ltv: {                          // ✅ ADD
        value: 1000 + Math.random() * 500,
        unit: "%",
        status: "Healthy",
      },
      roas: {                         // ✅ ADD
        value: 2 + Math.random() * 2,
        unit: "%",
        status: "Stable",
      },
      
      top_risk: "Sample risk analysis placeholder",
    },
    sales: {
      deals_closed: {
        value: dealsValue,
        period: "month",
      },
      velocity: {
        avg_cycle_days: velocityValue,
        status: velocityStatus,
      },
      top_opportunity: "Sample opportunity placeholder",
    },
  };
}

