"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
interface LiveStrategyMapProps {
  /** Selected strategic path: 'aggressive', 'balanced', or 'defensive' */
  selectedPath?: "aggressive" | "balanced" | "defensive" | string;
  /** Detected industry (e.g., 'saas', 'retail') */
  industry?: string;
  /** Current dashboard data */
  currentData?: DashboardState;
  /** Optional: Crisis scenario ID for glow intensity */
  crisisScenarioId?: string | null;
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function LiveStrategyMap({
  selectedPath,
  industry,
  currentData,
  crisisScenarioId,
}: LiveStrategyMapProps) {
  // Determine if crisis mode is active
  const isCrisisMode = useMemo(() => {
    return crisisScenarioId?.includes("crisis") || false;
  }, [crisisScenarioId]);

  // Determine axis labels based on industry
  const axisLabels = useMemo(() => {
    const isRetail = industry?.toLowerCase() === "retail" || industry?.toLowerCase() === "ecommerce";
    return {
      x: isRetail ? "Sales" : "ARR",
      y: isRetail ? "Inventory" : "CAC",
    };
  }, [industry]);

  // Calculate glow intensity based on crisis mode
  const glowIntensity = useMemo(() => {
    if (isCrisisMode) {
      return {
        opacity: 0.8,
        blur: 20,
        spread: 15,
      };
    }
    return {
      opacity: 0.4,
      blur: 12,
      spread: 8,
    };
  }, [isCrisisMode]);

  // Path colors based on strategy
  const pathColors = useMemo(() => {
    const colors = {
      aggressive: {
        stroke: "rgb(16, 185, 129)", // emerald-500
        glow: "rgba(16, 185, 129, 0.6)",
      },
      balanced: {
        stroke: "rgb(6, 182, 212)", // cyan-500
        glow: "rgba(6, 182, 212, 0.6)",
      },
      defensive: {
        stroke: "rgb(245, 158, 11)", // amber-500
        glow: "rgba(245, 158, 11, 0.6)",
      },
    };
    return selectedPath && selectedPath in colors
      ? colors[selectedPath as keyof typeof colors]
      : colors.balanced;
  }, [selectedPath]);

  // SVG path coordinates (simplified strategy map visualization)
  const pathData = useMemo(() => {
    // Starting point (bottom-left)
    const startX = 80;
    const startY = 320;
    // End point based on strategy
    const endY = selectedPath === "aggressive" ? 60 : selectedPath === "defensive" ? 280 : 170;
    const endX = 520;
    
    // Control points for smooth curve
    const cp1X = startX + (endX - startX) * 0.3;
    const cp1Y = startY - (startY - endY) * 0.4;
    const cp2X = startX + (endX - startX) * 0.7;
    const cp2Y = startY - (startY - endY) * 0.6;
    
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  }, [selectedPath]);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-white">
          STRATEGIC PATH MAP
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {selectedPath ? `${selectedPath.toUpperCase()} Strategy` : "Select a strategic path"}
        </p>
      </div>

      {/* SVG Map Container */}
      <div className="relative">
        <svg
          width="600"
          height="360"
          viewBox="0 0 600 360"
          className="w-full max-w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid Background */}
          <defs>
            {/* Glow Filter for Crisis Mode */}
            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={glowIntensity.blur} result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Lines */}
          <g opacity="0.1">
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1={80 + i * 110}
                  y1="40"
                  x2={80 + i * 110}
                  y2="320"
                  stroke="white"
                  strokeWidth="1"
                />
                <line
                  x1="80"
                  y1={40 + i * 70}
                  x2="520"
                  y2={40 + i * 70}
                  stroke="white"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>

          {/* Strategic Path Line */}
          {selectedPath && (
            <motion.path
              d={pathData}
              fill="none"
              stroke={pathColors.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#pathGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: 1,
              }}
              transition={{
                pathLength: { duration: 1.5, ease: "easeInOut" },
                opacity: { duration: 0.5 },
              }}
            />
          )}

          {/* Start Point */}
          <circle
            cx="80"
            cy="320"
            r="8"
            fill={pathColors.stroke}
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 ${glowIntensity.spread}px ${pathColors.glow})`,
            }}
          />
          <text
            x="80"
            y="340"
            textAnchor="middle"
            className="font-mono text-[10px] fill-slate-400"
          >
            START
          </text>

          {/* End Point */}
          {selectedPath && (
            <>
              <motion.circle
                cx="520"
                cy={selectedPath === "aggressive" ? 60 : selectedPath === "defensive" ? 280 : 170}
                r="10"
                fill={pathColors.stroke}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                style={{
                  filter: `drop-shadow(0 0 ${glowIntensity.spread * 1.5}px ${pathColors.glow})`,
                }}
              />
              <text
                x="520"
                y={(selectedPath === "aggressive" ? 60 : selectedPath === "defensive" ? 280 : 170) + 25}
                textAnchor="middle"
                className="font-mono text-[10px] fill-slate-400"
              >
                {selectedPath.toUpperCase()}
              </text>
            </>
          )}

          {/* X-Axis Label */}
          <text
            x="300"
            y="350"
            textAnchor="middle"
            className="font-mono text-xs font-semibold fill-slate-300"
          >
            {axisLabels.x}
          </text>

          {/* Y-Axis Label (rotated) */}
          <text
            x="20"
            y="180"
            textAnchor="middle"
            className="font-mono text-xs font-semibold fill-slate-300"
            transform="rotate(-90 20 180)"
          >
            {axisLabels.y}
          </text>

          {/* Axis Arrow Indicators */}
          <path
            d="M 80 320 L 70 315 M 80 320 L 70 325"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M 80 320 L 75 330 M 80 320 L 85 330"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Crisis Mode Indicator */}
      {isCrisisMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2"
        >
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
            CRISIS MODE: Enhanced Glow Active
          </span>
        </motion.div>
      )}
    </div>
  );
}
