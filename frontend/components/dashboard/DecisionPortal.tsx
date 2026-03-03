"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, TrendingUp, Shield, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { playPing, playThrum } from "@/lib/utils/sound";

// =============================================================================
// TYPES
// =============================================================================
export interface StrategicOption {
  id: "aggressive" | "balanced" | "defensive";
  title: string;
  description: string;
  probabilityScore: number; // 0-100
  impact: string;
  riskLevel: "low" | "medium" | "high";
  timeframe: string;
}

interface DecisionPortalProps {
  /** Array of 3 strategic options (Aggressive, Balanced, Defensive) */
  options: StrategicOption[];
  /** Callback when user selects an option */
  onSelect: (option: StrategicOption) => void;
  /** Callback to close/cancel */
  onClose: () => void;
  /** Whether the modal is visible */
  isOpen: boolean;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const cardVariants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};

// =============================================================================
// CARD STYLES (Neon Glow Configurations)
// =============================================================================
const cardStyles = {
  aggressive: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.4)]",
    hoverGlow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]",
    text: "text-emerald-300",
    icon: TrendingUp,
    label: "AGGRESSIVE",
  },
  balanced: {
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.4)]",
    hoverGlow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]",
    text: "text-cyan-300",
    icon: Target,
    label: "BALANCED",
  },
  defensive: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.4)]",
    hoverGlow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]",
    text: "text-amber-300",
    icon: Shield,
    label: "DEFENSIVE",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function DecisionPortal({
  options,
  onSelect,
  onClose,
  isOpen,
}: DecisionPortalProps) {
  // Play ping sound when portal opens
  useEffect(() => {
    if (isOpen && options.length > 0) {
      playPing();
    }
  }, [isOpen, options.length]);

  if (!isOpen || options.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl px-4"
            >
              {/* Glassmorphism Container */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl">
                {/* Subtle grid pattern overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Header */}
                <div className="relative mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-mono text-2xl font-bold uppercase tracking-wider text-white">
                      SOVEREIGN DECISION ENGINE
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Select a strategic path to execute
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="group flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Strategic Options Grid */}
                <div className="relative grid gap-6 md:grid-cols-3">
                  {options.map((option, index) => {
                    const style = cardStyles[option.id];
                    const Icon = style.icon;

                    return (
                      <motion.button
                        key={option.id}
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => onSelect(option)}
                        className={`group relative overflow-hidden rounded-xl border ${style.border} ${style.bg} ${style.glow} ${style.hoverGlow} p-6 text-left transition-all`}
                      >
                        {/* Neon Glow Pulse Effect */}
                        <motion.div
                          className={`absolute inset-0 ${style.bg}`}
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon & Label */}
                          <div className="mb-4 flex items-center justify-between">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg} border ${style.border}`}
                            >
                              <Icon className={`h-5 w-5 ${style.text}`} />
                            </div>
                            <span
                              className={`font-mono text-xs font-semibold uppercase tracking-wider ${style.text}`}
                            >
                              {style.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="mb-2 font-mono text-lg font-bold text-white">
                            {option.title}
                          </h3>

                          {/* Description */}
                          <p className="mb-4 text-sm leading-relaxed text-slate-300">
                            {option.description}
                          </p>

                          {/* Probability Score */}
                          <div className="mb-4 rounded-lg border border-white/10 bg-black/40 p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                                STRATEGIC PROBABILITY
                              </span>
                              <span
                                className={`font-mono text-lg font-bold ${style.text}`}
                              >
                                {option.probabilityScore}%
                              </span>
                            </div>
                            {/* Progress Bar with Pulse Animation */}
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                              <motion.div
                                className={`h-full ${style.bg.replace("/10", "")}`}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${option.probabilityScore}%`,
                                  opacity: [0.8, 1, 0.8],
                                }}
                                transition={{
                                  width: {
                                    duration: 0.8,
                                    delay: index * 0.1,
                                    ease: "easeOut",
                                  },
                                  opacity: {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                IMPACT
                              </span>
                              <p className="mt-1 text-xs font-medium text-slate-200">
                                {option.impact}
                              </p>
                            </div>
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                TIMEFRAME
                              </span>
                              <p className="mt-1 text-xs font-medium text-slate-200">
                                {option.timeframe}
                              </p>
                            </div>
                          </div>

                          {/* Risk Level Badge with Icon */}
                          <div className="mt-4 flex items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                              {option.id === "aggressive" && (
                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                              )}
                              {option.id === "defensive" && (
                                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                              )}
                              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                                RISK:
                              </span>
                              <span
                                className={`font-mono text-xs font-semibold uppercase ${
                                  option.riskLevel === "high"
                                    ? "text-red-400"
                                    : option.riskLevel === "medium"
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {option.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hover Glow Overlay */}
                        <div
                          className={`pointer-events-none absolute -inset-1 ${style.bg.replace("/10", "/20")} opacity-0 blur-xl transition-opacity group-hover:opacity-100`}
                        />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Risk Disclosure */}
                <div className="relative mt-8 border-t border-white/10 pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400/60 flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 leading-relaxed">
                      RISK DISCLOSURE: Strategic decisions are based on verified metrics and AI analysis. 
                      Outcomes may vary. Review all projections before execution. NeuraSight provides decision support, not guarantees.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
