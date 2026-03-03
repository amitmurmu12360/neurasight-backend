/**
 * NeuraSight Market Simulation API Route
 * =======================================
 * Uses Gemini 2.0 Flash to generate competitive benchmarks for B2B SaaS Series B companies.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "models/gemini-2.0-flash";

interface MarketSimulationRequest {
  current_metrics: {
    arr: number;
    nrr: number;
    burn_multiple: number;
    mqls: number;
    cac: number;
  };
}

interface MarketSimulationResponse {
  success: boolean;
  market_avg?: {
    arr: number;
    nrr: number;
    burn_multiple: number;
    mqls: number;
    cac: number;
  };
  top_decile?: {
    arr: number;
    nrr: number;
    burn_multiple: number;
    mqls: number;
    cac: number;
  };
  strategic_advantage_score?: number;
  leaderboard_position?: string;
  gap_analysis?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MarketSimulationRequest = await request.json();
    const { current_metrics } = body;

    if (!current_metrics) {
      return NextResponse.json(
        { success: false, error: "Missing current_metrics" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel(
      {
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: 0.3, // Lower for more deterministic benchmarks
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      },
      { apiVersion: "v1" }
    );

    const prompt = `You are a strategic market intelligence analyst specializing in B2B SaaS Series B companies.

CURRENT COMPANY METRICS (Baseline):
- ARR: $${current_metrics.arr}M
- NRR: ${current_metrics.nrr}%
- Burn Multiple: ${current_metrics.burn_multiple}x
- MQLs: ${current_metrics.mqls.toLocaleString()}
- CAC: $${current_metrics.cac}

TASK:
Based on industry data for B2B SaaS Series B companies (2024 benchmarks), generate realistic market benchmarks:

1. Market Average: Typical performance for Series B SaaS companies
2. Top Decile: Performance of top 10% performers
3. Strategic Advantage Score: Calculate a score (0-100) based on how well the current company performs across all metrics relative to market averages. Higher retention and efficiency should be weighted more.
4. Leaderboard Position: Determine where this company ranks (e.g., "Top 5%", "Top 25%", "Median", "Bottom 25%")
5. Gap Analysis: Provide a concise 2-sentence summary of key competitive advantages and gaps.

OUTPUT FORMAT (JSON only, no markdown):
{
  "market_avg": {
    "arr": <number in millions>,
    "nrr": <percentage>,
    "burn_multiple": <number>,
    "mqls": <number>,
    "cac": <number in dollars>
  },
  "top_decile": {
    "arr": <number in millions>,
    "nrr": <percentage>,
    "burn_multiple": <number>,
    "mqls": <number>,
    "cac": <number in dollars>
  },
  "strategic_advantage_score": <number 0-100>,
  "leaderboard_position": "<string like 'Top 5%' or 'Top 25%'>",
  "gap_analysis": "<2-sentence summary>"
}

CRITICAL: All numbers must be realistic for Series B B2B SaaS companies. ARR typically ranges $10M-$50M. NRR typically 100-150%. Burn Multiple typically 0.8-2.0x.

Return ONLY valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let marketData: MarketSimulationResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      marketData = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("[Market Simulation] JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Extract success from marketData if present, otherwise use true
    const { success: _, ...marketDataWithoutSuccess } = marketData as { success?: boolean; [key: string]: unknown };
    return NextResponse.json({
      success: true,
      ...marketDataWithoutSuccess,
    });
  } catch (error) {
    console.error("[Market Simulation] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Market simulation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

