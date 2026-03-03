/**
 * Sovereign Writer: Deterministic Pivot Execution Engine
 * ======================================================
 * The "Hands" of the Strategic OS - Executes deterministic repairs
 * on the current dataset based on AI recommendations.
 */

import type { DashboardState } from "@/types/dashboard";
import { executionEngine, type FixPayload, type ExecutionResult } from "./executionAdapter";

export interface Recommendation {
  title: string;
  impact_analysis: string;
  risk_level: "low" | "medium" | "high";
  confidence_score: number;
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
}

export interface DeterministicPivotResult {
  success: boolean;
  message: string;
  healedData?: DashboardState;
  downloadUrl?: string;
  fileName?: string;
  affectedMetrics?: string[];
  error?: string;
}

/**
 * Execute a deterministic pivot based on recommendations
 * Generates a "healed" version of the dataset
 */
export async function executeDeterministicPivot(
  currentData: DashboardState,
  recommendations: Recommendation[],
  sourceType: "GOOGLE_SHEETS" | "CSV" | "SQL",
  target: string
): Promise<DeterministicPivotResult> {
  try {
    // Convert recommendations to fix operations
    const operations = recommendations.flatMap((rec) => {
      const payload = rec.one_click_action_payload;
      const ops: Array<{
        type: "UPDATE_CELL" | "UPDATE_RANGE" | "INSERT_ROW" | "DELETE_ROW" | "CREATE_COLUMN";
        location: string;
        value?: string | number | boolean;
        formula?: string;
      }> = [];

      // Parse action payload
      if (payload.action_type === "FIX_METRIC" && payload.target_metric) {
        const metric = payload.target_metric;
        const expectedImpact = payload.expected_impact;

        // Calculate corrected value
        let correctedValue: number | string | boolean = currentData.financials[metric as keyof typeof currentData.financials]?.value || 0;

        if (expectedImpact && typeof correctedValue === "number") {
          // Apply expected change
          const changePercent = expectedImpact.change_percent / 100;
          correctedValue = correctedValue * (1 + changePercent);
        } else if (payload.parameters.value !== undefined) {
          correctedValue = payload.parameters.value as number | string | boolean;
        }

        // Map metric to cell reference or column
        const location = mapMetricToLocation(metric, sourceType);

        ops.push({
          type: "UPDATE_CELL",
          location,
          value: correctedValue,
        });
      } else if (payload.action_type === "CORRECT_ANOMALY") {
        // Handle anomaly correction
        const metric = payload.target_metric || "unknown";
        const location = mapMetricToLocation(metric, sourceType);
        const correctedValue = payload.parameters.corrected_value as number | string | boolean || 0;

        ops.push({
          type: "UPDATE_CELL",
          location,
          value: correctedValue,
        });
      }

      return ops;
    });

    if (operations.length === 0) {
      return {
        success: false,
        message: "No valid operations generated from recommendations",
        error: "No operations to execute",
      };
    }

    // Create fix payload
    const fixPayload: FixPayload = {
      source: sourceType,
      target,
      operations,
      metadata: {
        description: `Deterministic Pivot: ${recommendations.length} recommendation(s) applied`,
        riskLevel: recommendations.some((r) => r.risk_level === "high") ? "high" : "medium",
        estimatedDuration: 3000,
      },
    };

    // Execute via execution engine
    const executionResult: ExecutionResult = await executionEngine.execute(fixPayload);

    if (!executionResult.success) {
      return {
        success: false,
        message: executionResult.message,
        error: executionResult.error,
      };
    }

    // Generate healed data (apply operations to current data)
    const healedData = applyOperationsToData(currentData, operations);

    // For CSV, generate download URL
    let downloadUrl: string | undefined;
    let fileName: string | undefined;

    if (sourceType === "CSV") {
      const csvContent = generateHealedCSV(healedData, operations);
      const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadUrl = window.URL.createObjectURL(csvBlob);
      fileName = `Sovereign_Healed_${Date.now()}.csv`;
    }

    return {
      success: true,
      message: `Strategic Pivot Executed. ${operations.length} operation(s) applied.`,
      healedData,
      downloadUrl,
      fileName,
      affectedMetrics: operations.map((op) => extractMetricFromLocation(op.location)),
    };
  } catch (error) {
    return {
      success: false,
      message: `Deterministic pivot failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Map metric name to location (cell reference or column name)
 */
function mapMetricToLocation(metric: string, sourceType: "GOOGLE_SHEETS" | "CSV" | "SQL"): string {
  // Simplified mapping - in production, use actual schema mapping
  const metricMap: Record<string, string> = {
    arr: sourceType === "GOOGLE_SHEETS" ? "B2" : "ARR",
    nrr: sourceType === "GOOGLE_SHEETS" ? "C2" : "NRR",
    cac: sourceType === "GOOGLE_SHEETS" ? "D2" : "CAC",
    ltv: sourceType === "GOOGLE_SHEETS" ? "E2" : "LTV",
    burn_multiple: sourceType === "GOOGLE_SHEETS" ? "F2" : "BURN_MULTIPLE",
    gross_margin: sourceType === "GOOGLE_SHEETS" ? "G2" : "GROSS_MARGIN",
    roas: sourceType === "GOOGLE_SHEETS" ? "H2" : "ROAS",
  };

  return metricMap[metric.toLowerCase()] || metric.toUpperCase();
}

/**
 * Extract metric name from location
 */
function extractMetricFromLocation(location: string): string {
  // Reverse mapping
  const locationMap: Record<string, string> = {
    B2: "ARR",
    C2: "NRR",
    D2: "CAC",
    E2: "LTV",
    F2: "BURN_MULTIPLE",
    G2: "GROSS_MARGIN",
    H2: "ROAS",
  };

  return locationMap[location] || location;
}

/**
 * Apply operations to current data to generate healed version
 */
function applyOperationsToData(
  currentData: DashboardState,
  operations: Array<{ type: string; location: string; value?: string | number | boolean }>
): DashboardState {
  // Create a deep copy
  const healedData: DashboardState = JSON.parse(JSON.stringify(currentData));

  for (const op of operations) {
    const metric = extractMetricFromLocation(op.location);

    // Apply to appropriate metric
    if (metric === "ARR" && typeof op.value === "number") {
      healedData.financials.arr.value = op.value;
    } else if (metric === "NRR" && typeof op.value === "number") {
      healedData.financials.nrr.value = op.value;
    } else if (metric === "CAC" && typeof op.value === "number") {
      healedData.growth.cac.value = op.value;
    } else if (metric === "LTV" && typeof op.value === "number") {
      healedData.growth.ltv.value = op.value;
    } else if (metric === "BURN_MULTIPLE" && typeof op.value === "number") {
      healedData.financials.burn_multiple.value = op.value;
    } else if (metric === "GROSS_MARGIN" && typeof op.value === "number") {
      healedData.financials.gross_margin.value = op.value;
    } else if (metric === "ROAS" && typeof op.value === "number") {
      healedData.growth.roas.value = op.value;
    }
  }

  return healedData;
}

/**
 * Generate CSV content from healed data
 */
function generateHealedCSV(
  healedData: DashboardState,
  operations: Array<{ type: string; location: string; value?: string | number | boolean }>
): string {
  const rows: string[] = [];

  // Header row
  rows.push("Metric,Value,Unit,Status");

  // Data rows
  const metrics = [
    { name: "ARR", value: healedData.financials.arr.value, unit: healedData.financials.arr.unit },
    { name: "NRR", value: healedData.financials.nrr.value, unit: healedData.financials.nrr.unit },
    { name: "CAC", value: healedData.growth.cac.value, unit: healedData.growth.cac.unit },
    { name: "LTV", value: healedData.growth.ltv.value, unit: healedData.growth.ltv.unit },
    { name: "BURN_MULTIPLE", value: healedData.financials.burn_multiple.value, unit: healedData.financials.burn_multiple.unit },
    { name: "GROSS_MARGIN", value: healedData.financials.gross_margin.value, unit: healedData.financials.gross_margin.unit },
    { name: "ROAS", value: healedData.growth.roas.value, unit: healedData.growth.roas.unit },
  ];

  for (const metric of metrics) {
    const wasModified = operations.some((op) => extractMetricFromLocation(op.location) === metric.name);
    const status = wasModified ? "HEALED" : "VERIFIED";

    rows.push(`"${metric.name}","${metric.value}","${metric.unit}","${status}"`);
  }

  return rows.join("\n");
}

