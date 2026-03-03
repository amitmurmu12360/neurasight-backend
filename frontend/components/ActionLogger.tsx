/**
 * ActionLogger - Real-time Agentic Thought Logger
 * ================================================
 * A premium terminal-style component that displays AI thinking steps
 * with animated icons and smooth scrolling effects.
 */

"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Zap,
  Database,
  FileSpreadsheet,
  Shield,
  Sparkles,
  Terminal,
  Search,
  Scan,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
export type ThoughtStatus = "pending" | "active" | "success" | "warning" | "error";

export interface ThoughtStep {
  id: string;
  message: string;
  status: ThoughtStatus;
  icon?: "brain" | "database" | "sheet" | "shield" | "zap" | "sparkles" | "terminal" | "search" | "scan";
  timestamp?: Date;
}

interface ActionLoggerProps {
  thoughts: ThoughtStep[];
  title?: string;
  className?: string;
}

// =============================================================================
// ICON MAPPING
// =============================================================================
const iconMap = {
  brain: Brain,
  database: Database,
  sheet: FileSpreadsheet,
  shield: Shield,
  zap: Zap,
  sparkles: Sparkles,
  terminal: Terminal,
  search: Search,
  scan: Scan,
};

// =============================================================================
// STATUS STYLING
// =============================================================================
function getStatusStyles(status: ThoughtStatus) {
  switch (status) {
    case "active":
      return {
        textColor: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        iconColor: "text-emerald-400",
      };
    case "success":
      return {
        textColor: "text-emerald-300",
        bgColor: "bg-emerald-500/5",
        borderColor: "border-emerald-500/20",
        iconColor: "text-emerald-400",
      };
    case "warning":
      return {
        textColor: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        iconColor: "text-amber-400",
      };
    case "error":
      return {
        textColor: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        iconColor: "text-red-400",
      };
    default: // pending
      return {
        textColor: "text-slate-500",
        bgColor: "bg-slate-800/30",
        borderColor: "border-slate-700/30",
        iconColor: "text-slate-500",
      };
  }
}

// =============================================================================
// STATUS ICON COMPONENT
// =============================================================================
function StatusIcon({ status }: { status: ThoughtStatus }) {
  switch (status) {
    case "active":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-3.5 w-3.5 text-emerald-400" />
        </motion.div>
      );
    case "success":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </motion.div>
      );
    case "warning":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        </motion.div>
      );
    case "error":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        </motion.div>
      );
    default:
      return <div className="h-3.5 w-3.5 rounded-full bg-slate-600" />;
  }
}

// =============================================================================
// TYPING ANIMATION COMPONENT
// =============================================================================
function TypingText({ text, isActive }: { text: string; isActive: boolean }) {
  if (!isActive) {
    return <span>{text}</span>;
  }

  return (
    <span className="relative">
      {text}
      <motion.span
        className="ml-0.5 inline-block h-4 w-1.5 bg-emerald-400"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      />
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function ActionLogger({
  thoughts,
  title = "NeuraSight Brain Trace",
  className = "",
}: ActionLoggerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new thoughts are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
        {/* macOS-style traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="font-mono text-xs font-medium text-slate-400">
            {title}
          </span>
        </div>
        {/* Pulse indicator */}
        <div className="flex items-center gap-1.5">
          <motion.div
            className="h-2 w-2 rounded-full bg-emerald-500"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
                "0 0 0 8px rgba(16, 185, 129, 0)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-mono text-[10px] text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="max-h-[280px] min-h-[180px] overflow-y-auto p-4 font-mono text-xs scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
      >
        <AnimatePresence mode="popLayout">
          {thoughts.map((thought, index) => {
            const styles = getStatusStyles(thought.status);
            const IconComponent = thought.icon ? iconMap[thought.icon] : null;

            return (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.2, // Faster for Gemini 2.0 Flash
                  delay: index * 0.01, // 10ms stagger (lightning fast)
                  ease: "easeOut",
                }}
                className={`mb-2 flex items-start gap-3 rounded-lg border px-3 py-2 ${styles.bgColor} ${styles.borderColor}`}
              >
                {/* Status Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  <StatusIcon status={thought.status} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent className={`h-3 w-3 ${styles.iconColor}`} />
                    )}
                    <span className={`${styles.textColor} leading-relaxed`}>
                      <TypingText
                        text={thought.message}
                        isActive={thought.status === "active"}
                      />
                    </span>
                  </div>
                  {thought.timestamp && (
                    <span className="mt-1 block text-[10px] text-slate-600">
                      {thought.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Step number */}
                <div className="flex-shrink-0 rounded bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {thoughts.length === 0 && (
          <div className="flex h-32 items-center justify-center text-slate-600">
            <Terminal className="mr-2 h-4 w-4" />
            Waiting for brain activity...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/50 px-4 py-2">
        <span className="font-mono text-[10px] text-slate-500">
          {thoughts.filter((t) => t.status === "success").length}/{thoughts.length} steps complete
        </span>
        <span className="font-mono text-[10px] text-cyan-400">
          powered by models/gemini-2.0-flash (v1)
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// PRESET THOUGHT SEQUENCES
// =============================================================================
export const ANALYSIS_THOUGHTS: Omit<ThoughtStep, "id" | "status">[] = [
  {
    message: "Establishing secure connection to data source...",
    icon: "database",
  },
  {
    message: "Parsing CSV & normalizing metric schema...",
    icon: "sheet",
  },
  {
    message: "Left Brain: Injecting SaaS Benchmark Policy...",
    icon: "shield",
  },
  {
    message: "Policy thresholds loaded: ARR, Burn, NRR, LTV/CAC",
    icon: "shield",
  },
  {
    message: "Right Brain: Initializing Gemini 2.0 Flash...",
    icon: "brain",
  },
  {
    message: "Running strategic pattern recognition...",
    icon: "zap",
  },
  {
    message: "Cross-referencing against policy benchmarks...",
    icon: "sparkles",
  },
  {
    message: "Generating CEO-level strategic insights...",
    icon: "brain",
  },
];

