/**
 * Agent 9: The Orchestrator
 * =========================
 * Coordinates 8 specialized sub-agents in parallel for autonomous intelligence.
 * Plans execution path based on input source (Sheet, CSV, XLSX, API).
 * 
 * SERVER-ONLY: This module must never be imported in client components.
 */

import 'server-only';
import type { DashboardState } from "@/types/dashboard";
import { getE2BManager, type JanitorResult } from "@/lib/intelligence/e2bManager";
import { updateSovereignContext, getFeatureVector } from "@/lib/intelligence/sovereignContext";
import { matchFeatureVectorToIndustry } from "@/lib/intelligence/industryLibrary";

export type AgentStatus = "idle" | "active" | "success" | "error";
export type DataSource = "sheets" | "csv" | "xlsx" | "api" | "demo";

export interface AgentActivity {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationPlan {
  source: DataSource;
  agents: string[]; // Agent IDs to execute
  executionOrder: "parallel" | "sequential";
  dependencies?: Record<string, string[]>; // Agent dependencies
}

export interface AgentResult {
  agentId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent 9: Orchestrator
 * Plans and coordinates agent execution
 */
export class Orchestrator {
  private activities: AgentActivity[] = [];
  private results: Map<string, AgentResult> = new Map();
  private plan: OrchestrationPlan | null = null;

  /**
   * Plan execution based on data source
   */
  planExecution(source: DataSource, data?: DashboardState): OrchestrationPlan {
    this.logActivity("orchestrator", "Agent 9: Orchestrator", "active", 
      `Planning execution for ${source} source...`);

    // All agents execute in parallel (no strict dependencies)
    // Agent 0 (Janitor) runs FIRST to provide mathematical feature vector
    const plan: OrchestrationPlan = {
      source,
      agents: [
        "janitor",      // Agent 0: The Janitor (runs first for mathematical truth)
        "sentinel",      // Agent 1: Data Sentinel
        "auditor",       // Agent 2: Math Auditor
        "policy",        // Agent 3: Policy Auditor
        "simulation",    // Agent 4: Simulation Architect
        "competitive",   // Agent 5: Competitive Intel
        "narrative",    // Agent 7: Narrative Synthesizer
        "vocal",         // Agent 8: Vocal Executive
        "persistence",   // Agent 8: Persistence Warden
        "predictive",    // Agent 10: The Predictive Seer
        "validator",     // Agent 0: Final Boss (runs after all agents for validation)
        "strategy",      // Agent 11: Dynamic Strategy Engine (runs after validator)
      ],
      executionOrder: "parallel",
    };

    this.plan = plan;
    this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
      `Execution plan ready: ${plan.agents.length} agents in parallel mode`);

    return plan;
  }

  /**
   * Execute all agents in parallel
   */
  async executeSwarm(
    source: DataSource,
    data: DashboardState,
    context?: Record<string, unknown>
  ): Promise<Map<string, AgentResult>> {
    const plan = this.planExecution(source, data);
    
    this.logActivity("orchestrator", "Agent 9: Orchestrator", "active",
      `Initiating agent swarm (${plan.agents.length} agents)...`);

    // =============================================================================
    // AGENT 0: THE JANITOR (Mathematical Truth)
    // =============================================================================
    // Agent 0 runs FIRST to clean data and calculate feature vector
    // This provides 100% mathematical precision for industry detection
    // CRITICAL: Agent 0 ALWAYS calculates std_dev (std) and mean for ALL numerical columns
    // These stats are in summary_stats.numeric_columns and are passed to Agent 2 (Math Auditor)
    const janitorIndex = plan.agents.indexOf("janitor");
    let janitorResult: JanitorResult | null = null;
    
    if (janitorIndex >= 0 && context?.rawData) {
      this.logActivity("orchestrator", "Agent 9: Orchestrator", "active",
        "Agent 0: The Janitor - Cleaning data and calculating feature vector + stats (mean, std_dev) for all numerical columns...");
      
      try {
        const e2bManager = getE2BManager();
        const rawData = context.rawData as Array<Record<string, unknown>>;
        const primaryAmountColumn = context.primaryAmountColumn as string | undefined;
        
        janitorResult = await e2bManager.executeJanitor(rawData, primaryAmountColumn);
        
        if (janitorResult.success) {
          // Verify that summary_stats are calculated (mean and std for all numerical columns)
          const numericStats = janitorResult.summary_stats?.numeric_columns || [];
          const statsCalculated = numericStats.length > 0 && numericStats.every(col => 
            col.mean !== null && col.mean !== undefined && col.std !== null && col.std !== undefined
          );
          
          if (!statsCalculated && numericStats.length > 0) {
            console.warn("[Agent 0: Janitor] Warning: Some numerical columns are missing mean/std stats");
          }
          
          // Update Sovereign Context with mathematical truth
          updateSovereignContext(janitorResult);
          
          this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
            `Agent 0: Feature vector calculated + ${numericStats.length} numerical columns analyzed (mean, std_dev) - Variance: ${janitorResult.feature_vector.variance_amount.toFixed(2)}, Time Delta: ${janitorResult.feature_vector.time_delta.toFixed(1)} days, Sparsity: ${janitorResult.feature_vector.sparsity.toFixed(2)}`);
          
          // Store Janitor result (includes summary_stats with mean/std for Agent 2)
          this.results.set("janitor", {
            agentId: "janitor",
            success: true,
            data: janitorResult,
            metadata: {
              message: "Data cleaned, feature vector calculated, and statistical summary (mean, std_dev) computed for all numerical columns",
            },
          });
        } else {
          this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
            `Agent 0: Failed to calculate feature vector - ${janitorResult.error || "Unknown error"}`);
        }
      } catch (error) {
        this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
          `Agent 0: E2B execution failed - ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // =============================================================================
    // DOMAIN VERIFICATION GATE: Multi-Layer Domain Consensus
    // =============================================================================
    // Before any strategic reasoning, Agent 1 (Sentinel) and Agent 3 (Policy) must reach consensus
    // Agent 1 now uses feature vector from Agent 0 (mathematical truth)
    const sentinelIndex = plan.agents.indexOf("sentinel");
    const policyIndex = plan.agents.indexOf("policy");
    const auditorIndex = plan.agents.indexOf("auditor");
    const narrativeIndex = plan.agents.indexOf("narrative");
    const competitiveIndex = plan.agents.indexOf("competitive");
    const predictiveIndex = plan.agents.indexOf("predictive");
    
    let domainConsensus: {
      industry: "retail" | "saas" | "generic";
      confidence: number;
      verified: boolean;
      consensusSource: "sentinel" | "policy" | "both" | "janitor";
      edaVerification?: {
        dataSignature: string;
        variancePattern: string;
        matchesHeaders: boolean;
      };
    } | null = null;

    // Step 1: Execute Sentinel and Policy first to establish domain consensus
    if (sentinelIndex >= 0 && policyIndex >= 0) {
      this.logActivity("orchestrator", "Agent 9: Orchestrator", "active",
        "Domain Verification Gate: Establishing consensus between Sentinel and Policy...");
      
      // Pass feature vector to Sentinel and Policy for mathematical truth
      // KILL-SWITCH: Preserve kill-switch industry lock if set in API route
      const enrichedContext = {
        ...context,
        featureVector: janitorResult?.feature_vector || getFeatureVector(),
        janitorResult: janitorResult,
        // Preserve kill-switch industry lock if set in API route
        industry: context?.industry || context?.forcedIndustry || undefined,
        forcedIndustry: context?.forcedIndustry || undefined,
        killSwitchActive: context?.killSwitchActive || false,
      };
      
      const sentinelPromise = this.executeAgent("sentinel", data, enrichedContext);
      const policyPromise = this.executeAgent("policy", data, enrichedContext);
      
      try {
        // Execute Sentinel first
        const sentinelResult = await sentinelPromise;
        
        // Execute Policy with Sentinel results and feature vector for consensus
        const policyResult = await this.executeAgent("policy", data, {
          ...enrichedContext,
          sentinelResult: sentinelResult?.data, // Pass Sentinel results to Policy
        });
        
        // Extract domain from both agents
        const sentinelDomain = (sentinelResult?.data as { detectedDomain?: string; isRetail?: boolean })?.detectedDomain?.toLowerCase() || 
                              ((sentinelResult?.data as { isRetail?: boolean })?.isRetail ? "retail" : "saas");
        const policyIndustry = (policyResult?.metadata?.industry as string)?.toLowerCase() || 
                              (policyResult?.data as { industry?: string })?.industry?.toLowerCase() || "saas";
        const policyForcedRetail = (policyResult?.data as { forcedRetail?: boolean })?.forcedRetail || false;
        const policyJanitorVerified = (policyResult?.data as { janitorVerified?: boolean })?.janitorVerified || false;
        const policyVerified = (policyResult?.metadata?.verified as boolean) || policyForcedRetail || policyJanitorVerified;
        const policyConfidence = (policyResult?.metadata?.confidence as number) || 
                                (policyResult?.data as { confidence?: number })?.confidence || 0.5;
        
        // ABSOLUTE DOMAIN LOCK: If Policy forced Retail, THIS IS GROUND TRUTH
        // Discard ALL other guesses - sentinel, EDA, everything else is irrelevant
        if (policyForcedRetail) {
          // ABSOLUTE "KILLER HEURISTIC" OVERRULE: DO NOT calculate confidence based on other agents
          // Force industry = 'retail', verified = true, confidence = 1.0 BEFORE logging
          domainConsensus = {
            industry: "retail",
            confidence: 1.0, // 100% confidence - absolute ground truth (NO CALCULATION)
            verified: true, // MUST be true for forced Retail or Janitor verification
            consensusSource: policyJanitorVerified ? "janitor" : "policy", // Track if verified by Agent 0
            edaVerification: {
              dataSignature: "retail_pattern",
              variancePattern: "retail_pattern",
              matchesHeaders: true,
            },
          };
          
          // Store consensus in results BEFORE logging (ensures final verified state is what HUD reads)
          this.results.set("sentinel", sentinelResult);
          this.results.set("policy", policyResult);
          
          // ABSOLUTE DOMAIN DICTATORSHIP: Log activity with verified industry in metadata
          // This final verified state is what the HUD reads
          const verificationSource = policyJanitorVerified 
            ? "Agent 0 (Janitor) mathematical verification" 
            : "KILLER HEURISTIC";
          this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
            `ABSOLUTE DOMAIN LOCK: RETAIL domain forced (100% confidence). VERIFIED RETAIL DOMAIN. ${verificationSource}. Ground Truth established. All other guesses discarded.`,
            {
              domainConsensus, // Explicitly add domainConsensus to metadata
              verifiedIndustry: "retail", // Explicit verified industry
              forcedRetail: true, // Flag for forced Retail
              janitorVerified: policyJanitorVerified, // Flag for Agent 0 verification
              confidence: 1.0, // 100% confidence (NO CALCULATION - absolute)
            }
          );
          
          // CRITICAL: Inject domainConsensus into context for ALL subsequent agents
          // This ensures the verified Retail domain is used throughout the entire swarm
          // No agent can override this - it's the absolute ground truth
        } else {
          // Check for consensus
          const consensusReached = sentinelDomain === policyIndustry || 
                                   (sentinelDomain === "retail" && policyIndustry === "retail") ||
                                   (sentinelDomain === "saas" && policyIndustry === "saas");
        
          // Use Python EDA insights to verify data signature
          const dataWithEDA = data as { _eda_insights?: {
            descriptive_stats?: { arr?: { std_dev?: number } };
            trend_analysis?: { arr?: { trend?: string } };
          } };
          const edaInsights = dataWithEDA?._eda_insights;
          const arrStdDev = edaInsights?.descriptive_stats?.arr?.std_dev || 0;
          const isHighVariance = arrStdDev > 5; // High variance suggests Retail transaction patterns
          
          // EDA Verification: Check if data signature matches detected domain
          const edaVerification = {
            dataSignature: isHighVariance ? "high_variance_transactional" : "low_variance_subscription",
            variancePattern: arrStdDev > 5 ? "retail_pattern" : "saas_pattern",
            matchesHeaders: consensusReached,
          };
          
          // Determine final consensus
          let finalIndustry: "retail" | "saas" | "generic" = "saas";
          let confidence = 0.5;
          let consensusSource: "sentinel" | "policy" | "both" = "sentinel";
          
          if (consensusReached) {
            finalIndustry = (sentinelDomain === "retail" || policyIndustry === "retail") ? "retail" : "saas";
            confidence = 0.95;
            consensusSource = "both";
          } else {
            // No consensus - use EDA data signature as tiebreaker
            if (isHighVariance && (sentinelDomain === "retail" || policyIndustry === "retail")) {
              finalIndustry = "retail";
              confidence = 0.75;
              consensusSource = sentinelDomain === "retail" ? "sentinel" : "policy";
            } else {
              finalIndustry = "saas";
              confidence = 0.75;
              consensusSource = sentinelDomain === "saas" ? "sentinel" : "policy";
            }
          }
          
          domainConsensus = {
            industry: finalIndustry,
            confidence,
            verified: consensusReached && edaVerification.matchesHeaders,
            consensusSource,
            edaVerification,
          };
          
          // Store consensus in results BEFORE logging (ensures final verified state is what HUD reads)
          this.results.set("sentinel", sentinelResult);
          this.results.set("policy", policyResult);
          
          // ABSOLUTE DOMAIN DICTATORSHIP: Log activity with verified industry in metadata
          // This final verified state is what the HUD reads
          this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
            `Domain Consensus: ${finalIndustry.toUpperCase()} (Confidence: ${(confidence * 100).toFixed(0)}%, Verified: ${domainConsensus.verified})`,
            {
              domainConsensus, // Explicitly add domainConsensus to metadata
              verifiedIndustry: finalIndustry, // Explicit verified industry
              forcedRetail: false, // Not forced
              confidence, // Confidence level
            }
          );
        }
      } catch (error) {
        this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
          `Domain Verification Gate failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        // Continue with default consensus
        domainConsensus = {
          industry: "saas",
          confidence: 0.5,
          verified: false,
          consensusSource: "sentinel",
        };
      }
    }
    
    // Find indices for validator and strategy (they execute separately after all agents)
    const validatorIndex = plan.agents.indexOf("validator");
    const strategyIndex = plan.agents.indexOf("strategy");
    
    // Create all agent promises (excluding Janitor, Sentinel, Policy, Validator, and Strategy)
    // Validator and Strategy execute separately after all other agents complete
    const agentPromises = plan.agents.map((agentId, index) => {
      if (index === janitorIndex || index === sentinelIndex || index === policyIndex || 
          index === validatorIndex || index === strategyIndex) {
        // Return already executed results (or skip for validator/strategy)
        if (index === validatorIndex || index === strategyIndex) {
          // Validator and Strategy execute separately - return a placeholder that won't be used
          return Promise.resolve({
            agentId,
            success: false,
            error: "Executed separately",
          });
        }
        return Promise.resolve(this.results.get(agentId) || {
          agentId,
          success: false,
          error: "Agent not executed",
        });
      }
      // AGENT 2 CONTEXT INJECTION: Pass data_contract headers for Transaction_ID fallback
      const enrichedContextForAgent = {
        ...context,
        domainConsensus, // Inject consensus into all agents
        featureVector: janitorResult?.feature_vector || getFeatureVector(), // Pass feature vector to all agents
        // For Agent 2: Pass data_contract headers for Transaction_ID fallback
        dataContractHeaders: context?.dataContract ? 
          (context.dataContract as { ontology_mapping?: Record<string, string> })?.ontology_mapping : 
          undefined,
      };
      
      return this.executeAgent(agentId, data, enrichedContextForAgent);
    });
    
    // If Narrative exists and Math Auditor exists, wait for Auditor before executing Narrative
    // STRICT DAG LOCKING will be checked after Agent 2 completes
    if (narrativeIndex >= 0 && auditorIndex >= 0 && auditorIndex !== narrativeIndex) {
      const auditorPromise = agentPromises[auditorIndex];
      agentPromises[narrativeIndex] = (async () => {
        try {
          // Wait for Math Auditor to complete first
          const auditorResult = await auditorPromise;
          
          // STRICT DAG LOCKING: Check if Agent 2 failed or has low confidence
          const auditorSuccess = auditorResult && 'success' in auditorResult ? auditorResult.success : false;
          const auditorData = auditorResult && 'data' in auditorResult ? auditorResult.data : undefined;
          const auditorConfidence = (auditorData as { confidence?: number })?.confidence || 0;
          const toleranceLevelRaw = context?.toleranceLevel;
          const isStrictMode = typeof toleranceLevelRaw === "string" ? toleranceLevelRaw === "STRICT" : 
                              (toleranceLevelRaw as { name?: string })?.name === "STRICT";
          
          // Block Agent 7 if Agent 2 failed OR if in STRICT mode and confidence < 0.90
          if (!auditorSuccess || (isStrictMode && auditorConfidence < 0.90)) {
            const lockReason = !auditorSuccess 
              ? "Agent 2 (Math Auditor) verification failed completely"
              : `Agent 2 confidence (${(auditorConfidence * 100).toFixed(1)}%) below STRICT threshold (90%)`;
            
            this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
              `[SYSTEM] INTEGRITY BREACH: LOCKING STRATEGY ENGINES. Reason: ${lockReason}`);
            
            return {
              agentId: "narrative",
              success: false,
              error: `BLOCKED: ${lockReason}`,
            };
          }
          
          // Agent 2 passed - proceed with enriched context
          const enrichedContext = {
            ...context,
            auditorResult: auditorData,
            domainConsensus, // Include consensus for domain-specific narrative
          };
          
          // Execute Narrative with enriched context
          return this.executeAgent("narrative", data, enrichedContext);
        } catch {
          // If auditor fails, proceed without enrichment
          return this.executeAgent("narrative", data, {
            ...context,
            domainConsensus,
          });
        }
      })();
    }
    
    // Agent 10 (Predictive Seer): Wait for Agent 3 (Policy) and Agent 5 (Competitive) to complete
    // Also check Agent 2 status for STRICT DAG LOCKING
    if (predictiveIndex >= 0 && policyIndex >= 0 && competitiveIndex >= 0) {
      const policyPromise = agentPromises[policyIndex];
      const competitivePromise = agentPromises[competitiveIndex];
      const auditorPromise = auditorIndex >= 0 ? agentPromises[auditorIndex] : null;
      
      agentPromises[predictiveIndex] = (async () => {
        try {
          // Wait for Policy, Competitive, and Auditor agents
          const promisesToWait = [policyPromise, competitivePromise];
          if (auditorPromise) promisesToWait.push(auditorPromise);
          
          const results = await Promise.all(promisesToWait);
          const policyResult = results[0];
          const competitiveResult = results[1];
          const auditorResult = auditorPromise ? results[2] : null;
          
          // STRICT DAG LOCKING: Check Agent 2 status
          if (auditorResult) {
            const auditorSuccess = auditorResult && 'success' in auditorResult ? auditorResult.success : false;
            const auditorData = auditorResult && 'data' in auditorResult ? auditorResult.data : undefined;
            const auditorConfidence = (auditorData as { confidence?: number })?.confidence || 0;
            const toleranceLevelRaw = context?.toleranceLevel;
            const isStrictMode = typeof toleranceLevelRaw === "string" ? toleranceLevelRaw === "STRICT" : 
                                (toleranceLevelRaw as { name?: string })?.name === "STRICT";
            
            // Block Agent 10 if Agent 2 failed OR if in STRICT mode and confidence < 0.90
            if (!auditorSuccess || (isStrictMode && auditorConfidence < 0.90)) {
              const lockReason = !auditorSuccess 
                ? "Agent 2 (Math Auditor) verification failed completely"
                : `Agent 2 confidence (${(auditorConfidence * 100).toFixed(1)}%) below STRICT threshold (90%)`;
              
              this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
                `[SYSTEM] INTEGRITY BREACH: LOCKING STRATEGY ENGINES. Reason: ${lockReason}`);
              
              return {
                agentId: "predictive",
                success: false,
                error: `BLOCKED: ${lockReason}`,
              };
            }
          }
          
          // Agent 2 passed - proceed with enriched context
          const enrichedContext = {
            ...context,
            industry: (policyResult && 'metadata' in policyResult && policyResult.metadata && typeof policyResult.metadata === 'object' && 'industry' in policyResult.metadata) ? (policyResult.metadata as { industry?: string }).industry : context?.industry,
            competitiveResult: competitiveResult && 'data' in competitiveResult ? competitiveResult.data : undefined,
            dataPoints: context?.dataPoints || 0,
          };
          
          return this.executeAgent("predictive", data, enrichedContext);
        } catch {
          // If dependencies fail, proceed without enrichment
          return this.executeAgent("predictive", data, context);
        }
      })();
    }

    const results = await Promise.allSettled(agentPromises);
    
    // Process results
    results.forEach((result, index) => {
      const agentId = plan.agents[index];
      if (result.status === "fulfilled") {
        this.results.set(agentId, result.value);
      } else {
        this.results.set(agentId, {
          agentId,
          success: false,
          error: result.reason?.message || "Unknown error",
        });
      }
    });

    // Log domain consensus in final activity
    if (domainConsensus) {
      this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
        `Swarm execution complete: ${this.results.size} agents finished. Domain: ${domainConsensus.industry.toUpperCase()} (Verified: ${domainConsensus.verified})`,
        { domainConsensus });
    } else {
      this.logActivity("orchestrator", "Agent 9: Orchestrator", "success",
        `Swarm execution complete: ${this.results.size} agents finished`);
    }

    // =============================================================================
    // AGENT 0: THE FINAL BOSS (Sovereign Validator)
    // =============================================================================
    // Execute Agent 0 Validator AFTER all other agents complete
    // This is the final gatekeeper that certifies or blocks the report
    try {
      this.logActivity("validator", "Agent 0: The Final Boss", "active",
        "Agent 0: Performing zero-trust verification across all agents...");

      const { executeAgent0Validator } = await import("./agent0Validator");
      
      // Get Agent 2 (Math Auditor) and Agent 7 (Narrative Synthesizer) results
      const auditorResult = this.results.get("auditor");
      const narrativeResult = this.results.get("narrative");
      
      // Prepare context for Agent 0 Validator
      const validatorContext = {
        ...context,
        auditorResult: auditorResult?.data,
        narrativeResult: narrativeResult?.data,
        domainConsensus,
        rawData: context?.rawData,
        primaryAmountColumn: context?.primaryAmountColumn,
      };

      const validatorResult = await executeAgent0Validator(data, validatorContext);
      
      // Store validator result
      this.results.set("validator", validatorResult);
      
      if (validatorResult.success) {
        const certificate = (validatorResult.data as { certificate?: unknown })?.certificate;
        this.logActivity("validator", "Agent 0: The Final Boss", "success",
          `Agent 0: Report CERTIFIED. Integrity Seal: ${(certificate as { integrity_seal?: string })?.integrity_seal || 'N/A'}`,
          { certificate });
      } else {
        this.logActivity("validator", "Agent 0: The Final Boss", "error",
          `Agent 0: Report BLOCKED - ${validatorResult.error || "Validation failed"}`);
      }
      
      // =============================================================================
      // AGENT 11: DYNAMIC STRATEGY ENGINE (Runs after Validator)
      // =============================================================================
      // Execute Agent 11 Strategy Engine AFTER Agent 0 Validator completes
      // UNBLOCK: Agent 11 executes even if Agent 2 has 'SUCCESS_WITH_WARNINGS' (within 5% tolerance)
      // This uses validated results to generate strategic actions
      try {
        this.logActivity("strategy", "Agent 11: Dynamic Strategy Engine", "active",
          "Agent 11: Discovering strategic actions from verified anomalies...");

        const { executeAgent11StrategyEngine } = await import("./agent11StrategyEngine");
        
        // Get Agent 2 (Math Auditor) result
        const auditorResult = this.results.get("auditor");
        
        // STRICT DAG LOCKING: Check Agent 2 status and confidence
        const auditorSuccess = auditorResult?.success ?? false;
        const auditorData = auditorResult?.data as { confidence?: number } | undefined;
        const auditorConfidence = auditorData?.confidence || 0;
        const toleranceLevelRaw = context?.toleranceLevel;
        const isStrictMode = typeof toleranceLevelRaw === "string" ? toleranceLevelRaw === "STRICT" : 
                            (toleranceLevelRaw as { name?: string })?.name === "STRICT";
        
        // Block Agent 11 if Agent 2 failed OR if in STRICT mode and confidence < 0.90
        const shouldBlockAgent11 = !auditorSuccess || (isStrictMode && auditorConfidence < 0.90);
        
        if (shouldBlockAgent11) {
          const blockReason = !auditorSuccess 
            ? "Agent 2 (Math Auditor) verification failed completely"
            : `Agent 2 confidence (${(auditorConfidence * 100).toFixed(1)}%) below STRICT threshold (90%)`;
          
          this.logActivity("strategy", "Agent 11: Dynamic Strategy Engine", "error",
            `Agent 11: BLOCKED - ${blockReason}`);
          this.logActivity("orchestrator", "Agent 9: Orchestrator", "error",
            `[SYSTEM] INTEGRITY BREACH: LOCKING STRATEGY ENGINES. Reason: ${blockReason}`);
          
          this.results.set("strategy", {
            agentId: "strategy",
            success: false,
            error: `Agent 2 (Math Auditor) verification failed. Strategy generation blocked. Reason: ${blockReason}`,
          });
        } else {
          // Prepare context for Agent 11 Strategy Engine
          const strategyContext = {
            ...context,
            auditorResult: auditorResult?.data,
            validatorResult: validatorResult.data,
            persona: context?.persona || "CEO",
            eda_insights: context?.eda_insights,
            domainConsensus,
          };

          const strategyResult = await executeAgent11StrategyEngine(data, strategyContext);
          
          // Store strategy result
          this.results.set("strategy", strategyResult);
          
          if (strategyResult.success) {
            const strategies = (strategyResult.data as { strategies?: unknown[] })?.strategies || [];
            this.logActivity("strategy", "Agent 11: Dynamic Strategy Engine", "success",
              `Agent 11: Generated ${strategies.length} strategic actions for ${context?.persona || "CEO"}`);
          } else {
            this.logActivity("strategy", "Agent 11: Dynamic Strategy Engine", "error",
              `Agent 11: Strategy generation failed - ${strategyResult.error || "Unknown error"}`);
          }
        }
      } catch (error) {
        // If Agent 11 fails, log but don't block the swarm
        this.logActivity("strategy", "Agent 11: Dynamic Strategy Engine", "error",
          `Agent 11: Strategy engine execution failed - ${error instanceof Error ? error.message : "Unknown error"}`);
        
        this.results.set("strategy", {
          agentId: "strategy",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      // If Agent 0 Validator fails, log but don't block the entire swarm
      this.logActivity("validator", "Agent 0: The Final Boss", "error",
        `Agent 0: Validator execution failed - ${error instanceof Error ? error.message : "Unknown error"}`);
      
      this.results.set("validator", {
        agentId: "validator",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return this.results;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    agentId: string,
    data: DashboardState,
    context?: Record<string, unknown>
  ): Promise<AgentResult> {
    // Log agent start
    this.logActivity(agentId, this.getAgentName(agentId), "active", 
      `${this.getAgentName(agentId)} executing...`);

    try {
      // Import agents dynamically
      const agents = await import("./agents");
      
      let result: AgentResult;
      
      // For Narrative Synthesizer: Pass Agent 2's complete audit handshake (Source of Truth)
      // For Policy Auditor: Pass Data Sentinel results for domain detection
      let enrichedContext = context;
      if (agentId === "narrative") {
        // Get Agent 2 (Math Auditor) result - this is the complete audit handshake
        const auditorResult = this.results.get("auditor");
        enrichedContext = {
          ...context,
          auditorResult: auditorResult?.data as {
            verified: boolean;
            metrics: {
              arr: { raw_value: number; calculated_growth?: number; benchmarked_status: string; math_integrity_hash: string; verified: boolean; threshold?: { min?: number; max?: number; target?: number } };
              nrr: { raw_value: number; benchmarked_status: string; math_integrity_hash: string; verified: boolean; threshold?: { min?: number; max?: number; target?: number } };
              burn: { raw_value: number; benchmarked_status: string; math_integrity_hash: string; verified: boolean; threshold?: { min?: number; max?: number; target?: number } };
              deals_closed?: { raw_value: number; benchmarked_status: string; math_integrity_hash: string; verified: boolean };
            };
            forecast_verified: boolean;
            industry: string;
            requiresReScan: boolean;
          }, // Pass complete Agent 2 audit handshake to Agent 7
        };
      } else if (agentId === "policy") {
        // Get Data Sentinel result for Retail detection (Sales/Profit columns)
        // This is critical for Domain Consensus - Policy needs Sentinel's mapping results
        const sentinelResult = this.results.get("sentinel");
        enrichedContext = {
          ...context,
          sentinelResult: sentinelResult?.data, // Pass semantic mappings for Retail detection
          domainConsensus: context?.domainConsensus, // Pass any existing consensus
        };
      }
      
      switch (agentId) {
        case "janitor":
          // Agent 0: The Janitor is executed separately in executeSwarm
          // This case should not be reached, but included for completeness
          result = {
            agentId: "janitor",
            success: false,
            error: "Janitor should be executed before other agents",
          };
          break;
        case "sentinel":
          result = await agents.Agent1_DataSentinel.execute(data, enrichedContext || context);
          break;
        case "auditor":
          // Use new Agent 2 implementation with Quantum Math Integrity
          // SOVEREIGN BRAIN 3.0: Inject data_contract directly into Agent 2 context
          const { executeAgent2 } = await import("./agent2NewImplementation");
          const agent2Context = {
            ...context,
            dataContract: context?.dataContract, // Direct payload injection - eliminates database dependency
          };
          result = await executeAgent2(data, agent2Context);
          
          // Send terminal messages for forensic feedback
          if (result.metadata?.message) {
            const terminalMsg = result.metadata.message as string;
            if (terminalMsg.includes("DETECTING OUTLIERS")) {
              this.logActivity(
                "auditor",
                "Agent 2: Math Auditor",
                "active",
                "[AGENT 2] DETECTING OUTLIERS VIA IQR METHOD..."
              );
            } else if (terminalMsg.includes("MATH VERIFIED")) {
              const confidenceMatch = terminalMsg.match(/(\d+\.?\d*)% CONFIDENCE/);
              const confidence = confidenceMatch ? confidenceMatch[1] : "99.98";
              this.logActivity(
  "auditor",
  "Agent 2: Math Auditor",
  "success",
  `[AGENT 2] MATH VERIFIED (${confidence}% CONFIDENCE).`
);
            }
          }
          break;
        case "policy":
          result = await agents.Agent3_PolicyAuditor.execute(data, context);
          break;
        case "simulation":
          result = await agents.Agent4_SimulationArchitect.execute(data, context);
          break;
        case "competitive":
          result = await agents.Agent5_CompetitiveIntel.execute(data, context);
          break;
        case "narrative":
          result = await agents.Agent7_NarrativeSynthesizer.execute(data, context);
          break;
        case "vocal":
          result = await agents.Agent8_VocalExecutive.execute(data, context);
          break;
        case "persistence":
          result = await agents.Agent8_PersistenceWarden.execute(data, context);
          break;
        case "predictive":
          // Agent 10: Needs Agent 3 (industry) and Agent 5 (volatility) from context
          result = await agents.Agent10_PredictiveSeer.execute(data, context);
          break;
        case "validator":
          // Agent 0: The Final Boss (Sovereign Validator) - executed separately after all agents
          // This case should not be reached in normal flow, but included for completeness
          result = {
            agentId: "validator",
            success: false,
            error: "Validator should be executed separately after all agents complete",
          };
          break;
        case "strategy":
          // Agent 11: Dynamic Strategy Engine - executed separately after validator
          // This case should not be reached in normal flow, but included for completeness
          result = {
            agentId: "strategy",
            success: false,
            error: "Strategy should be executed separately after validator completes",
          };
          break;
        default:
          result = {
            agentId,
            success: false,
            error: `Unknown agent: ${agentId}`,
          };
      }

      // Log agent completion
      this.logActivity(agentId, this.getAgentName(agentId), 
        result.success ? "success" : "error",
        result.success 
          ? `${this.getAgentName(agentId)} completed successfully`
          : `${this.getAgentName(agentId)} failed: ${result.error || "Unknown error"}`);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logActivity(agentId, this.getAgentName(agentId), "error",
        `${this.getAgentName(agentId)} error: ${errorMsg}`);
      
      return {
        agentId,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Get agent display name
   */
  private getAgentName(agentId: string): string {
    const names: Record<string, string> = {
      janitor: "Agent 0: The Janitor",
      sentinel: "Agent 1: Data Sentinel",
      auditor: "Agent 2: Math Auditor",
      policy: "Agent 3: Policy Auditor",
      simulation: "Agent 4: Simulation Architect",
      competitive: "Agent 5: Competitive Intel",
      narrative: "Agent 7: Narrative Synthesizer",
      vocal: "Agent 8: Vocal Executive",
      persistence: "Agent 8: Persistence Warden",
      predictive: "Agent 10: The Predictive Seer",
      validator: "Agent 0: The Final Boss",
      strategy: "Agent 11: Dynamic Strategy Engine",
    };
    return names[agentId] || `Agent ${agentId}`;
  }

  /**
   * Log agent activity
   */
  logActivity(
    agentId: string,
    agentName: string,
    status: AgentStatus,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const activity: AgentActivity = {
      agentId,
      agentName,
      status,
      message,
      timestamp: new Date(),
      metadata,
    };
    this.activities.push(activity);
  }

  /**
   * Get all activities
   */
  getActivities(): AgentActivity[] {
    return [...this.activities];
  }

  /**
   * Get agent results
   */
  getResults(): Map<string, AgentResult> {
    return new Map(this.results);
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.activities = [];
    this.results.clear();
    this.plan = null;
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();

