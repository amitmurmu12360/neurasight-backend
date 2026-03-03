/**
 * Sovereign Context - Global State for Mathematical Truth
 * =======================================================
 * Single source of truth for feature vectors and cleaned data from Agent 0 (The Janitor).
 * Ensures 100% mathematical precision in industry detection.
 */

import type { JanitorResult } from "./e2bManager";

// =============================================================================
// TYPES
// =============================================================================

export interface SovereignContext {
  /** Feature vector from Agent 0 (The Janitor) */
  featureVector: {
    variance_amount: number;  // σ²(amount)
    time_delta: number;       // Δ(time) in days
    sparsity: number;        // ρ(sparsity) 0-1
  } | null;
  
  /** Cleaned headers from Agent 0 */
  cleanedHeaders: string[];
  
  /** Summary statistics from Agent 0 */
  summaryStats: JanitorResult["summary_stats"] | null;
  
  /** Timestamp of last update */
  lastUpdated: Date | null;
  
  /** Whether the context has been initialized */
  isInitialized: boolean;
}

// =============================================================================
// GLOBAL SOVEREIGN CONTEXT
// =============================================================================

let globalSovereignContext: SovereignContext = {
  featureVector: null,
  cleanedHeaders: [],
  summaryStats: null,
  lastUpdated: null,
  isInitialized: false,
};

// =============================================================================
// CONTEXT MANAGER
// =============================================================================

/**
 * Update Sovereign Context with Janitor results
 */
export function updateSovereignContext(janitorResult: JanitorResult): void {
  globalSovereignContext = {
    featureVector: janitorResult.feature_vector,
    cleanedHeaders: janitorResult.cleaned_headers,
    summaryStats: janitorResult.summary_stats,
    lastUpdated: new Date(),
    isInitialized: janitorResult.success,
  };
  
  console.log("[Sovereign Context] Updated with feature vector:", janitorResult.feature_vector);
}

/**
 * Get current Sovereign Context
 */
export function getSovereignContext(): SovereignContext {
  return { ...globalSovereignContext };
}

/**
 * Get feature vector from context
 */
export function getFeatureVector(): SovereignContext["featureVector"] {
  return globalSovereignContext.featureVector;
}

/**
 * Get cleaned headers from context
 */
export function getCleanedHeaders(): string[] {
  return [...globalSovereignContext.cleanedHeaders];
}

/**
 * Check if context is initialized
 */
export function isSovereignContextInitialized(): boolean {
  return globalSovereignContext.isInitialized;
}

/**
 * Reset Sovereign Context
 */
export function resetSovereignContext(): void {
  globalSovereignContext = {
    featureVector: null,
    cleanedHeaders: [],
    summaryStats: null,
    lastUpdated: null,
    isInitialized: false,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  updateSovereignContext,
  getSovereignContext,
  getFeatureVector,
  getCleanedHeaders,
  isSovereignContextInitialized,
  resetSovereignContext,
};

