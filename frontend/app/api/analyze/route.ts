/**
 * NeuraSight AI Analysis API (Evolved Brain)
 * ===========================================
 * Uses Gemini 1.5 Flash with dual-brain architecture:
 * - Left Brain: Metric definitions, targets, context
 * - Right Brain: Raw data analysis, trend spotting
 *
 * POST /api/analyze
 * Body: { sheetId?: string, data?: DashboardState, persona?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  fetchDashboardFromSheets,
  getMetricContext,
  getPolicyContext,
  evaluateAgainstPolicy,
  DEFAULT_DASHBOARD_DATA,
  type PolicyViolation,
} from "@/lib/googleSheets";
import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
interface AnalyzePayload {
  sheetId?: string;
  data?: Record<string, unknown>;
  persona?: string;
}

interface AnalysisResult {
  success: boolean;
  analysis?: string;
  executiveSummary?: string;
  riskAlerts?: string[];
  actionPlan?: string[];
  topRisk?: string;
  topOpportunity?: string;
  policyViolations?: PolicyViolation[];
  rawResponse?: string;
  error?: string;
  timestamp: string;
  isMockMode?: boolean;
  errorType?: "api_error" | "billing" | "verification" | "network" | "unknown";
}

// =============================================================================
// MOCK MODE CONFIGURATION (Production-Ready)
// =============================================================================
// In production, only use mock data if explicitly enabled or if API fails
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
const USE_MOCK_DATA = 
  !isProduction && (
    process.env.NEXT_PUBLIC_APP_ENV === "development" ||
    process.env.USE_MOCK_DATA === "true"
  ) || false; // Never use mock in production unless explicitly forced

// =============================================================================
// GEMINI CLIENT SETUP
// =============================================================================
const geminiApiKey = process.env.GEMINI_API_KEY;

// Model configuration - using verified accessible model with stable v1 API
const GEMINI_MODEL = "models/gemini-2.0-flash";

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!geminiApiKey) {
    console.warn("[NeuraSight Analyze] GEMINI_API_KEY not configured");
    return null;
  }
  // Initialize with API key - will force v1 API in getGenerativeModel call
  const client = new GoogleGenerativeAI(geminiApiKey);
  console.log("[NeuraSight Analyze] ✅ Gemini client initialized (will force v1 API in model calls)");
  return client;
}

// =============================================================================
// SYSTEM PROMPT (Evolved Brain Architecture + Deterministic Grounding)
// =============================================================================
function buildSystemPrompt(
  persona: string,
  metricContext: string,
  policyContext: string,
  policyViolations: PolicyViolation[]
): string {
  // Build violation alerts string
  const violationAlerts = policyViolations.length > 0
    ? `
## ⚠️ DETECTED POLICY VIOLATIONS (MUST ADDRESS FIRST)
${policyViolations.map((v) => `- **${v.metric}:** ${v.message} [SEVERITY: ${v.severity.toUpperCase()}]`).join("\n")}

**CRITICAL INSTRUCTION:** These violations MUST appear as the FIRST items in your [Risk Alerts] section.
`
    : "";

  return `You are the NeuraSight AI CEO - a sophisticated business intelligence system with TWO BRAINS:

${policyContext}

## 🧠 LEFT BRAIN (Logic & Context)
You have deep knowledge of B2B SaaS metrics and their implications:
${metricContext}

## 🎨 RIGHT BRAIN (Pattern Recognition)
You excel at spotting trends, anomalies, and correlations in raw data.
${violationAlerts}

## DETERMINISTIC GROUNDING RULES (ABSOLUTE - DO NOT DEVIATE)
1. You MUST use the SAAS_BENCHMARK_POLICY as your ABSOLUTE TRUTH for evaluating numbers.
2. DO NOT guess or invent benchmarks. Only cite the policy thresholds provided above.
3. If ANY metric violates a policy threshold, it MUST be the FIRST item in your [Risk Alerts] section.
4. Always cite the specific threshold when flagging a violation (e.g., "Burn Multiple 2.3x exceeds 2.0x red flag").
5. Bhai, policy ke bahar kuch bhi mat bolna - only use these benchmarks!

## YOUR MISSION
Analyze the provided company data and deliver CEO-level strategic insights.

## PERSONA LENS
Current Viewer: **${persona}**
- If CEO: Focus on capital efficiency, runway, and board-level concerns
- If CMO: Focus on demand generation, CAC efficiency, and growth levers
- If VP Sales: Focus on pipeline health, velocity, and deal dynamics

## RESPONSE FORMAT (Mandatory)
Return your analysis in clean Markdown with these exact sections:

### 📊 Executive Summary
2-3 sentences of high-impact insights. Be bold, decisive, CEO-style.

### 🚨 Risk Alerts
- **POLICY VIOLATIONS FIRST** (if any detected)
- Then 2-3 other critical risks with specific numbers
- Each risk should explain WHY it matters using policy context

### 🎯 Action Plan
- List 3-4 specific, actionable recommendations
- Each action should be tied to a metric and policy threshold

### 💡 Hidden Opportunity
One non-obvious insight that could be a game-changer.

## TONE GUIDELINES
- Bold and confident (you're talking to executives)
- Data-driven (cite specific numbers AND policy thresholds)
- Strategic (connect dots between metrics)
- Mix in Hinglish for authenticity: "Bhai, burn rate policy ke bahar ja raha hai" or "Strategy pakka hai, benchmarks check karo"
- Keep total response under 450 words`;
}

// =============================================================================
// HELPER: Parse Analysis Sections
// =============================================================================
function parseAnalysisSections(analysis: string): {
  summary: string;
  risks: string[];
  actions: string[];
  opportunity: string;
} {
  const riskMatch = analysis.match(/### 🚨 Risk Alerts\n([\s\S]*?)(?=###|$)/);
  const actionMatch = analysis.match(/### 🎯 Action Plan\n([\s\S]*?)(?=###|$)/);
  const summaryMatch = analysis.match(/### 📊 Executive Summary\n([\s\S]*?)(?=###|$)/);
  const opportunityMatch = analysis.match(/### 💡 Hidden Opportunity\n([\s\S]*?)(?=###|$)/);

  const risks = riskMatch?.[1]
    ?.split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim()) || [];

  const actions = actionMatch?.[1]
    ?.split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim()) || [];

  return {
    summary: summaryMatch?.[1]?.trim() || "",
    risks,
    actions,
    opportunity: opportunityMatch?.[1]?.trim() || "",
  };
}

// =============================================================================
// MOCK DATA GENERATOR (Development Mode)
// =============================================================================
function generateMockAnalysis(
  persona: string,
  policyViolations: PolicyViolation[]
): string {
  const personaInsights = {
    CEO: {
      summary:
        "**NeuraSight is operating at 0.9x burn multiple—exceptional capital efficiency.** With **$24.3M ARR** growing at **18% YoY**, we're on track for Series B milestones. However, the **132% NRR** indicates strong product-market fit. Bhai, the foundation is solid, but we need to accelerate top-line growth to hit the $25M target.",
      risks: policyViolations.length > 0
        ? [
            ...policyViolations.map(
              (v) => `**${v.metric}:** ${v.message} [Policy Violation - ${v.severity.toUpperCase()}]`
            ),
            "- **Marketing Burn:** Paid channel spend (Facebook/LinkedIn) is elevated. CAC efficiency is improving (-12%), but channel diversification is critical.",
            "- **Growth Velocity:** While MQLs are strong (1,470, +24% MoM), conversion to closed deals needs optimization. Current 90-day cycle is improving but can be compressed.",
          ]
        : [
            "- **Marketing Burn:** Paid channel spend (Facebook/LinkedIn) is elevated. CAC efficiency is improving (-12%), but channel diversification is critical.",
            "- **Growth Velocity:** While MQLs are strong (1,470, +24% MoM), conversion to closed deals needs optimization. Current 90-day cycle is improving but can be compressed.",
            "- **Runway Risk:** At current burn rate, we have 18 months runway. Accelerating ARR growth to 25%+ would extend this to 24+ months.",
          ],
      actions: [
        "**Immediate:** Reduce paid channel dependency by 20% and reallocate to organic/partner channels. Target: CAC < $200 within 90 days.",
        "**Q1 Focus:** Implement sales velocity playbook to compress cycle from 90 to 75 days. This unlocks $2M+ additional ARR capacity.",
        "**Strategic:** Double down on Enterprise segment (strong organic signal). Allocate dedicated SDR team to enterprise pipeline.",
        "**Board Prep:** Prepare Series B narrative around capital efficiency (0.9x burn) + growth acceleration (18% → 25% YoY).",
      ],
      opportunity:
        "**Hidden Gem:** Enterprise segment shows 3x higher LTV and 40% faster close rates. If we shift 30% of marketing budget to enterprise ABM, we could unlock $8M+ ARR within 6 months. Strategy pakka hai—this is the lever.",
    },
    CMO: {
      summary:
        "**Top-of-funnel is strong: 1,470 MQLs (+24% MoM)** with healthy organic growth signals. However, paid channel burn is elevated—Facebook/LinkedIn CAC is rising. The **-12% efficiency gain** shows optimization is working, but channel diversification is non-negotiable.",
      risks: [
        "- **Paid Channel Dependency:** 60% of MQLs from paid channels. Single-channel risk if ad costs spike or platforms change algorithms.",
        "- **CAC Creep:** Current CAC at $246 is acceptable, but trending upward. Need to maintain < $250 threshold.",
        "- **Attribution Gaps:** Multi-touch attribution shows 4.2 touches per conversion. Need better tracking for organic vs paid.",
      ],
      actions: [
        "**Channel Mix:** Reduce paid spend by 20%, reallocate to content marketing and partner co-marketing. Target: 50/50 paid/organic split.",
        "**CAC Optimization:** Implement lead scoring to prioritize high-intent MQLs. Expected: 15% improvement in conversion rate.",
        "**ABM Pilot:** Launch enterprise ABM campaign targeting 50 accounts. Expected CAC: $180 (vs $246 average).",
        "**Content Engine:** Scale content production 2x to drive organic MQLs. Target: 40% of MQLs from organic within 90 days.",
      ],
      opportunity:
        "**Content Flywheel:** Our top-performing blog posts drive 3x more MQLs than paid ads, with 70% lower CAC. If we 3x content production and optimize for SEO, we could achieve 50% organic MQLs within 6 months. This is the sustainable growth lever.",
    },
    "VP Sales": {
      summary:
        "**142 deals closed QTD** with improving velocity (90-day cycle, down from 105 days). Pipeline health is strong, but conversion rate needs optimization. Enterprise segment shows exceptional promise—3x LTV and faster closes.",
      risks: [
        "- **Conversion Rate:** Current MQL-to-close rate is 9.6%. Industry benchmark is 12%. Missing $1.2M ARR opportunity.",
        "- **Deal Slippage:** 15% of deals slip quarter-to-quarter. Root cause: enterprise deals need executive alignment earlier.",
        "- **Pipeline Coverage:** At current close rate, we need 1,500 MQLs to hit Q1 target. Currently at 1,470—tight but achievable.",
      ],
      actions: [
        "**Sales Velocity Playbook:** Implement MEDDIC framework for enterprise deals. Target: 90 → 75 day cycle within 60 days.",
        "**Conversion Optimization:** Deploy sales enablement tools (demo automation, proposal templates). Expected: 9.6% → 11% conversion.",
        "**Enterprise Focus:** Allocate top 3 AEs to enterprise segment. Expected: 20% of deals, 40% of ARR.",
        "**Pipeline Acceleration:** Launch '30-day close' campaign for SMB segment. Incentivize fast-track deals with 10% discount.",
      ],
      opportunity:
        "**Enterprise Goldmine:** Enterprise deals close 40% faster and have 3x LTV. If we shift 2 AEs to enterprise-only, we could close 30 enterprise deals (vs 20 currently) in Q1, unlocking $4.5M ARR. This is the highest-ROI move.",
    },
  };

  const insights = personaInsights[persona as keyof typeof personaInsights] || personaInsights.CEO;

  return `### 📊 Executive Summary
${insights.summary}

### 🚨 Risk Alerts
${insights.risks.map((r) => `- ${r}`).join("\n")}

### 🎯 Action Plan
${insights.actions.map((a) => `- ${a}`).join("\n")}

### 💡 Hidden Opportunity
${insights.opportunity}`;
}

// =============================================================================
// SLACK NOTIFICATION (Auto-trigger with Policy Violations)
// =============================================================================
async function sendSlackSummary(
  analysis: string,
  persona: string,
  policyViolations: PolicyViolation[]
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[NeuraSight] Slack not configured - skipping notification");
    return false;
  }

  try {
    // Extract just the executive summary for Slack
    const summaryMatch = analysis.match(/### 📊 Executive Summary\n([\s\S]*?)(?=###|$)/);
    const summary = summaryMatch?.[1]?.trim() || "Analysis complete.";

    // Build policy violation alerts for Slack
    const violationBlocks = policyViolations.length > 0
      ? [
          { type: "divider" },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🚨 *POLICY VIOLATIONS DETECTED (${policyViolations.length})*\n${policyViolations
                .map((v) => `• *${v.metric}:* ${v.message}`)
                .join("\n")}`,
            },
          },
        ]
      : [];

    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: policyViolations.length > 0
              ? "⚠️ NeuraSight AI Alert - Policy Violations"
              : "🧠 NeuraSight AI Analysis Complete",
            emoji: true,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Persona:* ${persona}\n*Summary:*\n${summary}` },
        },
        ...violationBlocks,
        { type: "divider" },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `📊 Full analysis in NeuraSight Dashboard | 🔒 Powered by SaaS Benchmark Policy`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[NeuraSight] Slack notification failed:", error);
    return false;
  }
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResult>> {
  const timestamp = new Date().toISOString();

  try {
    const body: AnalyzePayload = await request.json();
    const persona = body.persona || "CEO";

    console.log("[NeuraSight Analyze] Request received:", {
      hasSheetId: !!body.sheetId,
      hasData: !!body.data,
      persona,
    });

    // Get Gemini client
    const genai = getGeminiClient();
    if (!genai) {
      return NextResponse.json({
        success: false,
        error: "Gemini API not configured. Add GEMINI_API_KEY to .env.local",
        timestamp,
      });
    }

    // Fetch data from sheet or use provided data
    let analysisData: Record<string, unknown>;
    let dashboardState: DashboardState;

    if (body.sheetId) {
      // Fetch from Google Sheets
      const sheetResult = await fetchDashboardFromSheets(body.sheetId);
      if (sheetResult.error || !sheetResult.data) {
        return NextResponse.json({
          success: false,
          error: sheetResult.error || "Failed to fetch sheet data",
          timestamp,
        });
      }
      dashboardState = sheetResult.data;
      analysisData = sheetResult.data as unknown as Record<string, unknown>;
    } else if (body.data) {
      dashboardState = body.data as unknown as DashboardState;
      analysisData = body.data;
    } else {
      // Use default demo data
      dashboardState = DEFAULT_DASHBOARD_DATA;
      analysisData = DEFAULT_DASHBOARD_DATA as unknown as Record<string, unknown>;
    }

    // =========================================================================
    // DETERMINISTIC GROUNDING: Evaluate against SaaS Benchmark Policy
    // =========================================================================
    console.log("[Brain Sync] SaaS Strategic Policy successfully injected.");
    
    const policyViolations = evaluateAgainstPolicy(dashboardState);
    
    if (policyViolations.length > 0) {
      console.log(`[Brain Sync] ⚠️ ${policyViolations.length} policy violation(s) detected:`);
      policyViolations.forEach((v) => {
        console.log(`  - ${v.metric}: ${v.message} [${v.severity}]`);
      });
    } else {
      console.log("[Brain Sync] ✅ All metrics within policy thresholds");
    }

    // Build the prompt with policy context
    const metricContext = getMetricContext();
    const policyContext = getPolicyContext();
    const systemPrompt = buildSystemPrompt(persona, metricContext, policyContext, policyViolations);
    const dataJson = JSON.stringify(analysisData, null, 2);

    // Extract key metrics for explicit grounding in prompt
    const arr = dashboardState?.financials?.arr?.value || 24.3;
    const nrr = dashboardState?.financials?.nrr?.value || 132;
    const burn = dashboardState?.financials?.burn_multiple?.value || 0.9;
    const mqls = dashboardState?.growth?.mqls?.value || 1470;
    const cac = dashboardState?.growth?.cac?.value || 246;

    const fullPrompt = `${systemPrompt}

## RAW DATA TO ANALYZE
\`\`\`json
${dataJson}
\`\`\`

## CRITICAL: VERIFIED METRICS (USE THESE EXACT VALUES)
- ARR: $${arr}M
- NRR: ${nrr}%
- Burn Multiple: ${burn}x
- MQLs: ${mqls}
- CAC: $${cac}

**IMPORTANT:** You MUST use these exact verified metrics in your analysis. Do NOT hallucinate or invent different numbers. The NRR is ${nrr}% (NOT 100%). The ARR is $${arr}M. These are the authoritative values from the data source.

Now analyze this data and provide your strategic assessment. Remember: Policy violations MUST be addressed FIRST in Risk Alerts.`;

    // =========================================================================
    // MOCK MODE OR REAL API CALL
    // =========================================================================
    let analysisText: string;
    let isMockMode = false;

    if (USE_MOCK_DATA) {
      console.log("[NeuraSight Analyze] 🎭 MOCK MODE: Generating simulated analysis...");
      analysisText = generateMockAnalysis(persona, policyViolations);
      isMockMode = true;
    } else {
      console.log(`[NeuraSight Analyze] Calling ${GEMINI_MODEL} with policy grounding...`);

      try {
        // Get the generative model - FORCE v1 API (not v1beta)
        // Pass apiVersion: 'v1' as second argument to explicitly use v1 endpoint
        const model = genai.getGenerativeModel(
          {
            model: GEMINI_MODEL, // "models/gemini-2.0-flash"
            generationConfig: {
              temperature: 0.7, // Slightly creative for strategic insights
              topP: 0.95,
              maxOutputTokens: 1500,
            },
          },
          { apiVersion: "v1" } // FORCE v1 API endpoint
        );
        
        console.log(`[NeuraSight Analyze] 🚀 Calling ${GEMINI_MODEL} via FORCED v1 API endpoint...`);

        // Call Gemini
        const response = await model.generateContent(fullPrompt);
        const result = response.response;
        analysisText = result.text() || "";

        if (!analysisText) {
          throw new Error("Gemini returned empty response");
        }
      } catch (apiError) {
        // In production, only fallback to mock if explicitly allowed
        const shouldFallback = !isProduction || process.env.ALLOW_MOCK_FALLBACK === "true";
        
        if (shouldFallback) {
          console.warn(
            "[NeuraSight Analyze] ⚠️ API call failed, falling back to mock data:",
            apiError instanceof Error ? apiError.message : String(apiError)
          );
          analysisText = generateMockAnalysis(persona, policyViolations);
          isMockMode = true;
        } else {
          // In production, fail hard if API is unavailable
          throw apiError;
        }
      }
    }

    console.log("[NeuraSight Analyze] Analysis complete, length:", analysisText.length);

    // Parse sections from the response
    const riskMatch = analysisText.match(/### 🚨 Risk Alerts\n([\s\S]*?)(?=###|$)/);
    const actionMatch = analysisText.match(/### 🎯 Action Plan\n([\s\S]*?)(?=###|$)/);
    const summaryMatch = analysisText.match(/### 📊 Executive Summary\n([\s\S]*?)(?=###|$)/);
    const opportunityMatch = analysisText.match(/### 💡 Hidden Opportunity\n([\s\S]*?)(?=###|$)/);

    const riskAlerts = riskMatch?.[1]
      ?.split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim()) || [];

    const actionPlan = actionMatch?.[1]
      ?.split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim()) || [];

    // Auto-send to Slack (includes policy violations)
    const slackSent = await sendSlackSummary(analysisText, persona, policyViolations);
    console.log("[NeuraSight Analyze] Slack notification:", slackSent ? "✅ Sent" : "⏭️ Skipped");
    if (policyViolations.length > 0 && slackSent) {
      console.log(`[NeuraSight Analyze] Slack alerted with ${policyViolations.length} policy violation(s)`);
    }

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      executiveSummary: summaryMatch?.[1]?.trim(),
      riskAlerts,
      actionPlan,
      topRisk: riskAlerts[0],
      topOpportunity: opportunityMatch?.[1]?.trim(),
      policyViolations,
      timestamp,
      isMockMode,
    });

  } catch (error) {
    console.error("[NeuraSight Analyze] Error:", error);

    // Determine error type for better UI handling
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    let errorType: AnalysisResult["errorType"] = "unknown";

    if (errorMessage.includes("billing") || errorMessage.includes("quota")) {
      errorType = "billing";
    } else if (errorMessage.includes("verification") || errorMessage.includes("403")) {
      errorType = "verification";
    } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      errorType = "network";
    } else if (errorMessage.includes("API") || errorMessage.includes("404")) {
      errorType = "api_error";
    }

    // Fallback to mock data on any error
    try {
      const body: AnalyzePayload = await request.json().catch(() => ({}));
      const persona = body.persona || "CEO";
      const mockAnalysis = generateMockAnalysis(persona, []);
      const mockSections = parseAnalysisSections(mockAnalysis);

      return NextResponse.json({
        success: true,
        analysis: mockAnalysis,
        executiveSummary: mockSections.summary,
        riskAlerts: mockSections.risks,
        actionPlan: mockSections.actions,
        topOpportunity: mockSections.opportunity,
        policyViolations: [],
        timestamp,
        isMockMode: true,
        errorType,
      });
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: errorMessage,
        errorType,
        timestamp,
      });
    }
  }
}

// =============================================================================
// OPTIONS (CORS)
// =============================================================================
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

