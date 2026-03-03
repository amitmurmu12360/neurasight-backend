"use client";

/**
 * Sovereign Playground - Scenario Switcher
 * =========================================
 * A sophisticated testing and demo environment that allows triggering
 * the entire 11-agent swarm across different "Business Realities".
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Dumbbell,
  Play,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Persona } from "@/components/ExecutionLog";
import type { DashboardState } from "@/types/dashboard";
import {
  ALL_SCENARIOS,
  type Scenario,
  getScenarioDataForPersona,
  generateRawDataForScenario,
} from "@/lib/testing/scenarios";

interface ScenarioSwitcherProps {
  /** Current active persona */
  persona: Persona;
  /** Callback when scenario is selected - triggers swarm execution */
  onScenarioSelect: (scenario: Scenario, data: DashboardState, rawData: Array<Record<string, unknown>>) => Promise<void>;
  /** Whether the switcher is visible (dev/demo mode) */
  isVisible?: boolean;
  /** Whether a scenario is currently loading */
  isLoading?: boolean;
  /** Current active scenario ID */
  activeScenarioId?: string;
}

/**
 * Scenario Button Component
 */
function ScenarioButton({
  scenario,
  isActive,
  isLoading,
  onClick,
}: {
  scenario: Scenario;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const iconMap: Record<string, typeof TrendingUp> = {
    TrendingUp,
    AlertTriangle,
    ShoppingCart,
    Dumbbell,
  };

  const Icon = iconMap[scenario.metadata.icon] || TrendingUp;
  const colorClasses: Record<string, string> = {
    emerald: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    red: "border-red-400/50 bg-red-500/10 text-red-300 hover:bg-red-500/20",
    amber: "border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    cyan: "border-cyan-400/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLoading}
      className={`
        relative flex flex-col items-center gap-2 rounded-xl border-2 p-4
        backdrop-blur-xl transition-all disabled:cursor-not-allowed disabled:opacity-50
        ${isActive ? "ring-2 ring-offset-2 ring-offset-slate-950" : ""}
        ${colorClasses[scenario.metadata.color] || colorClasses.emerald}
        ${isActive ? "ring-" + scenario.metadata.color + "-400" : ""}
      `}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm"
        >
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </motion.div>
      )}
      
      <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""} transition-transform`} />
      <div className="text-center">
        <div className="text-xs font-semibold">{scenario.name}</div>
        <div className="mt-1 text-[10px] opacity-70">{scenario.description}</div>
      </div>
      
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-1"
        >
          <CheckCircle2 className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * Hex Grid Loading Overlay
 */
function HexGridOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <div className="relative h-64 w-64">
          {/* Hex Grid Pattern */}
          <svg className="h-full w-full" viewBox="0 0 200 200">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <motion.polygon
                  points="100,20 180,60 180,140 100,180 20,140 20,60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan-400"
                  style={{
                    transform: `rotate(${i * 60}deg)`,
                    transformOrigin: "100px 100px",
                  }}
                  animate={{
                    rotate: [i * 60, i * 60 + 360],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.g>
            ))}
          </svg>
          
          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <div className="text-center">
              <div className="text-lg font-semibold text-white">Sovereign Swarm Active</div>
              <div className="mt-1 text-sm text-slate-400">Processing Scenario...</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Main Scenario Switcher Component
 */
export default function ScenarioSwitcher({
  persona,
  onScenarioSelect,
  isVisible = true,
  isLoading = false,
  activeScenarioId,
}: ScenarioSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Handle scenario selection
  const handleScenarioClick = async (scenario: Scenario) => {
    if (isLoading) return;

    // Show loading overlay
    setShowLoadingOverlay(true);
    setIsExpanded(false);

    try {
      // Get scenario data for current persona
      const scenarioData = getScenarioDataForPersona(scenario, persona);
      const rawData = generateRawDataForScenario(scenario, persona);

      // Trigger swarm execution
      await onScenarioSelect(scenario, scenarioData, rawData);
    } catch (error) {
      console.error("[ScenarioSwitcher] Error loading scenario:", error);
    } finally {
      // Hide loading overlay after a delay (swarm will handle its own loading state)
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Hex Grid Loading Overlay */}
      <HexGridOverlay isVisible={showLoadingOverlay} />

      {/* Floating Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: isExpanded ? 0 : 20, opacity: 1 }}
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      >
        <div className="relative">
          {/* Main Dock Container */}
          <motion.div
            layout
            className={`
              flex items-center gap-3 rounded-2xl border-2 border-slate-700/50
              bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl
              ${isExpanded ? "px-6" : "px-4"}
            `}
          >
            {/* Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800/50"
            >
              <Play className="h-4 w-4" />
              <span>Sovereign Playground</span>
              {isExpanded ? (
                <X className="h-3 w-3" />
              ) : (
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-3 w-3" />
                </motion.div>
              )}
            </motion.button>

            {/* Scenario Buttons */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-3 overflow-hidden"
                >
                  {ALL_SCENARIOS.map((scenario) => (
                    <ScenarioButton
                      key={scenario.id}
                      scenario={scenario}
                      isActive={activeScenarioId === scenario.id}
                      isLoading={isLoading && activeScenarioId === scenario.id}
                      onClick={() => handleScenarioClick(scenario)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Info Badge */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-semibold text-cyan-300 backdrop-blur-sm"
            >
              🧪 Testing Mode: Click a scenario to trigger the 11-agent swarm
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
