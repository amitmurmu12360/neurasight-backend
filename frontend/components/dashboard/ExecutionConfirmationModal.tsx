/**
 * Execution Confirmation Modal
 * =============================
 * Human-in-the-Loop (HIL) guardrail for authorizing AI-driven data modifications.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, X, TrendingUp } from "lucide-react";
import type { FixPayload, PreviewDiff } from "@/lib/executionAdapter";

interface ExecutionConfirmationModalProps {
  isOpen: boolean;
  fixPayload: FixPayload | null;
  previewDiffs?: PreviewDiff[] | null;
  strategicImpact?: string | null;
  healthBoost?: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function ExecutionConfirmationModal({
  isOpen,
  fixPayload,
  previewDiffs,
  strategicImpact,
  healthBoost,
  onConfirm,
  onCancel,
  isExecuting = false,
}: ExecutionConfirmationModalProps) {
  if (!fixPayload) return null;

  const riskLevel = fixPayload.metadata?.riskLevel || "medium";
  const riskColors = {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-red-400",
  };

  const operationCount = fixPayload.operations.length;
  const hasPreview = previewDiffs && previewDiffs.length > 0;

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
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-4xl bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onCancel}
                disabled={isExecuting}
                className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <ShieldCheck className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-lg font-semibold text-white uppercase tracking-wider mb-1">
                      Authorization Required
                    </h3>
                    <p className="text-sm text-white/60">
                      AI Agent is about to modify your source data. Do you authorize this strategic correction?
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Fix Details Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-white/70 uppercase tracking-wider">
                      Data Source
                    </span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {fixPayload.source === "GOOGLE_SHEETS" ? "Google Sheets" : 
                       fixPayload.source === "CSV" ? "CSV File" : 
                       fixPayload.source === "SQL" ? "SQL Database" : 
                       "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-white/70 uppercase tracking-wider">
                      Operations
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {operationCount} {operationCount === 1 ? "operation" : "operations"}
                    </span>
                  </div>

                  {fixPayload.metadata?.riskLevel && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white/70 uppercase tracking-wider">
                        Risk Level
                      </span>
                      <span className={`text-sm font-semibold ${riskColors[riskLevel]}`}>
                        {riskLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comparison View (Before/After) */}
                {hasPreview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="font-mono text-xs font-semibold text-white/80 uppercase tracking-wider">
                        Strategic Preview
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Before Column (Red-tinted) */}
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                            Current State
                          </span>
                        </div>
                        <div className="space-y-2">
                          {previewDiffs.slice(0, 3).map((diff, idx) => (
                            <div key={idx} className="rounded border border-red-500/10 bg-black/40 p-2">
                              <div className="mb-1 font-mono text-[9px] text-red-300/60 uppercase tracking-wider">
                                {diff.location}
                              </div>
                              <div className="font-mono text-xs font-semibold text-red-300">
                                {typeof diff.before === "number" 
                                  ? diff.before.toLocaleString() 
                                  : String(diff.before)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* After Column (Emerald-tinted) */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                            Proposed State
                          </span>
                        </div>
                        <div className="space-y-2">
                          {previewDiffs.slice(0, 3).map((diff, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1, duration: 0.2 }}
                              className="rounded border border-emerald-500/20 bg-black/60 p-2"
                            >
                              <div className="mb-1 font-mono text-[9px] text-emerald-300/60 uppercase tracking-wider">
                                {diff.location}
                              </div>
                              <div className="font-mono text-xs font-semibold text-emerald-300">
                                {typeof diff.after === "number" 
                                  ? diff.after.toLocaleString() 
                                  : String(diff.after)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>

                    {/* Strategic Impact Section */}
                    {strategicImpact && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            Strategic Impact
                          </span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {strategicImpact}
                        </p>
                        {healthBoost !== null && healthBoost !== undefined && (
                          <div className="mt-3 flex items-center gap-2 rounded border border-emerald-500/20 bg-black/40 px-2 py-1.5">
                            <span className="font-mono text-[10px] text-emerald-300/60 uppercase tracking-wider">
                              Intelligence Health Boost
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              +{healthBoost} points
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* Fallback: Simple Details View */
                  <div className="space-y-3">
                    {fixPayload.metadata?.description && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-sm text-white/70">{fixPayload.metadata.description}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-400 mb-1">Strategic Correction Warning</p>
                        <p className="text-xs text-white/60">
                          This action will modify your source data. Ensure you have reviewed the proposed changes and authorized this correction.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  disabled={isExecuting}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={onConfirm}
                  disabled={isExecuting}
                  whileHover={{ scale: isExecuting ? 1 : 1.02 }}
                  whileTap={{ scale: isExecuting ? 1 : 0.98 }}
                  className="px-6 py-2 text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Authorize & Apply Correction
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

