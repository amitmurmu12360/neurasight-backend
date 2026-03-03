/**
 * NeuraSight What-If Simulation API Route
 * ========================================
 * Uses Gemini 2.0 Flash to predict dashboard state based on scenario input.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "models/gemini-2.0-flash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, current_state } = body;

    if (!scenario || !current_state) {
      return NextResponse.json(
        { error: "Missing scenario or current_state" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel(
      {
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: 0.3, // Lower for more deterministic predictions
          topP: 0.95,
          maxOutputTokens: 2000,
        },
      },
      { apiVersion: "v1" }
    );

    // Extract verified December metrics for grounding
    const arr = current_state?.financials?.arr?.value || 24.3;
    const nrr = current_state?.financials?.nrr?.value || 132;
    const mqls = current_state?.growth?.mqls?.value || 1470;

    const prompt = `You are NeuraSight AI's Predictive Engine. Analyze the following scenario and predict the resulting dashboard state.

CURRENT DASHBOARD STATE (JSON) - VERIFIED DECEMBER METRICS:
\`\`\`json
${JSON.stringify(current_state, null, 2)}
\`\`\`

VERIFIED BASELINE (December Data):
- ARR: $${arr}M
- NRR: ${nrr}%
- MQLs: ${mqls.toLocaleString()}

SCENARIO TO SIMULATE:
"${scenario}"

TASK:
1. Analyze how this scenario would impact each metric in the dashboard.
2. Calculate predicted values for: ARR, NRR, Burn Multiple, MQLs, CAC, Deals Closed.
3. Provide TWO explanations:
   - "explanation": A concise 2-sentence vocal summary for text-to-speech (professional, executive tone)
   - "detailed_explanation": A longer 3-4 sentence analysis for visual display

OUTPUT FORMAT (JSON only, no markdown):
{
  "financials": {
    "arr": { "value": <number>, "growth_yoy": <number> },
    "nrr": { "value": <number> },
    "burn_multiple": { "value": <number> }
  },
  "growth": {
    "mqls": { "value": <number>, "growth_mom": <number> },
    "cac": { "value": <number> }
  },
  "sales": {
    "deals_closed": { "value": <number> }
  },
  "explanation": "<2-sentence concise vocal summary - professional executive tone, suitable for text-to-speech>",
  "detailed_explanation": "<3-4 sentence detailed analysis for visual display>"
}

CRITICAL: The "explanation" field must be exactly 2 sentences, professional, and optimized for voice synthesis. Ground all numbers in the verified baseline ($${arr}M ARR, ${nrr}% NRR).

Return ONLY valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let predictedState;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      predictedState = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("[What-If] JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      predicted_state: predictedState,
    });
  } catch (error) {
    console.error("[What-If] Simulation error:", error);
    return NextResponse.json(
      {
        error: "Simulation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

