/**
 * Persona-Aware Strategic Frameworks
 * ===================================
 * Deep strategic context for each executive persona to provide
 * "Consultant-Grade" reasoning instead of generic summaries.
 */

export type PersonaType = "CEO" | "CMO" | "VP Sales";

export interface PersonaStrategy {
  instructions: string;
  framework: string;
  focusAreas: string[];
  language: string;
  responseStructure: {
    section1: string;
    section2: string;
    section3: string;
  };
}

export const PERSONA_STRATEGIES: Record<PersonaType, PersonaStrategy> = {
  CEO: {
    instructions: "Focus on the North Star Metric and ROI. Use the SWOT Framework (Strengths, Weaknesses, Opportunities, Threats). Analyze long-term growth vs. burn rate.",
    framework: "SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)",
    focusAreas: [
      "North Star Metric",
      "ROI and Capital Efficiency",
      "Long-term Growth Trajectory",
      "Burn Rate vs. Runway",
      "Strategic Risks and Market Position",
    ],
    language: "Strategic, Concise, Visionary",
    responseStructure: {
      section1: "Executive Summary",
      section2: "Strategic Risks",
      section3: "Growth Opportunities",
    },
  },
  CMO: {
    instructions: "Focus on Marketing Efficiency (LTV/CAC). Use the Pirate Metrics Framework (AARRR: Acquisition, Activation, Retention, Referral, Revenue). Analyze brand sentiment and funnel leakages.",
    framework: "Pirate Metrics (AARRR: Acquisition, Activation, Retention, Referral, Revenue)",
    focusAreas: [
      "Marketing Efficiency (LTV/CAC Ratio)",
      "Customer Acquisition Channels",
      "Brand Sentiment and Awareness",
      "Funnel Leakages and Conversion Rates",
      "Customer Activation and Onboarding",
    ],
    language: "Data-Driven, Growth-Focused, Customer-Centric",
    responseStructure: {
      section1: "Performance Overview",
      section2: "Tactical Bottlenecks",
      section3: "Immediate Action Plan",
    },
  },
  "VP Sales": {
    instructions: "Focus on Sales Velocity and Pipeline Health. Use the MEDDIC framework for deal quality. Analyze lead-to-close ratios and forecast accuracy.",
    framework: "MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)",
    focusAreas: [
      "Sales Velocity and Pipeline Health",
      "Lead-to-Close Ratios",
      "Forecast Accuracy",
      "Deal Quality (MEDDIC)",
      "Sales Cycle Efficiency",
    ],
    language: "Actionable, Numbers-driven, Execution-focused",
    responseStructure: {
      section1: "Performance Overview",
      section2: "Tactical Bottlenecks",
      section3: "Immediate Action Plan",
    },
  },
};

/**
 * Get persona-specific system prompt instructions
 */
export function getPersonaSystemPrompt(persona: PersonaType | string): string {
  const strategy = PERSONA_STRATEGIES[persona as PersonaType];
  
  if (!strategy) {
    // Fallback for unknown personas
    return `You are a General Business Consultant. Analyze the data with a balanced perspective, focusing on key metrics, trends, and actionable insights. Use clear, professional language.`;
  }

  return `You are a ${persona} Executive Advisor analyzing business data. 

STRATEGIC FRAMEWORK: ${strategy.framework}
FOCUS AREAS: ${strategy.focusAreas.join(", ")}
LANGUAGE STYLE: ${strategy.language}

INSTRUCTIONS: ${strategy.instructions}

RESPONSE STRUCTURE:
1. ${strategy.responseStructure.section1}
2. ${strategy.responseStructure.section2}
3. ${strategy.responseStructure.section3}

Apply this strategic framework rigorously to provide consultant-grade insights, not generic summaries.`;
}

/**
 * Get persona-specific analysis instructions for thought logs
 */
export function getPersonaAnalysisInstructions(persona: PersonaType | string): string {
  const strategy = PERSONA_STRATEGIES[persona as PersonaType];
  
  if (!strategy) {
    return "Analyzing data with balanced business perspective...";
  }

  return `Analyzing through ${persona} lens using ${strategy.framework}...`;
}
