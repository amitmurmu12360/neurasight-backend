/**
 * Google Sheets Data Connector
 * ============================
 * Fetches dashboard data from a public Google Sheet and maps it
 * to the NeuraSight DashboardState schema.
 *
 * Sheet Requirements:
 * - Must be "Published to the web" (File > Share > Publish to web)
 * - Expected schema in Sheet1:
 *   | Metric         | Value   | Unit | Status          |
 *   |----------------|---------|------|-----------------|
 *   | company_name   | Acme    |      | Series B        |
 *   | arr            | 24.3    | M    | Healthy         |
 *   | arr_growth_yoy | 18      | %    |                 |
 *   | burn_multiple  | 0.9     | x    | Efficient       |
 *   | nrr            | 132     | %    | World Class     |
 *   | mqls           | 1470    |      | Strong Pipeline |
 *   | mqls_growth    | 24      | %    |                 |
 *   | cac            | 246     | $    | Optimizing      |
 *   | cac_efficiency | -12     | %    |                 |
 *   | deals_closed   | 142     |      | QTD             |
 *   | velocity_days  | 90      |      | Improving       |
 *   | top_risk       | High paid channel burn |        |
 *   | top_opportunity| Enterprise segment growth |     |
 */

import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// SAAS BENCHMARK POLICY (Deterministic Grounding - Left Brain Truth Source)
// =============================================================================
// This is the ABSOLUTE TRUTH for the AI. All metric evaluations must reference
// these benchmarks. Policy violations MUST be flagged as top-priority risks.

export interface BenchmarkThreshold {
  target: number;
  healthy: { min: number; max: number };
  redFlag: { below?: number; above?: number };
  unit: string;
  description: string;
}

export interface SaaSBenchmarkPolicy {
  arr: BenchmarkThreshold;
  burn_multiple: BenchmarkThreshold;
  nrr: BenchmarkThreshold;
  ltv_cac: BenchmarkThreshold;
  cac_payback: BenchmarkThreshold;
  gross_margin: BenchmarkThreshold;
  rule_of_40: BenchmarkThreshold;
}

export const SAAS_BENCHMARK_POLICY: SaaSBenchmarkPolicy = {
  arr: {
    target: 20,
    healthy: { min: 20, max: 100 },
    redFlag: { below: 10 },
    unit: "M",
    description: "Series B companies should have ARR > $20M. Below $10M indicates early stage risk.",
  },
  burn_multiple: {
    target: 1.0,
    healthy: { min: 0.5, max: 1.5 },
    redFlag: { above: 2.0 },
    unit: "x",
    description: "Burn Multiple = Net Burn / Net New ARR. Below 1.5x is healthy. Above 2.0x is RED FLAG.",
  },
  nrr: {
    target: 120,
    healthy: { min: 110, max: 150 },
    redFlag: { below: 100 },
    unit: "%",
    description: "Net Revenue Retention should be > 110%. Below 100% means you're losing existing revenue.",
  },
  ltv_cac: {
    target: 4.0,
    healthy: { min: 3.0, max: 6.0 },
    redFlag: { below: 2.5 },
    unit: "x",
    description: "LTV/CAC ratio should be > 3.0x. Below 2.5x indicates unsustainable unit economics.",
  },
  cac_payback: {
    target: 12,
    healthy: { min: 6, max: 18 },
    redFlag: { above: 24 },
    unit: "months",
    description: "CAC Payback should be < 18 months. Above 24 months is RED FLAG for cash efficiency.",
  },
  gross_margin: {
    target: 75,
    healthy: { min: 70, max: 85 },
    redFlag: { below: 60 },
    unit: "%",
    description: "SaaS Gross Margin should be > 70%. Below 60% indicates delivery cost issues.",
  },
  rule_of_40: {
    target: 40,
    healthy: { min: 40, max: 80 },
    redFlag: { below: 20 },
    unit: "%",
    description: "Rule of 40 (Growth% + Margin%) should be > 40%. Below 20% is concerning.",
  },
};

// Helper to get policy as formatted string for AI injection
export function getPolicyContext(): string {
  const lines: string[] = [
    "## 📋 SAAS BENCHMARK POLICY (ABSOLUTE TRUTH - DO NOT DEVIATE)",
    "You MUST evaluate all metrics against these benchmarks. Policy violations are CRITICAL ALERTS.",
    "",
  ];

  Object.entries(SAAS_BENCHMARK_POLICY).forEach(([key, policy]) => {
    const p = policy as BenchmarkThreshold;
    const redFlagText = p.redFlag.below
      ? `RED FLAG if < ${p.redFlag.below}${p.unit}`
      : `RED FLAG if > ${p.redFlag.above}${p.unit}`;
    
    lines.push(
      `### ${key.toUpperCase().replace("_", " ")}`,
      `- **Target:** ${p.target}${p.unit}`,
      `- **Healthy Range:** ${p.healthy.min}${p.unit} - ${p.healthy.max}${p.unit}`,
      `- **${redFlagText}**`,
      `- ${p.description}`,
      ""
    );
  });

  return lines.join("\n");
}

// Helper to evaluate a metric against policy
export interface PolicyViolation {
  metric: string;
  value: number;
  threshold: number;
  severity: "critical" | "warning";
  message: string;
}

export function evaluateAgainstPolicy(data: DashboardState): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const policy = SAAS_BENCHMARK_POLICY;

  // ARR check
  const arr = data.financials?.arr?.value || 0;
  if (policy.arr.redFlag.below && arr < policy.arr.redFlag.below) {
    violations.push({
      metric: "ARR",
      value: arr,
      threshold: policy.arr.redFlag.below,
      severity: "critical",
      message: `ARR ($${arr}M) is below red flag threshold ($${policy.arr.redFlag.below}M)`,
    });
  }

  // Burn Multiple check
  const burn = data.financials?.burn_multiple?.value || 0;
  if (policy.burn_multiple.redFlag.above && burn > policy.burn_multiple.redFlag.above) {
    violations.push({
      metric: "Burn Multiple",
      value: burn,
      threshold: policy.burn_multiple.redFlag.above,
      severity: "critical",
      message: `Burn Multiple (${burn}x) exceeds red flag threshold (${policy.burn_multiple.redFlag.above}x)`,
    });
  }

  // NRR check
  const nrr = data.financials?.nrr?.value || 0;
  if (policy.nrr.redFlag.below && nrr < policy.nrr.redFlag.below) {
    violations.push({
      metric: "NRR",
      value: nrr,
      threshold: policy.nrr.redFlag.below,
      severity: "critical",
      message: `NRR (${nrr}%) is below red flag threshold (${policy.nrr.redFlag.below}%)`,
    });
  }

  return violations;
}

// =============================================================================
// TYPES
// =============================================================================
export interface SheetRow {
  metric: string;
  value: string;
  unit?: string;
  status?: string;
}

export interface SheetMetadata {
  sheetName: string;
  lastUpdated: Date;
  rowCount: number;
}

export interface FetchResult {
  data: DashboardState | null;
  metadata: SheetMetadata | null;
  error: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const GVIZ_BASE_URL = "https://docs.google.com/spreadsheets/d";

// Default/fallback data when no sheet is connected
export const DEFAULT_DASHBOARD_DATA: DashboardState = {
  company: {
    name: "NeuraSight AI",
    stage: "B2B SaaS Series B",
  },
  financials: {
    arr: {
      value: 24.3,
      unit: "M",
      currency: "$",
      growth_yoy: 18,
      status: "Healthy but needs acceleration to hit 25%",
    },
    burn_multiple: {
      value: 0.9,
      benchmark: 1.5,
      status: "Efficient (Industry avg is 1.5x)",
    },
    nrr: {
      value: 132,
      unit: "%",
      status: "World Class (Strong product-market fit)",
    },
  },
  growth: {
    mqls: {
      value: 1470,
      growth_mom: 24,
      status: "Strong Top-of-Funnel",
    },
    cac: {
      value: 246,
      currency: "$",
      efficiency_gain: -12,
      status: "Optimizing well",
    },
    top_risk: "Elevated marketing burn in paid channels (Facebook/LinkedIn ads)",
  },
  sales: {
    deals_closed: {
      value: 142,
      period: "QTD",
    },
    velocity: {
      avg_cycle_days: 90,
      status: "Improving",
    },
    top_opportunity: "Strong organic growth signal in Enterprise segment",
  },
};

// =============================================================================
// HELPER: Extract Sheet ID from URL or ID
// =============================================================================
export function extractSheetId(input: string): string | null {
  // If it's already just an ID (alphanumeric + dashes/underscores)
  if (/^[\w-]+$/.test(input) && input.length > 20) {
    return input;
  }

  // Extract from full URL
  // Format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}

// =============================================================================
// HELPER: Parse Google Visualization API response
// =============================================================================
function parseGvizResponse(responseText: string): SheetRow[] {
  // Google Visualization API returns JSONP-like response
  // Format: /*O_o*/ google.visualization.Query.setResponse({...})
  
  const jsonMatch = responseText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?$/);
  if (!jsonMatch) {
    throw new Error("Invalid Google Sheets response format");
  }

  const data = JSON.parse(jsonMatch[1]);
  
  if (data.status === "error") {
    throw new Error(data.errors?.[0]?.detailed_message || "Sheet access denied");
  }

  const rows: SheetRow[] = [];
  const table = data.table;

  if (!table || !table.rows) {
    throw new Error("No data found in sheet");
  }

  // Skip header row (index 0), process data rows
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row.c || !row.c[0]?.v) continue;

    rows.push({
      metric: String(row.c[0]?.v || "").toLowerCase().trim(),
      value: String(row.c[1]?.v || ""),
      unit: String(row.c[2]?.v || ""),
      status: String(row.c[3]?.v || ""),
    });
  }

  return rows;
}

// =============================================================================
// HELPER: Map Sheet Rows to DashboardState
// =============================================================================
function mapRowsToDashboardState(rows: SheetRow[]): DashboardState {
  // Create a lookup map
  const lookup = new Map<string, SheetRow>();
  rows.forEach((row) => lookup.set(row.metric, row));

  // Helper to get numeric value
  const getNum = (key: string, defaultVal: number): number => {
    const row = lookup.get(key);
    if (!row) return defaultVal;
    const parsed = parseFloat(row.value);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  // Helper to get string value
  const getStr = (key: string, defaultVal: string): string => {
    return lookup.get(key)?.value || defaultVal;
  };

  // Helper to get status
  const getStatus = (key: string, defaultVal: string): string => {
    return lookup.get(key)?.status || defaultVal;
  };

  return {
    company: {
      name: getStr("company_name", "Your Company"),
      stage: getStatus("company_name", "B2B SaaS"),
    },
    financials: {
      arr: {
        value: getNum("arr", 24.3),
        unit: lookup.get("arr")?.unit || "M",
        currency: "$",
        growth_yoy: getNum("arr_growth_yoy", 18),
        status: getStatus("arr", "Tracking"),
      },
      burn_multiple: {
        value: getNum("burn_multiple", 0.9),
        benchmark: 1.5,
        status: getStatus("burn_multiple", "Monitoring"),
      },
      nrr: {
        value: getNum("nrr", 100),
        unit: "%",
        status: getStatus("nrr", "Tracking"),
      },
    },
    growth: {
      mqls: {
        value: getNum("mqls", 1000),
        growth_mom: getNum("mqls_growth", 0),
        status: getStatus("mqls", "Active"),
      },
      cac: {
        value: getNum("cac", 200),
        currency: "$",
        efficiency_gain: getNum("cac_efficiency", 0),
        status: getStatus("cac", "Monitoring"),
      },
      top_risk: getStr("top_risk", "No critical risks identified"),
    },
    sales: {
      deals_closed: {
        value: getNum("deals_closed", 0),
        period: lookup.get("deals_closed")?.unit || "QTD",
      },
      velocity: {
        avg_cycle_days: getNum("velocity_days", 90),
        status: getStatus("velocity_days", "Stable"),
      },
      top_opportunity: getStr("top_opportunity", "Growth opportunities being analyzed"),
    },
  };
}

// =============================================================================
// MAIN: Fetch Dashboard from Google Sheets
// =============================================================================
export async function fetchDashboardFromSheets(
  sheetIdOrUrl: string
): Promise<FetchResult> {
  // Extract Sheet ID
  const sheetId = extractSheetId(sheetIdOrUrl);
  if (!sheetId) {
    return {
      data: null,
      metadata: null,
      error: "Invalid Google Sheet ID or URL. Please provide a valid Sheet ID or full URL.",
    };
  }

  try {
    // Build the Google Visualization API URL
    // Using gviz/tq endpoint which works for public sheets
    const url = `${GVIZ_BASE_URL}/${sheetId}/gviz/tq?tqx=out:json&sheet=Sheet1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          data: null,
          metadata: null,
          error: "Sheet not found. Please check the Sheet ID and ensure the sheet is published.",
        };
      }
      if (response.status === 403) {
        return {
          data: null,
          metadata: null,
          error: "Access denied. Please publish the sheet: File → Share → Publish to web.",
        };
      }
      return {
        data: null,
        metadata: null,
        error: `Failed to fetch sheet: HTTP ${response.status}`,
      };
    }

    const responseText = await response.text();
    
    // Parse the response
    const rows = parseGvizResponse(responseText);

    if (rows.length === 0) {
      return {
        data: null,
        metadata: null,
        error: "Sheet appears to be empty or has no valid data rows.",
      };
    }

    // Map to DashboardState
    const dashboardData = mapRowsToDashboardState(rows);

    // Extract metadata
    const metadata: SheetMetadata = {
      sheetName: dashboardData.company.name || "Connected Sheet",
      lastUpdated: new Date(),
      rowCount: rows.length,
    };

    return {
      data: dashboardData,
      metadata,
      error: null,
    };
  } catch (error) {
    console.error("Google Sheets fetch error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Sheet access denied")) {
        return {
          data: null,
          metadata: null,
          error: "Sheet access denied. Please publish the sheet: File → Share → Publish to web.",
        };
      }
      return {
        data: null,
        metadata: null,
        error: error.message,
      };
    }
    
    return {
      data: null,
      metadata: null,
      error: "An unexpected error occurred while fetching sheet data.",
    };
  }
}

// =============================================================================
// HELPER: Create Sheet URL
// =============================================================================
export function createSheetUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

// =============================================================================
// RAW DATA TYPES (for AI Analysis)
// =============================================================================
export interface RawSheetData {
  headers: string[];
  rows: Record<string, string>[];
  rawCsv: string;
}

export interface RawFetchResult {
  data: RawSheetData | null;
  error: string | null;
}

// =============================================================================
// FETCH RAW CSV DATA (for AI Analysis)
// =============================================================================
export async function fetchSheetAsCSV(sheetIdOrUrl: string): Promise<RawFetchResult> {
  const sheetId = extractSheetId(sheetIdOrUrl);
  if (!sheetId) {
    return {
      data: null,
      error: "Invalid Google Sheet ID or URL",
    };
  }

  try {
    // Google Sheets CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    const response = await fetch(csvUrl);

    if (!response.ok) {
      return {
        data: null,
        error: `Failed to fetch CSV: HTTP ${response.status}. Make sure the sheet is published.`,
      };
    }

    const rawCsv = await response.text();

    // Parse CSV to JSON
    const lines = rawCsv.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return {
        data: null,
        error: "Sheet appears empty or has no data rows",
      };
    }

    // Parse headers (first row)
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header.toLowerCase().trim().replace(/\s+/g, "_")] = values[idx]?.trim() || "";
      });
      rows.push(row);
    }

    return {
      data: {
        headers,
        rows,
        rawCsv,
      },
      error: null,
    };
  } catch (error) {
    console.error("CSV fetch error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch CSV data",
    };
  }
}

// =============================================================================
// HELPER: Parse CSV Line (handles quoted values)
// =============================================================================
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// =============================================================================
// METADATA LOGIC (Left Brain Context)
// =============================================================================
export const METRIC_DEFINITIONS = {
  arr: {
    name: "Annual Recurring Revenue",
    description: "Total predictable revenue normalized to one year",
    healthyRange: { min: 20, max: 100, unit: "M" },
    redFlag: "Below $10M indicates early stage, above $100M is enterprise scale",
  },
  burn_multiple: {
    name: "Burn Multiple",
    description: "Net burn / Net new ARR. Lower is better.",
    healthyRange: { min: 0.5, max: 1.5, unit: "x" },
    redFlag: "Above 2x is dangerous, below 0.5x is exceptional",
  },
  nrr: {
    name: "Net Revenue Retention",
    description: "Revenue from existing customers including expansion minus churn",
    healthyRange: { min: 100, max: 150, unit: "%" },
    redFlag: "Below 100% means you're losing more than gaining from existing customers",
  },
  mqls: {
    name: "Marketing Qualified Leads",
    description: "Leads that meet marketing criteria for sales readiness",
    healthyRange: { min: 500, max: 5000, unit: "" },
    redFlag: "MoM growth below 10% indicates demand generation issues",
  },
  cac: {
    name: "Customer Acquisition Cost",
    description: "Total cost to acquire a new customer",
    healthyRange: { min: 100, max: 500, unit: "$" },
    redFlag: "Rising CAC without corresponding LTV increase is unsustainable",
  },
  deals_closed: {
    name: "Deals Closed",
    description: "Number of won deals in the period",
    healthyRange: { min: 50, max: 500, unit: "" },
    redFlag: "Declining close rate indicates sales process or product-market fit issues",
  },
  velocity: {
    name: "Sales Velocity",
    description: "Average time from first touch to close",
    healthyRange: { min: 30, max: 90, unit: "days" },
    redFlag: "Lengthening cycles suggest buyer hesitation or complex sales process",
  },
};

export function getMetricContext(): string {
  return Object.entries(METRIC_DEFINITIONS)
    .map(([key, def]) => {
      return `- **${def.name}** (${key}): ${def.description}. Healthy: ${def.healthyRange.min}-${def.healthyRange.max}${def.healthyRange.unit}. Red Flag: ${def.redFlag}`;
    })
    .join("\n");
}

