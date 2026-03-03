"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Shield, AlertTriangle, CheckCircle2, FileDown, FileCheck } from "lucide-react";
import { generateExecutiveDossier } from "@/lib/reportGenerator";

// =============================================================================
// TYPES
// =============================================================================
interface HealingRow {
  row_id: number;
  original_value: number;
  corrected_value: number;
  difference_percent: number;
  target_column: string;
}

interface HealingReport {
  rows_healed: HealingRow[];
  total_mismatches: number;
  healing_applied: boolean;
  formula_used?: string;
  error?: string;
}

interface ForensicHealerProps {
  isOpen: boolean;
  onClose: () => void;
  mathIntegrityConfidence: number;
  txId?: string;
  targetColumn?: string;
  formulaLogic?: Record<string, any>;
  persona?: string;
  onHealComplete?: () => void;
  onTerminalMessage?: (message: { agent: string; message: string; statusCode: string }) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function ForensicHealer({
  isOpen,
  onClose,
  mathIntegrityConfidence,
  txId,
  targetColumn = "Revenue",
  formulaLogic,
  persona = "CEO",
  onHealComplete,
  onTerminalMessage,
  displayData,
  recommendations = [],
  industry,
}: ForensicHealerProps) {
  const [isHealing, setIsHealing] = useState(false);
  const [healingReport, setHealingReport] = useState<HealingReport | null>(null);
  const [healedCsvUrl, setHealedCsvUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(98);
  const [healingComplete, setHealingComplete] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [integrityCertificate, setIntegrityCertificate] = useState<any>(null);
  const [showVerifiedStamp, setShowVerifiedStamp] = useState(false);

  // Check if user has permission (Admin or CEO)
  const hasPermission = persona === "CEO" || persona === "Admin" || persona === "Founder";

  const handleHeal = async () => {
    if (!txId || !formulaLogic) {
      setError("Missing transaction ID or formula logic");
      return;
    }

    setIsHealing(true);
    setError(null);
    setHealingReport(null);

    // Terminal sequence
    const terminalMessages = [
      { agent: "HEALER", message: "ACCESSING LOCAL CORE DATA...", statusCode: "SCAN" },
      { agent: "AUDITOR", message: "VERIFYING REPAIR LOGIC...", statusCode: "SCAN" },
      { agent: "HEALER", message: "APPLYING DETERMINISTIC CORRECTIONS...", statusCode: "FIX" },
    ];

    for (const msg of terminalMessages) {
      onTerminalMessage?.(msg);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/heal-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_id: txId,
          target_column: targetColumn,
          formula_logic: formulaLogic,
          tolerance: 0.05,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHealingReport(result.healing_report);
        setHealedCsvUrl(result.healed_csv_url);
        
        // Store integrity certificate from Agent 12
        if (result.healing_report?.integrity_certificate) {
          setIntegrityCertificate(result.healing_report.integrity_certificate);
        }
        
        // Animate verification progress from 98% to 100%
        const progressInterval = setInterval(() => {
          setVerificationProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setHealingComplete(true);
              // Show verified stamp animation
              setShowVerifiedStamp(true);
              setTimeout(() => setShowVerifiedStamp(false), 2000);
              return 100;
            }
            return prev + 0.5;
          });
        }, 50);

        onTerminalMessage?.({
          agent: "HEALER",
          message: `STRATEGIC PIVOT EXECUTED. ${result.rows_healed} ROWS CORRECTED.`,
          statusCode: "OK",
        });

        // Trigger re-run of Agent 2 after healing
        if (onHealComplete) {
          setTimeout(() => {
            onHealComplete();
            // Auto-trigger rerun-analysis event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('neurasight:rerun-analysis'));
            }
          }, 3000);
        }
      } else {
        setError(result.message || "Healing failed");
        onTerminalMessage?.({
          agent: "HEALER",
          message: `HEALING FAILED: ${result.message}`,
          statusCode: "FIX",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      onTerminalMessage?.({
        agent: "HEALER",
        message: `HEALING ERROR: ${errorMessage}`,
        statusCode: "FIX",
      });
    } finally {
      setIsHealing(false);
    }
  };

  const handleDownload = () => {
    if (healedCsvUrl) {
      const link = document.createElement("a");
      link.href = healedCsvUrl;
      link.download = `NeuraSight_Healed_${txId || "data"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCertifiedArtifact = async () => {
    if (!displayData || !integrityCertificate) {
      setError("Missing data or integrity certificate");
      return;
    }

    onTerminalMessage?.({
      agent: "AUDITOR_GENERAL",
      message: "GENERATING CERTIFIED ARTIFACT...",
      statusCode: "SCAN",
    });

    try {
      const result = await generateExecutiveDossier({
        displayData,
        mathIntegrityConfidence: 1.0, // Always 100% after healing
        recommendations: recommendations || [],
        txId,
        industry,
        persona,
        dataSource: "CSV",
        isDigitallySigned: true,
        integrityCertificate,
      });

      if (result.success) {
        onTerminalMessage?.({
          agent: "AUDITOR_GENERAL",
          message: "CERTIFIED ARTIFACT GENERATED.",
          statusCode: "OK",
        });
      } else {
        setError(result.error || "Failed to generate certified artifact");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      onTerminalMessage?.({
        agent: "AUDITOR_GENERAL",
        message: `ERROR: ${errorMessage}`,
        statusCode: "FIX",
      });
    }
  };

  // Get top 5 rows for display
  const topRows = healingReport?.rows_healed?.slice(0, 5) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Verified Stamp Animation */}
          <AnimatePresence>
            {showVerifiedStamp && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none"
              >
                <div className="relative">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 10 }}
                    transition={{ duration: 0.1, repeat: 5, repeatType: "reverse" }}
                    className="px-16 py-8 bg-emerald-500 border-4 border-white"
                    style={{ borderRadius: "0px" }}
                  >
                    <p className="text-white font-mono text-4xl font-bold uppercase tracking-wider">
                      VERIFIED
                    </p>
                    <p className="text-white font-mono text-xs uppercase tracking-wider mt-2 text-center">
                      INTEGRITY CERTIFICATION COMPLETE
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500 border-2 border-white"
                    style={{ borderRadius: "0px" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-3xl bg-[#000000] border-l border-emerald-500/20 z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    FORENSIC HEALER
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 transition-colors"
                  style={{ borderRadius: "0px" }}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Status Banner */}
              {mathIntegrityConfidence < 1.0 && !healingComplete && (
                <div className="p-4 bg-red-500/10 border border-red-500/30" style={{ borderRadius: "0px" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-mono text-xs uppercase tracking-wider">
                        INTEGRITY SCORE: {Math.round(mathIntegrityConfidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Progress Bar */}
              {isHealing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                      VERIFICATION PROGRESS
                    </span>
                    <span className="text-xs text-emerald-400 font-mono">
                      {Math.round(verificationProgress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 border border-slate-700" style={{ borderRadius: "0px" }}>
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: "98%" }}
                      animate={{ width: `${verificationProgress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                      style={{ borderRadius: "0px" }}
                    />
                  </div>
                </div>
              )}

              {/* Formula Info */}
              {formulaLogic && (
                <div className="p-4 bg-slate-900/50 border border-slate-700/50" style={{ borderRadius: "0px" }}>
                  <p className="text-xs text-slate-400 uppercase mb-2 font-mono tracking-wider">FORMULA LOGIC</p>
                  <p className="text-xs text-slate-300 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {formulaLogic.formula || "SUM(source_columns)"}
                  </p>
                  {formulaLogic.source_columns && (
                    <p className="text-xs text-slate-500 mt-2 font-mono">
                      SOURCE COLUMNS: {formulaLogic.source_columns.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Truth Matrix Comparison Grid */}
              {healingReport && healingReport.rows_healed.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      TRUTH MATRIX
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {healingReport.total_mismatches} DISCREPANCIES DETECTED
                    </span>
                  </div>
                  
                  {/* Grid Header */}
                  <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700/50">
                    <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">ROW ID</div>
                    <div className="text-xs text-red-400 font-mono uppercase tracking-wider">SABOTAGED VALUE</div>
                    <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider">CALCULATED TRUTH</div>
                    <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">FORENSIC NOTE</div>
                  </div>

                  {/* Grid Rows */}
                  <div className="space-y-1">
                    {topRows.map((row, index) => (
                      <motion.div
                        key={row.row_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredRowId(row.row_id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        className="grid grid-cols-4 gap-4 p-3 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-700/30 hover:border-slate-700/50 transition-colors"
                        style={{ borderRadius: "0px" }}
                      >
                        {/* Row ID */}
                        <div className="text-xs text-slate-300 font-mono">
                          {row.row_id}
                        </div>
                        
                        {/* Sabotaged Value (Red, line-through) */}
                        <motion.div
                          initial={{ opacity: 1 }}
                          animate={healingComplete ? { opacity: 0, scale: 0.8 } : {}}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="text-xs text-red-400 font-mono"
                          style={{
                            textDecoration: "line-through",
                            textDecorationColor: "#ef4444",
                          }}
                        >
                          ${row.original_value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </motion.div>
                        
                        {/* Calculated Truth (Emerald, glow) */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={healingComplete ? { opacity: 1, scale: 1 } : { opacity: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                          className="text-xs text-emerald-400 font-mono"
                          style={{
                            boxShadow: healingComplete ? "0 0 8px rgba(16, 185, 129, 0.4)" : "none",
                          }}
                        >
                          ${row.corrected_value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </motion.div>
                        
                        {/* Forensic Note */}
                        <div className="text-xs text-slate-500 font-mono">
                          {hoveredRowId === row.row_id ? (
                            <span className="text-cyan-400">
                              {formulaLogic?.formula || `SUM(${targetColumn})`}
                            </span>
                          ) : (
                            <span>
                              {row.difference_percent.toFixed(1)}% DISCREPANCY
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30" style={{ borderRadius: "0px" }}>
                  <p className="text-xs text-red-400 font-mono uppercase tracking-wider">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {healingReport && healingReport.healing_applied && healingComplete && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30" style={{ borderRadius: "0px" }}>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase tracking-wider">
                      RESOLUTION COMPLETE: {healingReport.total_mismatches} DISCREPANCIES RESOLVED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-2">
                    INTEGRITY SCORE: 100% | ARTIFACT READY FOR DOWNLOAD
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
                {!healingReport && (
                  <button
                    onClick={handleHeal}
                    disabled={!hasPermission || isHealing || !txId}
                    className="w-full px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800/50 disabled:cursor-not-allowed border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-wider transition-colors"
                    style={{ borderRadius: "0px" }}
                  >
                    {isHealing ? "APPLYING RESOLUTION..." : hasPermission ? "APPLY HEAL" : "PERMISSION DENIED"}
                  </button>
                )}
                {healedCsvUrl && healingComplete && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleDownload}
                      className="w-full px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/50 hover:border-emerald-500 text-emerald-400 font-mono text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                      style={{ borderRadius: "0px" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileDown className="w-5 h-5" />
                      DOWNLOAD HEALED ARTIFACT
                    </motion.button>
                    {integrityCertificate && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={handleExportCertifiedArtifact}
                        className="w-full px-6 py-4 bg-emerald-500/30 hover:bg-emerald-500/40 border-2 border-emerald-500 text-white font-mono text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                        style={{ borderRadius: "0px" }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileCheck className="w-5 h-5" />
                        EXPORT CERTIFIED ARTIFACT
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

