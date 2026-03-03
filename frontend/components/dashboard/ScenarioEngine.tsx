"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ShoppingCart, Dumbbell, Loader2, Zap } from "lucide-react";
import type { Persona } from "@/components/ExecutionLog";
import type { DashboardState } from "@/types/dashboard";
import {
  ALL_SCENARIOS,
  getScenarioById,
  getScenarioDataForPersona,
  generateRawDataForScenario,
  type Scenario,
} from "@/lib/testing/scenarios";

interface ScenarioEngineProps {
  persona: Persona;
  isGenerating: boolean;
  activeScenarioId?: string | undefined;
  onScenarioSelect: (
    scenario: Scenario,
    scenarioData: DashboardState,
    rawData: Array<Record<string, unknown>>
  ) => Promise<void>;
  onStateChange?: (activeScenarioId: string | undefined) => void;
}

/**
 * ScenarioEngine Component
 * 
 * Elite floating control bar for scenario selection in the Sovereign Playground.
 * Glassmorphic design with neon accents and smooth animations.
 */
export default function ScenarioEngine({
  persona,
  isGenerating,
  activeScenarioId: initialActiveScenarioId,
  onScenarioSelect,
  onStateChange,
}: ScenarioEngineProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(initialActiveScenarioId);

  // Sync prop changes to internal state
  useEffect(() => {
    setActiveScenarioId(initialActiveScenarioId);
  }, [initialActiveScenarioId]);

  /**
   * Handle Scenario Selection
   */
  const handleScenarioSelect = useCallback(
    async (scenarioId: string) => {
      if (isGenerating) {
        console.warn("[ScenarioEngine] Cannot select scenario while generating");
        return;
      }

      const scenario = getScenarioById(scenarioId);
      if (!scenario) {
        console.error(`[ScenarioEngine] Scenario not found: ${scenarioId}`);
        return;
      }

      const scenarioData = getScenarioDataForPersona(scenario, persona);
      const rawData = generateRawDataForScenario(scenario, persona);

      setActiveScenarioId(scenarioId);

      if (onStateChange) {
        onStateChange(scenarioId);
      }

      await onScenarioSelect(scenario, scenarioData, rawData);
    },
    [persona, isGenerating, onScenarioSelect, onStateChange]
  );

  // Icon mapping
  const iconMap: Record<string, typeof TrendingUp> = {
    TrendingUp,
    AlertTriangle,
    ShoppingCart,
    Dumbbell,
  };

  // Color classes for scenarios
  const colorClasses: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-300",
      glow: "shadow-emerald-500/50",
    },
    red: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-300",
      glow: "shadow-red-500/50",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      glow: "shadow-amber-500/50",
    },
    cyan: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-300",
      glow: "shadow-cyan-500/50",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 pointer-events-auto"
    >
      {/* Glassmorphic Control Bar */}
      <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-3 shadow-2xl">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative flex items-center gap-2">
          {/* Label */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Sovereign Playground
            </span>
          </div>

          {/* Scenario Buttons */}
          <div className="flex items-center gap-2">
            {ALL_SCENARIOS.map((scenario) => {
              const Icon = iconMap[scenario.metadata.icon] || TrendingUp;
              const colors = colorClasses[scenario.metadata.color] || colorClasses.emerald;
              const isActive = activeScenarioId === scenario.id;

              return (
                <motion.button
                  key={scenario.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  disabled={isGenerating}
                  className={`
                    relative flex items-center gap-2 rounded-lg border px-3 py-2
                    backdrop-blur-sm transition-all disabled:cursor-not-allowed disabled:opacity-50
                    ${colors.border} ${colors.bg} ${colors.text}
                    ${isActive ? `ring-2 ring-emerald-400/50 ${colors.glow} shadow-lg` : ""}
                  `}
                >
                  {/* Active Pulse Effect */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-lg ${colors.bg}`}
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  <Icon className={`h-3.5 w-3.5 relative z-10 ${isActive ? "text-emerald-400" : ""}`} />
                  <span className="text-xs font-medium relative z-10">{scenario.name}</span>

                  {isGenerating && activeScenarioId === scenario.id && (
                    <Loader2 className="h-3 w-3 animate-spin relative z-10" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hook version for direct state access
 */
export function useScenarioEngine(
  persona: Persona,
  isGenerating: boolean,
  onScenarioSelect: (
    scenario: Scenario,
    scenarioData: DashboardState,
    rawData: Array<Record<string, unknown>>
  ) => Promise<void>
) {
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(undefined);

  const handleScenarioSelect = useCallback(
    async (scenarioId: string) => {
      if (isGenerating) {
        console.warn("[ScenarioEngine] Cannot select scenario while generating");
        return;
      }

      const scenario = getScenarioById(scenarioId);
      if (!scenario) {
        console.error(`[ScenarioEngine] Scenario not found: ${scenarioId}`);
        return;
      }

      const scenarioData = getScenarioDataForPersona(scenario, persona);
      const rawData = generateRawDataForScenario(scenario, persona);

      setActiveScenarioId(scenarioId);
      await onScenarioSelect(scenario, scenarioData, rawData);
    },
    [persona, isGenerating, onScenarioSelect]
  );

  return {
    activeScenarioId,
    handleScenarioSelect,
    scenarios: ALL_SCENARIOS,
  };
}

