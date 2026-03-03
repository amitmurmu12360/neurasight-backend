"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SystemOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_GROUPS = {
  ingestion: [
    { id: 0, name: "JANITOR", description: "Cleans and validates raw data, ensuring structural integrity." },
    { id: 1, name: "VALIDATOR", description: "Establishes mathematical truth and verifies data authenticity." },
  ],
  reasoning: [
    { id: 2, name: "AUDITOR", description: "Performs deep mathematical audits and statistical verification." },
    { id: 3, name: "POLICY", description: "Enforces business rules and compliance standards." },
    { id: 5, name: "INTELLIGENCE", description: "Extracts strategic patterns and anomalies." },
    { id: 6, name: "SYNTHESIS", description: "Combines multi-agent outputs into unified intelligence." },
    { id: 7, name: "SENTINEL", description: "Monitors for threats and operational anomalies." },
    { id: 8, name: "ORCHESTRATOR", description: "Coordinates the entire 12-agent swarm execution." },
  ],
  action: [
    { id: 9, name: "ANALYTICS", description: "Generates predictive models and trend analysis." },
    { id: 10, name: "OPTIMIZER", description: "Identifies and executes strategic optimizations." },
    { id: 11, name: "STRATEGIST", description: "Arbitrates conflicts and defines strategic paths." },
    { id: 4, name: "NARRATIVE", description: "Synthesizes insights into executive-ready narratives." },
  ],
};

export default function SystemOverviewModal({ isOpen, onClose }: SystemOverviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
            style={{
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 border border-emerald-500/40 bg-black p-8"
            style={{ 
              borderRadius: "0px",
              backgroundColor: "rgba(0, 0, 0, 0.9)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-emerald-500/20 pb-4">
              <div>
                <h2 className="font-mono text-2xl font-semibold uppercase tracking-wider text-white">
                  ARCHITECTURE MAP
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  NeuraSight's 12-Agent Swarm Architecture
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3-Column Visual Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Ingestion Column */}
              <div className="space-y-4">
                <div className="border-b border-emerald-500/30 pb-2">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    INGESTION
                  </h3>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    Data Validation & Structure
                  </p>
                </div>
                <div className="space-y-3">
                  {AGENT_GROUPS.ingestion.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: agent.id * 0.1 }}
                      className="border border-emerald-500/40 bg-black p-3"
                      style={{ borderRadius: "0px" }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          NODE_{agent.id}
                        </span>
                      </div>
                      <h4 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-white">
                        {agent.name}
                      </h4>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-400">
                        {agent.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reasoning Column */}
              <div className="space-y-4">
                <div className="border-b border-cyan-500/30 pb-2">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    REASONING
                  </h3>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    Analysis & Intelligence
                  </p>
                </div>
                <div className="space-y-3">
                  {AGENT_GROUPS.reasoning.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: agent.id * 0.1 }}
                      className="border border-cyan-500/40 bg-black p-3"
                      style={{ borderRadius: "0px" }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                          NODE_{agent.id}
                        </span>
                      </div>
                      <h4 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-white">
                        {agent.name}
                      </h4>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-400">
                        {agent.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Column */}
              <div className="space-y-4">
                <div className="border-b border-emerald-500/30 pb-2">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    ACTION
                  </h3>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    Execution & Strategy
                  </p>
                </div>
                <div className="space-y-3">
                  {AGENT_GROUPS.action.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: agent.id * 0.1 }}
                      className="border border-emerald-500/40 bg-black p-3"
                      style={{ borderRadius: "0px" }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          NODE_{agent.id}
                        </span>
                      </div>
                      <h4 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-white">
                        {agent.name}
                      </h4>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-400">
                        {agent.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 border-t border-slate-800 pt-4">
              <p className="font-mono text-[10px] text-slate-500">
                Agents operate in parallel and sequence to audit mathematical truth, detect anomalies, and execute self-healing pivots with absolute operational authority.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
