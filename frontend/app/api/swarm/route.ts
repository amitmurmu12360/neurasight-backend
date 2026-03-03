/**
 * Swarm API Route - Server-Side Agent Orchestration
 * ===================================================
 * Handles agent swarm execution on the server to avoid "node:fs" Turbopack errors.
 * E2B and Orchestrator logic stays server-side only.
 */

import { NextRequest, NextResponse } from "next/server";
import { Orchestrator } from "@/lib/agents/orchestrator";
import type { DashboardState } from "@/types/dashboard";
import type { DataSource } from "@/lib/agents/orchestrator";

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Create singleton orchestrator instance
const orchestrator = new Orchestrator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      source,
      data,
      context,
    }: {
      source: DataSource;
      data: DashboardState;
      context?: Record<string, unknown>;
    } = body;

    if (!data) {
      return NextResponse.json(
        { error: "Missing required field: data" },
        { status: 400 }
      );
    }

    // =============================================================================
    // KILL-SWITCH: Industry Lock (Absolute DNA Dictatorship)
    // =============================================================================
    // If Agent 0 (Janitor) calculated variance > 1000, HARDCODE industry to 'ecommerce'
    // DO NOT let Agent 1 "vote" on this. Math is ground truth.
    const enrichedContext = { ...(context || {}) };
    
    // Check if janitorResult exists in context (from previous execution or passed directly)
    const janitorResult = enrichedContext.janitorResult as {
      feature_vector?: {
        variance_amount?: number;
        time_delta?: number;
        sparsity?: number;
      };
    } | undefined;
    
    // KILL-SWITCH: If variance > 1000, force industry to 'ecommerce' (Retail)
    if (janitorResult?.feature_vector?.variance_amount && janitorResult.feature_vector.variance_amount > 1000) {
      // HARDCODE industry in context - this overrides all agent voting
      enrichedContext.industry = "ecommerce";
      enrichedContext.forcedIndustry = "ecommerce"; // Explicit flag
      enrichedContext.killSwitchActive = true; // Flag for logging
      
      console.log("[Swarm API] KILL-SWITCH ACTIVATED: Variance > 1000 detected. Forcing industry to 'ecommerce'. All agent voting disabled.");
    }

    // Reset orchestrator for new execution
    orchestrator.reset();

    // Execute agent swarm with enriched context (includes kill-switch industry lock)
    const results = await orchestrator.executeSwarm(
      source || "demo",
      data,
      enrichedContext
    );

    // Get agent activities for client-side display
    const activities = orchestrator.getActivities();

    // Convert Map to plain object for JSON serialization
    const resultsObject: Record<string, unknown> = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    return NextResponse.json({
      success: true,
      results: resultsObject,
      activities: activities.map(a => ({
        agentId: a.agentId,
        agentName: a.agentName,
        status: a.status,
        message: a.message,
        timestamp: a.timestamp.toISOString(),
        metadata: a.metadata,
      })),
    });
  } catch (error) {
    console.error("[Swarm API] Error executing swarm:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

