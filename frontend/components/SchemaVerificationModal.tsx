/**
 * Schema Verification Modal - The Verification Gate
 * ==================================================
 * Shows raw headers and Agent 1 (Sentinel) mapping before full analysis begins.
 * Provides "Explainable AI" experience with user approval.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, ArrowRight, FileSpreadsheet, Loader2 } from "lucide-react";

interface ColumnMapping {
  arr_column?: string | null;
  mql_column?: string | null;
  cac_column?: string | null;
  nrr_column?: string | null;
  company_name_column?: string | null;
}

interface SchemaVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  rawHeaders: string[];
  mapping: ColumnMapping;
  fileName?: string;
}

const CORE_METRICS = [
  { key: "arr_column", label: "ARR (Annual Recurring Revenue)", icon: "💰" },
  { key: "mql_column", label: "MQLs (Marketing Qualified Leads)", icon: "📈" },
  { key: "cac_column", label: "CAC (Customer Acquisition Cost)", icon: "💵" },
  { key: "nrr_column", label: "NRR (Net Revenue Retention)", icon: "🔄" },
];

export default function SchemaVerificationModal({
  isOpen,
  onClose,
  onApprove,
  rawHeaders,
  mapping,
  fileName,
}: SchemaVerificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const mappedCount = Object.values(mapping).filter((v) => v !== null && v !== undefined).length;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove();
      // Modal will close automatically after swarm execution completes
    } catch (error) {
      console.error("Approval error:", error);
      setIsProcessing(false);
    }
  };

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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="border-b border-slate-800 bg-gradient-to-r from-slate-800/90 to-slate-900/90 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                      <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">
                        Schema Verification Gate
                      </h2>
                      <p className="text-xs text-slate-400">
                        Agent 1: Data Sentinel mapping preview
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-6 p-6">
                {/* File Info */}
                {fileName && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">{fileName}</span>
                    </div>
                  </div>
                )}

                {/* Mapping Summary */}
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-200">Mapping Summary</h3>
                    <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-400">
                      {mappedCount}/4 core metrics mapped
                    </span>
                  </div>

                  {/* Core Metrics Mapping */}
                  <div className="space-y-2">
                    {CORE_METRICS.map((metric) => {
                      const mappedColumn = mapping[metric.key as keyof ColumnMapping];
                      const isMapped = mappedColumn !== null && mappedColumn !== undefined;

                      return (
                        <motion.div
                          key={metric.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            isMapped
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-slate-700 bg-slate-900/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{metric.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-slate-200">{metric.label}</p>
                              {isMapped ? (
                                <p className="text-xs text-emerald-400">
                                  → <span className="font-mono font-semibold">{mappedColumn}</span>
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500">Not mapped</p>
                              )}
                            </div>
                          </div>
                          {isMapped ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-slate-600" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Raw Headers */}
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-200">Raw Headers Detected</h3>
                  <div className="flex flex-wrap gap-2">
                    {rawHeaders.map((header, index) => {
                      const isMapped = Object.values(mapping).includes(header);
                      return (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-mono ${
                            isMapped
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-600 bg-slate-900/50 text-slate-400"
                          }`}
                        >
                          {header}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                {/* Warning if low mapping */}
                {mappedCount < 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-400">
                        Low Mapping Confidence
                      </p>
                      <p className="mt-1 text-xs text-amber-300/80">
                        Only {mappedCount} of 4 core metrics were mapped. The analysis may be
                        incomplete, but you can proceed to review.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-800/30 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting & Analyzing...
                    </>
                  ) : (
                    <>
                      Approve & Analyze
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

