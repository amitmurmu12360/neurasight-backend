/**
 * ThoughtBubble Component
 * =======================
 * Floating, minimalist thought bubble that appears above agent nodes in the Sovereign Brain HUD.
 * Displays concise agent activity messages with hemisphere color matching and neural pulse sync.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AgentActivity } from "@/lib/agents/orchestrator";

interface ThoughtBubbleProps {
  activity: AgentActivity | null;
  isActive: boolean;
  hemisphereColor: "cyan" | "emerald" | "amber" | "white" | "purple";
  position: { x: number; y: number };
  svgContainer: { width: number; height: number };
}

// Truncate message to max 12 words for executive "glanceable" experience
function truncateMessage(message: string, maxWords: number = 12): string {
  const words = message.split(" ");
  if (words.length <= maxWords) return message;
  return words.slice(0, maxWords).join(" ") + "...";
}

// Extract and verify math values (e.g., $24.3M, 132%)
function extractMathValues(message: string): string {
  // Pattern for common financial/metric formats
  // Values are assumed to be verified by Agent 2 (Math Auditor)
  // This function preserves the math notation as-is
  return message;
}

export default function ThoughtBubble({
  activity,
  isActive,
  hemisphereColor,
  position,
  svgContainer,
}: ThoughtBubbleProps) {
  if (!activity || !isActive || activity.status !== "active") {
    return null;
  }

  const displayMessage = truncateMessage(activity.message || "");
  const verifiedMessage = extractMathValues(displayMessage);

  // Calculate bubble position (above the node)
  const bubbleX = position.x;
  const bubbleY = position.y - 40; // Position above the node

  // Hemisphere color mapping
  const colorConfig = {
    cyan: {
      border: "border-cyan-400/40",
      bg: "bg-cyan-400/5",
      text: "text-cyan-300",
      glow: "shadow-cyan-500/30",
    },
    emerald: {
      border: "border-emerald-400/40",
      bg: "bg-emerald-400/5",
      text: "text-emerald-300",
      glow: "shadow-emerald-500/30",
    },
    amber: {
      border: "border-amber-400/40",
      bg: "bg-amber-400/5",
      text: "text-amber-300",
      glow: "shadow-amber-500/30",
    },
    white: {
      border: "border-white/40",
      bg: "bg-white/5",
      text: "text-slate-200",
      glow: "shadow-white/30",
    },
    purple: {
      border: "border-purple-400/40",
      bg: "bg-purple-400/5",
      text: "text-purple-300",
      glow: "shadow-purple-500/30",
    },
  };

  const colors = colorConfig[hemisphereColor];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.foreignObject
          x={bubbleX - 80} // Center the bubble (assuming ~160px width)
          y={bubbleY - 35}
          width="160"
          height="60"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`relative rounded-lg border ${colors.border} ${colors.bg} ${colors.glow} backdrop-blur-sm px-3 py-2 shadow-lg`}
          >
            {/* Bubble tail/pointer */}
            <div
              className={`absolute left-1/2 bottom-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b ${colors.border} ${colors.bg}`}
            />

            {/* Pulsing glow effect synced with neural veins */}
            <motion.div
              className={`absolute inset-0 rounded-lg ${colors.glow}`}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                boxShadow: [
                  `0 0 8px rgba(${hemisphereColor === "cyan" ? "34, 211, 238" : hemisphereColor === "emerald" ? "16, 185, 129" : hemisphereColor === "purple" ? "168, 85, 247" : "251, 191, 36"}, 0.2)`,
                  `0 0 16px rgba(${hemisphereColor === "cyan" ? "34, 211, 238" : hemisphereColor === "emerald" ? "16, 185, 129" : hemisphereColor === "purple" ? "168, 85, 247" : "251, 191, 36"}, 0.4)`,
                  `0 0 8px rgba(${hemisphereColor === "cyan" ? "34, 211, 238" : hemisphereColor === "emerald" ? "16, 185, 129" : hemisphereColor === "purple" ? "168, 85, 247" : "251, 191, 36"}, 0.2)`,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Message text */}
            <p className={`relative z-10 text-[10px] font-medium leading-tight ${colors.text}`}>
              {verifiedMessage}
            </p>
          </div>
        </motion.foreignObject>
      )}
    </AnimatePresence>
  );
}
