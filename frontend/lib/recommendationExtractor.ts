/**
 * Recommendation Extractor
 * ========================
 * Parses AI analysis text to extract actionable recommendations
 * based on persona-aware strategic frameworks.
 */

import type { PersonaType } from "./personaStrategies";
import { PERSONA_STRATEGIES } from "./personaStrategies";

export interface ExtractedRecommendation {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  frameworkTag: "SWOT" | "AARRR" | "MEDDIC" | "General";
  description?: string;
  persona: PersonaType;
}

/**
 * Extract recommendations from AI analysis text
 */
export function extractRecommendations(
  analysisText: string,
  persona: PersonaType | string
): ExtractedRecommendation[] {
  const recommendations: ExtractedRecommendation[] = [];
  const personaStrategy = PERSONA_STRATEGIES[persona as PersonaType];
  const frameworkTag = persona === "CEO" ? "SWOT" : persona === "CMO" ? "AARRR" : persona === "VP Sales" ? "MEDDIC" : "General";

  // Split analysis into sections
  const sections = analysisText.split(/\n\n|\n(?=###|##|#)/);

  // Priority keywords based on framework
  const highPriorityKeywords = persona === "CEO" 
    ? ["threat", "risk", "critical", "urgent", "immediate", "burn rate", "runway", "decline"]
    : persona === "CMO"
    ? ["leakage", "drop", "decline", "inefficient", "low conversion", "churn"]
    : ["stuck", "at risk", "delayed", "low quality", "missed target"];

  const mediumPriorityKeywords = persona === "CEO"
    ? ["opportunity", "growth", "potential", "optimize", "improve"]
    : persona === "CMO"
    ? ["optimize", "improve", "enhance", "scale"]
    : ["optimize", "improve", "accelerate", "enhance"];

  // Extract recommendations from each section
  sections.forEach((section, index) => {
    // Look for actionable items (bullet points, numbered lists, or bold text)
    const actionablePatterns = [
      /[-•]\s*(.+?)(?:\.|$)/g, // Bullet points
      /\d+\.\s*(.+?)(?:\.|$)/g, // Numbered lists
      /\*\*(.+?)\*\*/g, // Bold text
      /###\s*(.+?)(?:\n|$)/g, // Headers
    ];

    actionablePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(section)) !== null) {
        const text = match[1]?.trim();
        if (!text || text.length < 10) continue; // Skip very short matches

        // Determine priority based on keywords
        const lowerText = text.toLowerCase();
        let priority: "high" | "medium" | "low" = "low";
        
        if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
          priority = "high";
        } else if (mediumPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
          priority = "medium";
        }

        // Skip if it's too generic or already captured
        if (text.length > 150 || recommendations.some(r => r.title === text)) {
          continue;
        }

        recommendations.push({
          id: `rec-${Date.now()}-${index}-${recommendations.length}`,
          title: text.length > 80 ? text.substring(0, 80) + "..." : text,
          priority,
          frameworkTag,
          description: text.length > 80 ? text : undefined,
          persona: persona as PersonaType,
        });
      }
    });
  });

  // Sort by priority (high first) and limit to top 3
  const sorted = recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return sorted.slice(0, 3);
}
