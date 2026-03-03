/**
 * Executive Action Center
 * =======================
 * Displays top 3 high-priority AI recommendations based on
 * persona-aware strategic frameworks (SWOT, AARRR, MEDDIC).
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, AlertCircle, TrendingUp, Target, Sparkles, Bot, Play } from "lucide-react";
import type { PersonaType } from "@/lib/personaStrategies";

export interface Recommendation {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  frameworkTag: "SWOT" | "AARRR" | "MEDDIC" | "General";
  description?: string;
  persona: PersonaType;
}

interface ExecutiveActionCenterProps {
  recommendations: Recommendation[];
  onViewDetails?: (recommendation: Recommendation) => void;
  persona: PersonaType | string;
  onExecuteAgent?: (recommendation: Recommendation) => void;
  onExecuteAutoFix?: (fixPayload: any) => void;
  hasFixPayload?: boolean;
  predictedScoreBoost?: number | null; // Predicted health score boost (e.g., +15)
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

const getPriorityColor = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "high":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        icon: AlertCircle,
      };
    case "medium":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: TrendingUp,
      };
    case "low":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: Target,
      };
  }
};

const getFrameworkColor = (framework: Recommendation["frameworkTag"]) => {
  switch (framework) {
    case "SWOT":
      return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
    case "AARRR":
      return "bg-purple-500/10 border-purple-500/30 text-purple-400";
    case "MEDDIC":
      return "bg-blue-500/10 border-blue-500/30 text-blue-400";
    default:
      return "bg-slate-500/10 border-slate-500/30 text-slate-400";
  }
};

export default function ExecutiveActionCenter({
  recommendations,
  onViewDetails,
  persona,
  onExecuteAgent,
  onExecuteAutoFix,
  hasFixPayload = false,
  predictedScoreBoost = null,
}: ExecutiveActionCenterProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (recommendations.length === 0) {
    return null;
  }

  const getAgentTooltip = (persona: PersonaType | string): string => {
    switch (persona) {
      case "CEO":
        return "Agent will draft a strategic brief for the board.";
      case "CMO":
        return "Agent will optimize the ad spend in the source sheet.";
      case "VP Sales":
        return "Agent will send follow-up triggers to stalled leads.";
      default:
        return "Agent will execute this recommendation automatically.";
    }
  };

  const handleExecuteAgent = (rec: Recommendation) => {
    setProcessingId(rec.id);
    
    // Call the callback if provided
    if (onExecuteAgent) {
      onExecuteAgent(rec);
    }
    
    // Reset processing state after animation
    setTimeout(() => {
      setProcessingId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-200">
            Executive Action Center
          </h3>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
            {persona}
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500">
          {recommendations.length} Priority Action{recommendations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {recommendations.slice(0, 3).map((rec, index) => {
          const priorityStyle = getPriorityColor(rec.priority);
          const PriorityIcon = priorityStyle.icon;
          const frameworkStyle = getFrameworkColor(rec.frameworkTag);

          return (
            <motion.div
              key={rec.id}
              custom={index}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              variants={cardVariants}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-black/60 backdrop-blur-md p-4 shadow-lg shadow-black/40 transition-all"
            >
              {/* Priority Glow Effect (only for high priority) */}
              {rec.priority === "high" && (
                <motion.div
                  className={`absolute inset-0 rounded-xl border-2 ${priorityStyle.border}`}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                      "0 0 20px 4px rgba(239, 68, 68, 0.2)",
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* Content */}
              <div className="relative z-10">
                {/* Framework Badge & Priority */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${frameworkStyle}`}
                  >
                    {rec.frameworkTag}
                  </span>
                  <div
                    className={`flex items-center gap-1 rounded-full border ${priorityStyle.border} ${priorityStyle.bg} px-2 py-0.5`}
                  >
                    <PriorityIcon className={`h-3 w-3 ${priorityStyle.text}`} />
                    <span className={`font-mono text-[10px] font-semibold uppercase ${priorityStyle.text}`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="mb-2 text-sm font-bold text-slate-100 leading-tight">
                  {rec.title}
                </h4>

                {/* Description (if available) */}
                {rec.description && (
                  <p className="mb-3 text-xs leading-relaxed text-slate-400 line-clamp-2">
                    {rec.description}
                  </p>
                )}

                {/* Quick View Button */}
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(rec)}
                    className="group/btn mb-2 flex w-full items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10"
                  >
                    <span>Quick View</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                )}

                {/* Execute via AI Agent Button */}
                <div
                  className={`rounded-lg ${
                    processingId === rec.id
                      ? "bg-gradient-to-r from-emerald-500/60 via-cyan-500/60 to-emerald-500/60 p-[2px]"
                      : "bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 p-[2px]"
                  }`}
                >
                    <motion.button
                      onClick={() => handleExecuteAgent(rec)}
                      disabled={processingId === rec.id}
                      title={getAgentTooltip(persona)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group/agent relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                        processingId === rec.id
                          ? "shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                          : ""
                      }`}
                    >
                      {/* Holographic Gradient Background Effect */}
                      {processingId === rec.id && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          animate={{
                            background: [
                              "linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1))",
                              "linear-gradient(180deg, rgba(34, 211, 238, 0.1), rgba(16, 185, 129, 0.1))",
                              "linear-gradient(270deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1))",
                              "linear-gradient(360deg, rgba(34, 211, 238, 0.1), rgba(16, 185, 129, 0.1))",
                              "linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1))",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      )}

                      {/* Button Content */}
                      <div className="relative z-10 flex items-center gap-2">
                        {processingId === rec.id ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Bot className="h-3.5 w-3.5" />
                            </motion.div>
                            <span className="font-mono">Agent Preparing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Execute via AI Agent</span>
                          </>
                        )}
                      </div>

                      {/* Coming Soon Badge */}
                      {processingId !== rec.id && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -right-1 -top-1 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-cyan-400"
                        >
                          Soon
                        </motion.span>
                      )}
                    </motion.button>
                </div>

                {/* APPLY STRATEGIC FIX Button (when fix payload is available) */}
                {hasFixPayload && index === 0 && onExecuteAutoFix && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-2"
                  >
                    <motion.button
                      onClick={() => onExecuteAutoFix(null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group/autofix relative w-full overflow-hidden rounded-lg border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                    >
                      {/* High-glow Emerald pulse effect */}
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(16, 185, 129, 0.4)",
                            "0 0 30px 8px rgba(16, 185, 129, 0.6)",
                            "0 0 0 0 rgba(16, 185, 129, 0.4)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{ pointerEvents: "none" }}
                      />
                      
                      {/* Animated gradient overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <Play className="h-4 w-4" />
                        <span className="font-mono uppercase tracking-wider">APPLY STRATEGIC FIX</span>
                        
                        {/* Predicted Score Boost Badge */}
                        {predictedScoreBoost !== null && predictedScoreBoost > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ml-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          >
                            +{predictedScoreBoost} Health
                          </motion.span>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                )}

                {/* Inline Message (when processing) */}
                <AnimatePresence>
                  {processingId === rec.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5"
                    >
                      <p className="text-[10px] font-mono text-cyan-400">
                        Integration Coming Soon.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
