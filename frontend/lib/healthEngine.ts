/**
 * Intelligence Health Score Engine
 * ================================
 * Calculates a dynamic 0-100 health score based on:
 * - Freshness (30%): Data staleness penalty
 * - Integrity (40%): Agent 2 (Math Auditor) warnings
 * - Execution (30%): User engagement (Execute via AI Agent clicks)
 */

export interface IntelligenceHealthResult {
  score: number; // 0-100
  label: string; // "Excellent", "Good", "Fair", "Critical"
  color: string; // Hex color for UI
  statusDescription: string; // Human-readable status
  breakdown: {
    freshness: {
      score: number;
      maxScore: number;
      deduction: number;
      message: string;
    };
    integrity: {
      score: number;
      maxScore: number;
      deduction: number;
      message: string;
    };
    execution: {
      score: number;
      maxScore: number;
      bonus: number;
      message: string;
    };
  };
}

export interface HealthEngineInputs {
  swarmStatus?: {
    hasCriticalWarnings?: boolean;
    lastExecutionTime?: number;
  };
  syncAge?: number; // Milliseconds since last sync
  executeCount?: number; // Number of "Execute via AI Agent" clicks (max 30 = +30 points)
}

/**
 * Calculate Intelligence Health Score
 */
export function calculateIntelligenceHealth(
  inputs: HealthEngineInputs = {}
): IntelligenceHealthResult {
  const { swarmStatus, syncAge, executeCount = 0 } = inputs;
  
  // =============================================================================
  // FRESHNESS SCORE (30% of total = 30 points)
  // =============================================================================
  let freshnessScore = 30;
  let freshnessDeduction = 0;
  let freshnessMessage = "Data is fresh and up-to-date.";
  
  if (syncAge !== undefined) {
    const minutesSinceSync = syncAge / (1000 * 60);
    
    if (minutesSinceSync > 10) {
      // Deduct 1 point for every minute over 10 minutes (max deduction: 30 points)
      freshnessDeduction = Math.min(30, Math.floor(minutesSinceSync - 10));
      freshnessScore = Math.max(0, 30 - freshnessDeduction);
      
      if (minutesSinceSync > 40) {
        freshnessMessage = `Data is ${Math.floor(minutesSinceSync)} minutes old. Critical staleness detected.`;
      } else if (minutesSinceSync > 20) {
        freshnessMessage = `Data is ${Math.floor(minutesSinceSync)} minutes old. Staleness detected.`;
      } else {
        freshnessMessage = `Data is ${Math.floor(minutesSinceSync)} minutes old.`;
      }
    }
  } else {
    // Never synced - maximum penalty
    freshnessScore = 0;
    freshnessDeduction = 30;
    freshnessMessage = "No data sync detected. Immediate sync required.";
  }
  
  // =============================================================================
  // INTEGRITY SCORE (40% of total = 40 points)
  // =============================================================================
  let integrityScore = 40;
  let integrityDeduction = 0;
  let integrityMessage = "All systems verified. No math warnings.";
  
  if (swarmStatus?.hasCriticalWarnings) {
    // Deduct 20 points for critical warnings (half of integrity weight)
    integrityDeduction = 20;
    integrityScore = 20;
    integrityMessage = "Critical math warnings detected. Immediate attention required.";
  } else {
    integrityMessage = "Math integrity verified. All metrics passed Agent 2 audit.";
  }
  
  // =============================================================================
  // EXECUTION SCORE (30% of total = 30 points)
  // =============================================================================
  let executionScore = 0; // Start at 0, add bonus points
  let executionBonus = 0;
  let executionMessage = "No strategic actions executed yet.";
  
  // Add 1 point per execution (max 30 points = 30%)
  executionBonus = Math.min(executeCount, 30);
  executionScore = executionBonus;
  
  if (executeCount > 20) {
    executionMessage = `Excellent engagement: ${executeCount} strategic actions executed.`;
  } else if (executeCount > 10) {
    executionMessage = `Strong engagement: ${executeCount} strategic actions executed.`;
  } else if (executeCount > 0) {
    executionMessage = `${executeCount} strategic action${executeCount > 1 ? 's' : ''} executed.`;
  }
  
  // =============================================================================
  // TOTAL SCORE CALCULATION
  // =============================================================================
  const totalScore = Math.round(freshnessScore + integrityScore + executionScore);
  const finalScore = Math.max(0, Math.min(100, totalScore));
  
  // =============================================================================
  // DETERMINE LABEL, COLOR, AND STATUS
  // =============================================================================
  let label: string;
  let color: string;
  let statusDescription: string;
  
  if (finalScore >= 75) {
    label = "Excellent";
    color = "#10b981"; // Emerald
    statusDescription = "All systems optimal. Intelligence pipeline healthy.";
  } else if (finalScore >= 50) {
    label = "Good";
    color = "#f59e0b"; // Amber
    statusDescription = "System operational with minor optimizations available.";
  } else if (finalScore >= 25) {
    label = "Fair";
    color = "#f97316"; // Orange
    statusDescription = "Attention recommended. Some systems require optimization.";
  } else {
    label = "Critical";
    color = "#ef4444"; // Red
    statusDescription = "Immediate attention required. Data may be stale or warnings detected.";
  }
  
  return {
    score: finalScore,
    label,
    color,
    statusDescription,
    breakdown: {
      freshness: {
        score: freshnessScore,
        maxScore: 30,
        deduction: freshnessDeduction,
        message: freshnessMessage,
      },
      integrity: {
        score: integrityScore,
        maxScore: 40,
        deduction: integrityDeduction,
        message: integrityMessage,
      },
      execution: {
        score: executionScore,
        maxScore: 30,
        bonus: executionBonus,
        message: executionMessage,
      },
    },
  };
}

/**
 * Get persona-specific health label
 */
export function getPersonaHealthLabel(persona: "CEO" | "CMO" | "VP Sales"): string {
  switch (persona) {
    case "CEO":
      return "Decision Confidence";
    case "CMO":
      return "Growth Efficiency";
    case "VP Sales":
      return "Pipeline Velocity Score";
    default:
      return "Intelligence Health";
  }
}

/**
 * Predict Health Boost after fix is applied
 * Estimates how much the Intelligence Health Score will increase
 */
export function predictHealthBoost(
  currentScore: number,
  factor: "freshness" | "integrity" | "execution"
): number {
  // Base boost depends on which factor is being addressed
  let baseBoost = 0;
  
  switch (factor) {
    case "freshness":
      // Freshness fixes restore up to 30 points (the max freshness score)
      baseBoost = Math.min(30, 100 - currentScore);
      break;
    case "integrity":
      // Integrity fixes can restore up to 20 points (the deduction for critical warnings)
      baseBoost = 20;
      break;
    case "execution":
      // Execution fixes add engagement points (max +30, but incremental)
      baseBoost = 5; // Assume +5 points per fix execution
      break;
  }
  
  // Scale boost based on current score (less impact if already high)
  const scalingFactor = currentScore < 50 ? 1.0 : currentScore < 75 ? 0.7 : 0.5;
  
  return Math.round(baseBoost * scalingFactor);
}
