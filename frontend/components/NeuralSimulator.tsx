/**
 * NeuralSimulator - What-If Engine Component
 * ===========================================
 * Interactive component for running predictive scenarios using Gemini 2.0 Flash.
 * Allows users to input "What If" scenarios and see predicted dashboard states.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, TrendingUp, TrendingDown, Loader2, X } from "lucide-react";
import type { DashboardState } from "@/types/dashboard";
import { safeFormat } from "@/lib/intelligence";

interface NeuralSimulatorProps {
  currentData: DashboardState;
  onClose?: () => void;
  onPredictionComplete?: (explanation: string) => void;
}

interface PredictedState {
  financials: {
    arr: { value: number; growth_yoy: number };
    nrr: { value: number };
    burn_multiple: { value: number };
  };
  growth: {
    mqls: { value: number; growth_mom: number };
    cac: { value: number };
  };
  sales: {
    deals_closed: { value: number };
  };
  explanation: string; // Concise 2-sentence vocal summary
  detailed_explanation?: string; // Detailed analysis for visual display
}

export default function NeuralSimulator({
  currentData,
  onClose,
  onPredictionComplete,
}: NeuralSimulatorProps) {
  const [scenario, setScenario] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictedState, setPredictedState] = useState<PredictedState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!scenario.trim()) {
      setError("Please enter a scenario");
      return;
    }

    setIsSimulating(true);
    setError(null);
    setPredictedState(null);

    try {
      const response = await fetch("/api/simulate-whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenario.trim(),
          current_state: currentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prediction");
      }

      const result = await response.json();
      setPredictedState(result.predicted_state);
      
      // Trigger speech callback when prediction completes
      if (result.predicted_state?.explanation && onPredictionComplete) {
        onPredictionComplete(result.predicted_state.explanation);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to simulate scenario"
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const calculateChange = (
    current: number,
    predicted: number
  ): { value: number; percentage: number; isPositive: boolean } => {
    const change = predicted - current;
    const percentage = current > 0 ? (change / current) * 100 : 0;
    // FIX WHAT-IF ENGINE PRECISION: Apply .toFixed(1) to percentage to eliminate long strings like 520.9468...%
    const percentageRounded = parseFloat(Math.abs(percentage).toFixed(1));
    return {
      value: change,
      percentage: percentageRounded,
      isPositive: change >= 0,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 shadow-xl"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <Brain className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Neural Simulator
            </h3>
            <p className="text-xs text-slate-400">
              What-If Engine powered by Gemini 2.0 Flash
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scenario Input */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          What-If Scenario
        </label>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="e.g., Increase MQLs by 15%, Reduce CAC by 20%, Improve NRR to 140%"
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          rows={3}
          disabled={isSimulating}
        />
        <button
          onClick={handleSimulate}
          disabled={isSimulating || !scenario.trim()}
          className="mt-3 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Zap className="mr-2 inline h-4 w-4" />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Comparison Results */}
      <AnimatePresence>
        {predictedState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <h4 className="mb-4 text-sm font-semibold text-cyan-400">
                Predicted Impact Analysis
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">
                {predictedState.detailed_explanation || predictedState.explanation}
              </p>
            </div>

            {/* Side-by-Side Comparison with Ghost Effect */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current State - Solid Emerald */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 to-slate-900/80 p-5 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
              >
                <div className="absolute inset-0 rounded-xl bg-emerald-500/5" />
                <div className="relative z-10">
                  <h5 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    Current Reality
                  </h5>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        label: "ARR",
                        value: `$${currentData.financials.arr.value}M`,
                        growth: `+${currentData.financials.arr.growth_yoy}% YoY`,
                      },
                      {
                        label: "NRR",
                        value: `${currentData.financials.nrr.value}%`,
                        growth: "World Class",
                      },
                      {
                        label: "MQLs",
                        value: currentData.growth.mqls.value.toLocaleString(),
                        growth: `+${currentData.growth.mqls.growth_mom}% MoM`,
                      },
                      {
                        label: "CAC",
                        value: `$${currentData.growth.cac.value}`,
                        growth: "Optimizing",
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2"
                      >
                        <span className="text-slate-300">{metric.label}:</span>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">
                            {metric.value}
                          </div>
                          <div className="text-[10px] text-emerald-500/70">
                            {metric.growth}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Predicted State - Ghost Effect with Pulse */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative rounded-xl border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-slate-950/60 p-5 shadow-2xl shadow-cyan-400/30 backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(2, 6, 23, 0.6) 100%)",
                }}
              >
                {/* Ghost Pulse Animation */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-cyan-400/40"
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                    boxShadow: [
                      "0 0 0 0 rgba(34, 211, 238, 0.4)",
                      "0 0 20px 4px rgba(34, 211, 238, 0.3)",
                      "0 0 0 0 rgba(34, 211, 238, 0.4)",
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative z-10">
                  <h5 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-cyan-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    AI Future (Ghost)
                  </h5>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        label: "ARR",
                        current: currentData.financials.arr.value,
                        predicted: predictedState.financials.arr.value,
                        format: (v: number) => `$${v}M`,
                      },
                      {
                        label: "NRR",
                        current: currentData.financials.nrr.value,
                        predicted: predictedState.financials.nrr.value,
                        format: (v: number) => `${v}%`,
                      },
                      {
                        label: "MQLs",
                        current: currentData.growth.mqls.value,
                        predicted: predictedState.growth.mqls.value,
                        format: (v: number) => v.toLocaleString(),
                      },
                      {
                        label: "CAC",
                        current: currentData.growth.cac.value,
                        predicted: predictedState.growth.cac.value,
                        format: (v: number) => `$${v}`,
                      },
                    ].map((metric) => {
                      const change = calculateChange(
                        metric.current,
                        metric.predicted
                      );
                      return (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center justify-between rounded-lg border border-cyan-400/30 bg-cyan-950/10 px-3 py-2 backdrop-blur-sm"
                        >
                          <span className="text-slate-400">{metric.label}:</span>
                          <div className="text-right">
                            <motion.div
                              className="font-bold text-cyan-300"
                              animate={{
                                opacity: [0.7, 1, 0.7],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              {metric.format(metric.predicted)}
                            </motion.div>
                            {change.percentage > 0 && (
                              <div
                                className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold ${
                                  change.isPositive
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {change.isPositive ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {/* FIX WHAT-IF ENGINE PRECISION: Apply safeFormat to eliminate long strings like 520.9468...% */}
                                {safeFormat(change.percentage, "percentage", { decimals: 1 })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

