/**
 * NeuraSight Chaos Engine - Data Simulator Hook
 * ==============================================
 * Stress-tests the Adaptive Intelligence system by randomly
 * fluctuating dashboard metrics to trigger TrendUrgency and
 * verify real-time card repositioning.
 *
 * Usage:
 * const { simulatedData, lastEvent } = useDataSimulator(dashboardData, isDemoMode);
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
export interface SimulatorEvent {
  /** Timestamp of the event */
  timestamp: Date;
  /** Which metric was affected */
  metric: string;
  /** Type of change */
  type: "spike" | "dip" | "fluctuation";
  /** Percentage change */
  change: number;
  /** Whether this triggered urgency */
  triggeredUrgency: boolean;
}

export interface UseDataSimulatorReturn {
  /** The current simulated data state */
  simulatedData: DashboardState;
  /** The last simulation event (for logging/UI) */
  lastEvent: SimulatorEvent | null;
  /** Total number of events since activation */
  eventCount: number;
  /** Force a manual chaos event */
  triggerChaos: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const INTERVAL_MIN_MS = 3000; // 3 seconds
const INTERVAL_MAX_MS = 5000; // 5 seconds
const VOLATILITY_THRESHOLD = 15; // % change that triggers urgency
const SPIKE_PROBABILITY = 0.25; // 25% chance of a spike event

// =============================================================================
// HELPERS
// =============================================================================
/**
 * Returns a random number between min and max (inclusive).
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive).
 */
function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Clamps a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Deep clones an object (simple JSON method for our use case).
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// CHAOS GENERATORS
// =============================================================================
type ChaosFunction = (
  data: DashboardState
) => { data: DashboardState; event: SimulatorEvent };

/**
 * Spike CAC by 20-35% (triggers urgency).
 */
const spikeCAC: ChaosFunction = (data) => {
  const change = randomBetween(20, 35);
  const newValue = Math.round(data.growth.cac.value * (1 + change / 100));
  data.growth.cac.value = newValue;
  data.growth.cac.efficiency_gain = -Math.round(change); // Now negative

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "CAC",
      type: "spike",
      change: Math.round(change),
      triggeredUrgency: true,
    },
  };
};

/**
 * Spike Burn Multiple to dangerous levels.
 */
const spikeBurn: ChaosFunction = (data) => {
  const change = randomBetween(25, 50);
  const newValue =
    Math.round(data.financials.burn_multiple.value * (1 + change / 100) * 10) /
    10;
  data.financials.burn_multiple.value = clamp(newValue, 0.5, 3.0);
  data.financials.burn_multiple.status = "⚠️ ELEVATED - Above benchmark";

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "Burn Multiple",
      type: "spike",
      change: Math.round(change),
      triggeredUrgency: true,
    },
  };
};

/**
 * Dip MQLs significantly.
 */
const dipMQLs: ChaosFunction = (data) => {
  const change = randomBetween(18, 30);
  const newValue = Math.round(data.growth.mqls.value * (1 - change / 100));
  data.growth.mqls.value = Math.max(500, newValue);
  data.growth.mqls.growth_mom = -Math.round(change);
  data.growth.mqls.status = "⚠️ DECLINING - Requires attention";

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "MQLs",
      type: "dip",
      change: -Math.round(change),
      triggeredUrgency: true,
    },
  };
};

/**
 * Small ARR fluctuation (subtle).
 */
const fluctuateARR: ChaosFunction = (data) => {
  const change = randomBetween(-5, 8);
  const newGrowth = Math.round(data.financials.arr.growth_yoy + change);
  data.financials.arr.growth_yoy = clamp(newGrowth, 5, 35);

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "ARR Growth",
      type: "fluctuation",
      change: Math.round(change),
      triggeredUrgency: Math.abs(change) >= VOLATILITY_THRESHOLD,
    },
  };
};

/**
 * Small NRR fluctuation.
 */
const fluctuateNRR: ChaosFunction = (data) => {
  const change = randomBetween(-8, 10);
  const newValue = Math.round(data.financials.nrr.value + change);
  data.financials.nrr.value = clamp(newValue, 90, 160);

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "NRR",
      type: "fluctuation",
      change: Math.round(change),
      triggeredUrgency: Math.abs(change) >= VOLATILITY_THRESHOLD,
    },
  };
};

/**
 * Deals closed fluctuation.
 */
const fluctuateDeals: ChaosFunction = (data) => {
  const change = randomIntBetween(-15, 20);
  const newValue = data.sales.deals_closed.value + change;
  data.sales.deals_closed.value = Math.max(50, newValue);

  return {
    data,
    event: {
      timestamp: new Date(),
      metric: "Deals Closed",
      type: "fluctuation",
      change,
      triggeredUrgency: false,
    },
  };
};

// All chaos functions (weighted selection)
const CHAOS_FUNCTIONS: Array<{ fn: ChaosFunction; weight: number }> = [
  { fn: spikeCAC, weight: 15 },
  { fn: spikeBurn, weight: 15 },
  { fn: dipMQLs, weight: 15 },
  { fn: fluctuateARR, weight: 20 },
  { fn: fluctuateNRR, weight: 15 },
  { fn: fluctuateDeals, weight: 20 },
];

/**
 * Selects a random chaos function based on weights.
 */
function selectChaosFn(): ChaosFunction {
  const totalWeight = CHAOS_FUNCTIONS.reduce((sum, cf) => sum + cf.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { fn, weight } of CHAOS_FUNCTIONS) {
    random -= weight;
    if (random <= 0) return fn;
  }

  return CHAOS_FUNCTIONS[0].fn;
}

// =============================================================================
// HOOK
// =============================================================================
export function useDataSimulator(
  initialData: DashboardState | null,
  isActive: boolean
): UseDataSimulatorReturn {
  const [simulatedData, setSimulatedData] = useState<DashboardState | null>(
    initialData
  );
  const [lastEvent, setLastEvent] = useState<SimulatorEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Reset to initial data when activated/deactivated
  useEffect(() => {
    if (initialData) {
      setSimulatedData(deepClone(initialData));
    }
    if (!isActive) {
      setLastEvent(null);
      setEventCount(0);
    }
  }, [initialData, isActive]);

  // Chaos trigger function
  const triggerChaos = useCallback(() => {
    if (!simulatedData) return;

    const clonedData = deepClone(simulatedData);
    const chaosFn = selectChaosFn();
    const { data: newData, event } = chaosFn(clonedData);

    setSimulatedData(newData);
    setLastEvent(event);
    setEventCount((c) => c + 1);

    // Log to console for debugging
    console.log(
      `🔥 CHAOS: ${event.metric} ${event.type} ${event.change > 0 ? "+" : ""}${event.change}%`,
      event.triggeredUrgency ? "⚡ URGENT" : ""
    );
  }, [simulatedData]);

  // Set up interval when active
  useEffect(() => {
    if (!isActive || !simulatedData) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Random interval between 3-5 seconds
    const scheduleNext = () => {
      const delay = randomIntBetween(INTERVAL_MIN_MS, INTERVAL_MAX_MS);
      intervalRef.current = window.setTimeout(() => {
        triggerChaos();
        scheduleNext();
      }, delay);
    };

    // Initial trigger after 1 second
    intervalRef.current = window.setTimeout(() => {
      triggerChaos();
      scheduleNext();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, triggerChaos, simulatedData]);

  return {
    simulatedData: simulatedData || (initialData as DashboardState),
    lastEvent,
    eventCount,
    triggerChaos,
  };
}

export default useDataSimulator;

