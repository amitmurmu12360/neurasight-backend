"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, TerminalSquare, Zap } from "lucide-react";

export type Persona = "CEO" | "CMO" | "VP Sales";

interface ExecutionLogProps {
  persona: Persona;
  onComplete?: () => void;
  boardroomMode?: boolean;
  currentData?: any;
  agentActivities?: Array<{
    agentId: string;
    agentName: string;
    status: "idle" | "active" | "success" | "error";
    message: string;
    timestamp: Date;
  }>;
}

const buildStepsForPersona = (persona: Persona, boardroomMode: boolean, currentData?: any): string[] => {
  const personaLabel = persona === "VP Sales" ? "VP of Sales" : persona;

  if (boardroomMode && currentData) {
    // Executive Narratives for Boardroom Mode
    const arr = currentData?.financials?.arr?.value || 24.3;
    const nrr = currentData?.financials?.nrr?.value || 132;
    const mqls = currentData?.growth?.mqls?.value || 1470;
    
    return [
      `Syncing verified December metrics ($${arr}M ARR)...`,
      `Identifying NRR surge (${nrr}%)...`,
      `Analyzing ${mqls.toLocaleString()} MQL pipeline velocity...`,
      `Calibrating ${personaLabel} strategic lens...`,
      "Cross-referencing Series B benchmarks...",
      "Detecting capital efficiency signals...",
      "Generating Series B strategic brief...",
      "Finalizing board-ready insights...",
      "Dashboard synchronized. Ready for presentation.",
    ];
  }

  // Technical logs for normal mode
  return [
    "Booting NeuraSight cognitive engine...",
    "Establishing encrypted session...",
    `Identified persona: ${personaLabel}.`,
    `Calibrating decision lens for ${personaLabel} priorities...`,
    "Syncing with live revenue, product, and engagement streams...",
    "Connecting to historical benchmarks and market context...",
    `Analyzing KPIs relevant to ${personaLabel}...`,
    "Scanning for trend inflections and latent anomalies...",
    "Scoring risk, upside, and execution constraints...",
    `Synthesizing board-ready narrative for the ${personaLabel}...`,
    "Distilling next-best moves and counterfactual scenarios...",
    "Rendering interactive NeuraSight dashboard...",
    "Finalizing artifacts and verification checks...",
    "Execution pipeline complete. Dashboard ready for review.",
  ];
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.01, // Lightning-fast 10ms stagger for Gemini 2.0 Flash
    },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 4, filter: "blur(2px)" },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.15, ease: "easeOut" } // Faster for 2.0 Flash
  },
};

export default function ExecutionLog({
  persona,
  onComplete,
  boardroomMode = false,
  currentData,
  agentActivities,
}: ExecutionLogProps) {
  // Use agent activities if provided, otherwise use default steps
  const steps = useMemo(() => {
    if (agentActivities && agentActivities.length > 0) {
      return agentActivities.map(activity => 
        `[${activity.agentName}] ${activity.message}`
      );
    }
    return buildStepsForPersona(persona, boardroomMode, currentData);
  }, [persona, boardroomMode, currentData, agentActivities]);
  
  const hasCompletedRef = useRef(false);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-emerald-500/25 bg-slate-950/80 shadow-xl shadow-emerald-500/20 backdrop-blur ${boardroomMode ? 'border-emerald-400/50 shadow-emerald-400/30' : ''}`}>
      {/* Neural Pulse Effect - Cyan Stream */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 0% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 100% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 0% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative flex items-center justify-between border-b border-emerald-500/20 bg-slate-900/80 px-4 py-2 text-xs text-emerald-200">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-emerald-400" />
          <span className="font-medium tracking-wide">
            NeuraSight Execution Log · {persona}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* API Version Badge */}
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
            <Zap className="h-2.5 w-2.5" />
            Engine: Gemini 2.0 Flash (v1 Stable)
          </span>
          <div className="flex items-center gap-1 text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
          </div>
        </div>
      </div>

      <div className="relative flex items-start gap-3 px-4 pb-4 pt-3 text-xs sm:text-sm">
        <div className="mt-1 hidden text-slate-500 sm:block">
          <TerminalSquare className="h-4 w-4" />
        </div>
        <motion.div
          className="flex-1 space-y-1.5 overflow-hidden font-mono text-emerald-100"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={lineVariants}
              transition={{ duration: 0.15, ease: "easeOut" }} // Faster for 2.0 Flash
              onAnimationComplete={() => {
                if (
                  index === steps.length - 1 &&
                  !hasCompletedRef.current
                ) {
                  hasCompletedRef.current = true;
                  onComplete?.();
                }
              }}
              className="flex gap-3"
            >
              <span className="select-none text-emerald-500/70">›</span>
              <span className="whitespace-pre-wrap">{step}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}


