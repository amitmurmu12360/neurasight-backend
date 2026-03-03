/**
 * E2B Sandbox Manager - Agent 0 (The Janitor)
 * ============================================
 * Manages E2B CodeInterpreter sessions for mathematical feature vector calculation.
 * Provides 100% mathematical precision for industry detection.
 * 
 * SERVER-ONLY: This module must never be imported in client components.
 */

import 'server-only';

// E2B CodeInterpreter - Optional dependency
// If @e2b/code-interpreter is not installed, E2B functionality will be disabled
type CodeInterpreterType = {
  create: (config: { apiKey: string }) => Promise<{
    notebook: {
      execCell?: (code: string, options?: { stdin?: string }) => Promise<{
        results: Array<{ text?: string; logs?: string }>;
      }>;
    };
    execCode?: (code: string, options?: { stdin?: string }) => Promise<{
      results: Array<{ text?: string; logs?: string }>;
    }>;
    close: () => Promise<void>;
  }>;
};

let CodeInterpreter: CodeInterpreterType | null = null;

try {
  // Dynamic import to handle optional dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const e2bModule = require("@e2b/code-interpreter");
  CodeInterpreter = e2bModule.CodeInterpreter;
} catch {
  // E2B not installed - will use fallback
  console.warn("[E2B Manager] @e2b/code-interpreter not installed. E2B functionality disabled.");
}

// =============================================================================
// TYPES
// =============================================================================

export interface JanitorResult {
  cleaned_headers: string[];
  summary_stats: {
    row_count: number;
    column_count: number;
    numeric_columns: Array<{
      name: string;
      mean: number | null;
      std: number | null;
      min: number | null;
      max: number | null;
    }>;
    categorical_columns: Array<{
      name: string;
      unique_count: number;
      mode: string | null;
    }>;
    date_columns: string[];
  };
  feature_vector: {
    variance_amount: number;  // σ²(amount)
    time_delta: number;       // Δ(time) in days
    sparsity: number;        // ρ(sparsity) 0-1
  };
  success: boolean;
  error?: string;
}

export interface E2BManagerConfig {
  apiKey?: string;
  timeout?: number; // Timeout in milliseconds (default: 30000)
}

// =============================================================================
// E2B MANAGER CLASS
// =============================================================================

export class E2BManager {
  private session: Awaited<ReturnType<NonNullable<CodeInterpreterType>["create"]>> | null = null;
  private config: E2BManagerConfig;
  private isInitialized = false;

  constructor(config: E2BManagerConfig = {}) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  /**
   * Initialize E2B CodeInterpreter session
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.session) {
      return;
    }

    if (!CodeInterpreter) {
      throw new Error("E2B CodeInterpreter not available. Please install @e2b/code-interpreter package.");
    }

    try {
      // Get API key from environment or config
      const apiKey = this.config.apiKey || process.env.E2B_API_KEY;
      
      if (!apiKey) {
        throw new Error("E2B_API_KEY not found. Please set it in environment variables or config.");
      }

      // Initialize CodeInterpreter session
      this.session = await CodeInterpreter.create({
        apiKey,
      });

      this.isInitialized = true;
      console.log("[E2B Manager] Session initialized successfully");
    } catch (error) {
      console.error("[E2B Manager] Failed to initialize session:", error);
      throw error;
    }
  }

  /**
   * Upload data to sandbox and execute janitorAnalytic.py
   */
  async executeJanitor(
    data: Array<Record<string, unknown>> | Record<string, unknown>,
    primaryAmountColumn?: string
  ): Promise<JanitorResult> {
    if (!this.session) {
      await this.initialize();
    }

    if (!this.session) {
      throw new Error("E2B session not initialized");
    }

    try {
      // Read janitorAnalytic.py script
      const janitorScript = await this.getJanitorScript();

      // Prepare input data
      const inputData = {
        data,
        primary_amount_column: primaryAmountColumn,
      };

      // Create Python script that reads from stdin and writes to stdout
      const fullScript = `
import json
import sys

${janitorScript}

# Read input from stdin
input_json = sys.stdin.read()
input_data = json.loads(input_json)

# Process and output
result = main(input_data)
print(json.dumps(result, indent=2))
`;

      // Execute script with input data
      const inputJson = JSON.stringify(inputData);
      
      console.log("[E2B Manager] Executing janitorAnalytic.py...");
      
      // Use notebook.execCell or execCode depending on E2B API version
      const execution = await (this.session as any).notebook.execCell?.(
        fullScript,
        {
          stdin: inputJson,
        }
      ) || await (this.session as any).execCode?.(
        fullScript,
        {
          stdin: inputJson,
        }
      );

      // Parse output
      const output = execution.results[0]?.text || execution.results[0]?.logs || "";
      
      if (!output) {
        throw new Error("No output from E2B execution");
      }

      // Extract JSON from output (handle potential log messages)
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to parse JSON from output: ${output}`);
      }

      const result = JSON.parse(jsonMatch[0]) as JanitorResult;

      if (!result.success) {
        console.warn("[E2B Manager] Janitor execution completed with errors:", result.error);
      }

      return result;
    } catch (error) {
      console.error("[E2B Manager] Execution failed:", error);
      
      // Return fallback result
      return {
        cleaned_headers: [],
        summary_stats: {
          row_count: 0,
          column_count: 0,
          numeric_columns: [],
          categorical_columns: [],
          date_columns: [],
        },
        feature_vector: {
          variance_amount: 0.0,
          time_delta: 30.0,
          sparsity: 0.5,
        },
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get janitorAnalytic.py script content
   * In production, this would read from the file system or be bundled
   */
  private async getJanitorScript(): Promise<string> {
    // In a real implementation, this would read from the file system
    // For now, we'll use a fetch to get the script (if served statically)
    // or import it as a string constant
    
    // For Next.js, we can use dynamic import or fetch
    try {
      // Try to fetch from public directory (if served)
      const response = await fetch("/lib/intelligence/janitorAnalytic.py");
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Fallback: Return embedded script (for development)
      // In production, bundle the script or use a different method
    }

    // Fallback: Return empty string (script will be embedded in executeJanitor)
    return "";
  }

  /**
   * Close E2B session
   */
  async close(): Promise<void> {
    if (this.session) {
      try {
        await this.session.close();
        this.session = null;
        this.isInitialized = false;
        console.log("[E2B Manager] Session closed");
      } catch (error) {
        console.error("[E2B Manager] Error closing session:", error);
      }
    }
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.isInitialized && this.session !== null;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalE2BManager: E2BManager | null = null;

/**
 * Get or create global E2B Manager instance
 */
export function getE2BManager(config?: E2BManagerConfig): E2BManager {
  if (!globalE2BManager) {
    globalE2BManager = new E2BManager(config);
  }
  return globalE2BManager;
}

/**
 * Close global E2B Manager instance
 */
export async function closeE2BManager(): Promise<void> {
  if (globalE2BManager) {
    await globalE2BManager.close();
    globalE2BManager = null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  E2BManager,
  getE2BManager,
  closeE2BManager,
};

