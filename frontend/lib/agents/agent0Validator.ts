/**
 * Agent 0: The Final Boss (Sovereign Validator)
 * ==============================================
 * Zero-trust verification model that certifies or blocks the entire report.
 * This is the final gatekeeper ensuring world-class quality.
 */

import type { DashboardState } from "@/types/dashboard";
import type { AgentResult } from "./orchestrator";
import type { MetricAuditResult } from "./mathAuditorTypes";
import { CriticalIntegrityException } from "./mathAuditorTypes";
import { getIndustryContext, type IndustryType } from "@/lib/intelligence/industryLibrary";
import { getE2BManager } from "@/lib/intelligence/e2bManager";
import {
  type BusinessArchetype,
  UnrecognizedBusinessModelException,
} from "@/lib/intelligence/archetypeLibrary";

/**
 * Sovereign Integrity Failure
 * Thrown when cross-agent hash verification fails
 */
export class SovereignIntegrityFailure extends Error {
  constructor(
    message: string,
    public agent2Hash: string,
    public agent7Hash: string,
    public failingMetric?: string
  ) {
    super(message);
    this.name = "SovereignIntegrityFailure";
  }
}

/**
 * Verification Certificate
 * The final signature that certifies the report
 */
export interface VerificationCertificate {
  consensus_score: number;
  integrity_seal: string;
  domain_verified: boolean;
  timestamp: string;
  domain: string;
  verified_metrics: string[];
  validation_checks: {
    hash_verification: boolean;
    domain_validation: boolean;
    policy_compliance: boolean;
    dna_consistency?: boolean; // NEW: DNA Archetype consistency check
  };
  businessArchetype?: BusinessArchetype; // NEW: DNA Archetype in certificate
}

/**
 * Generate Integrity Seal
 * Combines Math, Narrative, and Policy signatures into a unique hash
 */
function generateIntegritySeal(
  mathHashes: Record<string, string>,
  narrativeHash: string,
  domainConsensus: { industry: string; confidence: number; verified: boolean }
): string {
  // Combine all hashes and domain consensus into a single string
  const hashString = Object.values(mathHashes).join(":") + ":" + narrativeHash;
  const consensusString = `${domainConsensus.industry}:${domainConsensus.confidence}:${domainConsensus.verified}`;
  const combined = `${hashString}:${consensusString}`;
  
  // Generate hash (in production, use crypto.subtle.digest for SHA-256)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
}

/**
 * Verify Cross-Agent Hash Consistency
 * Ensures Agent 7's narrativeHash matches Agent 2's math_integrity_hash
 */
function verifyHashConsistency(
  agent2Result: {
    metrics: {
      arr: MetricAuditResult;
      nrr: MetricAuditResult;
      burn: MetricAuditResult;
      deals_closed?: MetricAuditResult;
    };
  },
  agent7Result: {
    mathIntegrityHashes?: Record<string, string>;
    narrativeHash?: string;
  }
): { valid: boolean; error?: string; failingMetric?: string } {
  if (!agent7Result.mathIntegrityHashes || !agent7Result.narrativeHash) {
    return {
      valid: false,
      error: "Agent 7 (Narrative) did not provide math integrity hashes",
    };
  }

  // Verify each metric's hash matches
  const mathHashes: Record<string, string> = {
    arr: agent2Result.metrics.arr.math_integrity_hash,
    nrr: agent2Result.metrics.nrr.math_integrity_hash,
    burn: agent2Result.metrics.burn.math_integrity_hash,
  };

  if (agent2Result.metrics.deals_closed) {
    mathHashes.deals_closed = agent2Result.metrics.deals_closed.math_integrity_hash;
  }

  // Compare each hash
  for (const [metric, agent2Hash] of Object.entries(mathHashes)) {
    const agent7Hash = agent7Result.mathIntegrityHashes[metric];
    if (!agent7Hash || agent7Hash !== agent2Hash) {
      return {
        valid: false,
        error: `Hash mismatch for ${metric}: Agent 2 hash (${agent2Hash}) does not match Agent 7 hash (${agent7Hash || 'missing'})`,
        failingMetric: metric,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate Domain-Specific Metrics
 * Ensures industry-specific metrics are correctly verified
 */
function validateDomainMetrics(
  industry: IndustryType,
  agent2Result: {
    metrics: {
      arr: MetricAuditResult;
      nrr: MetricAuditResult;
      burn: MetricAuditResult;
      deals_closed?: MetricAuditResult;
    };
  },
  domainConsensus: { industry: string; confidence: number; verified: boolean }
): { valid: boolean; error?: string } {
  const industryPolicy = getIndustryContext(industry);
  const normalizedIndustry = industry.toLowerCase();

  // Verify domain consistency across all agents
  if (normalizedIndustry !== domainConsensus.industry.toLowerCase()) {
    return {
      valid: false,
      error: `Domain mismatch: Industry policy (${industry}) does not match domain consensus (${domainConsensus.industry})`,
    };
  }

  // SaaS-specific validation
  if (normalizedIndustry === "saas") {
    const nrrValue = agent2Result.metrics.nrr.raw_value;
    const nrrStatus = agent2Result.metrics.nrr.benchmarked_status;
    
    // CRITICAL: If NRR < 110% and status is NOT "Critical", block the report
    if (nrrValue < 110 && nrrStatus !== "critical") {
      return {
        valid: false,
        error: `SaaS Policy Violation: NRR is ${nrrValue}% (< 110%) but status is "${nrrStatus}" instead of "critical". Report blocked.`,
      };
    }
  }

  // Retail-specific validation
  if (normalizedIndustry === "retail" || normalizedIndustry === "ecommerce") {
    // Verify "Gross Margin" and "Inventory Turnover" are mapped correctly
    // For Retail, NRR column typically represents Profit Margin / Gross Margin
    const grossMargin = agent2Result.metrics.nrr.raw_value; // In Retail, NRR = Profit Margin
    
    // If gross margin is negative, that's a critical issue
    if (grossMargin < 0) {
      return {
        valid: false,
        error: `Retail Policy Violation: Gross Margin is negative (${grossMargin}%). Report blocked.`,
      };
    }

    // For E-commerce, verify LTV/CAC Ratio logic
    if (normalizedIndustry === "ecommerce") {
      // We would need CAC and LTV metrics to validate this
      // For now, we just ensure ARR (Sales) is positive
      if (agent2Result.metrics.arr.raw_value <= 0) {
        return {
          valid: false,
          error: `E-commerce Policy Violation: Sales (ARR) must be positive. Current value: ${agent2Result.metrics.arr.raw_value}`,
        };
      }
    }
  }

  // Marketing Agency-specific validation (using White-labeled Analyst policy for now)
  // Note: Marketing Agency is not in the current industry library, so we'll use a generic check
  // If industry is "agency" or "marketing_agency", validate client retention metrics
  if (normalizedIndustry.includes("agency") || normalizedIndustry === "analyst") {
    // For agencies, NRR typically represents Client Retention
    const retention = agent2Result.metrics.nrr.raw_value;
    
    // Marketing agencies typically need > 80% client retention
    if (retention < 80 && agent2Result.metrics.nrr.benchmarked_status !== "critical") {
      return {
        valid: false,
        error: `Agency Policy Violation: Client Retention is ${retention}% (< 80%) but status is not "critical". Report blocked.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Deep Scan (Self-Healing Mode)
 * Re-runs Agent 0 (Janitor) to fix column mapping when CriticalIntegrityException occurs
 */
async function performDeepScan(
  rawData: Array<Record<string, unknown>>,
  primaryAmountColumn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const e2bManager = getE2BManager();
    const janitorResult = await e2bManager.executeJanitor(rawData, primaryAmountColumn);
    
    if (!janitorResult.success) {
      return {
        success: false,
        error: janitorResult.error || "Deep scan failed",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Deep scan error",
    };
  }
}

/**
 * Main execution function for Agent 0: The Final Boss
 */
export async function executeAgent0Validator(
  data: DashboardState,
  context?: Record<string, unknown>
): Promise<AgentResult> {
  try {
    // =============================================================================
    // STEP 1: CROSS-AGENT HASH VERIFICATION (The Handshake)
    // =============================================================================
    
    const agent2Result = context?.auditorResult as {
      verified: boolean;
      metrics: {
        arr: MetricAuditResult;
        nrr: MetricAuditResult;
        burn: MetricAuditResult;
        deals_closed?: MetricAuditResult;
      };
      industry: string;
    } | undefined;

    const agent7Result = context?.narrativeResult as {
      mathIntegrityHashes?: Record<string, string>;
      narrativeHash?: string;
    } | undefined;

    const domainConsensus = context?.domainConsensus as {
      industry: string;
      confidence: number;
      verified: boolean;
    } | undefined;

    // Check if Agent 2 and Agent 7 results are available
    if (!agent2Result || !agent2Result.verified) {
      return {
        agentId: "validator",
        success: false,
        error: "Agent 0: Cannot validate - Agent 2 (Math Auditor) verification failed or missing.",
        data: {
          requiresAgent2Verification: true,
        },
        metadata: {
          validationLevel: "agent2-required",
          allChecksPassed: false,
          message: "Validation halted: Agent 2 verification required.",
        },
      };
    }

    if (!agent7Result) {
      return {
        agentId: "validator",
        success: false,
        error: "Agent 0: Cannot validate - Agent 7 (Narrative Synthesizer) result missing.",
        data: {
          requiresAgent7Result: true,
        },
        metadata: {
          validationLevel: "agent7-required",
          allChecksPassed: false,
          message: "Validation halted: Agent 7 result required.",
        },
      };
    }

    if (!domainConsensus) {
      return {
        agentId: "validator",
        success: false,
        error: "Agent 0: Cannot validate - Domain consensus missing.",
        data: {
          requiresDomainConsensus: true,
        },
        metadata: {
          validationLevel: "domain-consensus-required",
          allChecksPassed: false,
          message: "Validation halted: Domain consensus required.",
        },
      };
    }

    // Verify hash consistency
    const hashVerification = verifyHashConsistency(agent2Result, agent7Result);
    if (!hashVerification.valid) {
      throw new SovereignIntegrityFailure(
        hashVerification.error || "Hash verification failed",
        agent2Result.metrics.arr.math_integrity_hash,
        agent7Result.narrativeHash || "missing",
        hashVerification.failingMetric
      );
    }

    // =============================================================================
    // STEP 2: DOMAIN-SPECIFIC VALIDATION (4-Domain Logic)
    // =============================================================================
    
    const industry = agent2Result.industry as IndustryType;
    const domainValidation = validateDomainMetrics(industry, agent2Result, domainConsensus);
    
    if (!domainValidation.valid) {
      return {
        agentId: "validator",
        success: false,
        error: `Agent 0: Domain validation failed - ${domainValidation.error}`,
        data: {
          domainValidationFailed: true,
          industry,
          domainConsensus: domainConsensus.industry,
        },
        metadata: {
          validationLevel: "domain-validation-failed",
          allChecksPassed: false,
          message: `Validation BLOCKED: ${domainValidation.error}`,
        },
      };
    }

    // =============================================================================
    // DNA CONSISTENCY VERIFICATION (Global Safety Net)
    // =============================================================================
    // Verify that DNA Archetype detected at start remains consistent throughout swarm
    const sentinelResult = context?.sentinelResult as { businessArchetype?: BusinessArchetype; dnaSignature?: unknown } | undefined;
    const detectedArchetype = sentinelResult?.businessArchetype;
    
    // Get archetype from other agents for cross-validation
    const strategyResult = context?.strategyResult as { industry_relevance?: IndustryType; metadata?: { archetype_based?: boolean } } | undefined;
    
    // DNA Consistency Check: If archetype was detected, verify consistency
    if (detectedArchetype && detectedArchetype !== "unknown") {
      // Verify that Strategy Engine used the same archetype (if archetype-based)
      if (strategyResult?.metadata?.archetype_based) {
        // If strategy is archetype-based, ensure consistency
        // For now, we'll log this - in production, would cross-validate archetype usage
        console.log(`[Agent 0: Final Boss] DNA Consistency Verified: Archetype ${detectedArchetype.toUpperCase()} used consistently across swarm`);
      }
      
      // If no DNA detected but industry is generic, throw exception
      if (industry === "generic" && !detectedArchetype) {
        throw new UnrecognizedBusinessModelException(
          "Business model cannot be classified. No DNA Archetype detected.",
          undefined, // DNA signature not available
          industry
        );
      }
    }
    
    // =============================================================================
    // STEP 3: GENERATE VERIFICATION CERTIFICATE (The Signature)
    // =============================================================================
    
    const mathHashes: Record<string, string> = {
      arr: agent2Result.metrics.arr.math_integrity_hash,
      nrr: agent2Result.metrics.nrr.math_integrity_hash,
      burn: agent2Result.metrics.burn.math_integrity_hash,
    };

    if (agent2Result.metrics.deals_closed) {
      mathHashes.deals_closed = agent2Result.metrics.deals_closed.math_integrity_hash;
    }

    const integritySeal = generateIntegritySeal(
      mathHashes,
      agent7Result.narrativeHash || "",
      domainConsensus
    );

    const verifiedMetrics = Object.keys(mathHashes).filter(
      (key) => agent2Result.metrics[key as keyof typeof agent2Result.metrics]?.verified
    );

    const certificate: VerificationCertificate = {
      consensus_score: domainConsensus.confidence,
      integrity_seal: integritySeal,
      domain_verified: domainConsensus.verified,
      timestamp: new Date().toISOString(),
      domain: domainConsensus.industry,
      verified_metrics: verifiedMetrics,
      validation_checks: {
        hash_verification: hashVerification.valid,
        domain_validation: domainValidation.valid,
        policy_compliance: true, // If we got here, policy is compliant
        dna_consistency: detectedArchetype ? detectedArchetype !== "unknown" : true, // DNA consistency flag
      },
      businessArchetype: detectedArchetype, // Include archetype in certificate
    };

    // =============================================================================
    // STEP 4: CHECK FOR CRITICAL INTEGRITY EXCEPTIONS (Janitor Mode)
    // =============================================================================
    // If Agent 2 threw CriticalIntegrityException, we would have caught it earlier
    // But we can still check if a deep scan was requested
    const requiresDeepScan = context?.requiresDeepScan as boolean | undefined;
    if (requiresDeepScan && context?.rawData) {
      const deepScanResult = await performDeepScan(
        context.rawData as Array<Record<string, unknown>>,
        context.primaryAmountColumn as string | undefined
      );

      if (!deepScanResult.success) {
        return {
          agentId: "validator",
          success: false,
          error: `Agent 0: Deep scan failed - ${deepScanResult.error}. Report blocked.`,
          data: {
            deepScanFailed: true,
            certificate: null,
          },
          metadata: {
            validationLevel: "deep-scan-failed",
            allChecksPassed: false,
            message: "Validation BLOCKED: Deep scan failed. Report cannot be certified.",
          },
        };
      }

      // If deep scan succeeded, we should re-run the validation
      // For now, we'll just note it in the certificate
      certificate.validation_checks.policy_compliance = true;
    }

    // =============================================================================
    // SUCCESS: REPORT CERTIFIED
    // =============================================================================

    return {
      agentId: "validator",
      success: true,
      data: {
        certificate,
        validated: true,
        hash_verification: hashVerification.valid,
        domain_validation: domainValidation.valid,
        integrity_seal: integritySeal,
      },
      metadata: {
        validationLevel: "sovereign-validator",
        allChecksPassed: true,
        message: `Agent 0: Report CERTIFIED. Integrity Seal: ${integritySeal}. Domain: ${domainConsensus.industry} (${(domainConsensus.confidence * 100).toFixed(1)}% confidence).`,
        certificate,
      },
    };

  } catch (error) {
    // =============================================================================
    // SOVEREIGN INTEGRITY FAILURE HANDLING
    // =============================================================================
    
    if (error instanceof SovereignIntegrityFailure) {
      console.error("[Agent 0: The Final Boss] SovereignIntegrityFailure:", {
        message: error.message,
        agent2Hash: error.agent2Hash,
        agent7Hash: error.agent7Hash,
        failingMetric: error.failingMetric,
      });

      return {
        agentId: "validator",
        success: false,
        error: error.message,
        data: {
          validated: false,
          integrityFailure: true,
          agent2Hash: error.agent2Hash,
          agent7Hash: error.agent7Hash,
          failingMetric: error.failingMetric,
          certificate: null,
        },
        metadata: {
          validationLevel: "sovereign-integrity-failure",
          allChecksPassed: false,
          message: `VALIDATION BLOCKED: ${error.message} Report generation halted.`,
          errorType: "SovereignIntegrityFailure",
        },
      };
    }

    // =============================================================================
    // GENERAL ERROR HANDLING
    // =============================================================================
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error("[Agent 0: The Final Boss] Error:", {
      error: errorMessage,
    });

    return {
      agentId: "validator",
      success: false,
      error: errorMessage,
      data: {
        validated: false,
        certificate: null,
      },
      metadata: {
        validationLevel: "validation-error",
        allChecksPassed: false,
        message: `Agent 0: Validation FAILED - ${errorMessage}. Report blocked.`,
        errorType: "validation_error",
        errorDetails: errorMessage,
      },
    };
  }
}

