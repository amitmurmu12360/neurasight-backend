"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ChevronDown } from "lucide-react";

export type ToleranceLevel = "STRICT" | "STANDARD" | "AGILE";

interface SovereignGovernanceProps {
  isWriteEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  currentTxId?: string;
  toleranceLevel?: ToleranceLevel;
  onToleranceChange?: (level: ToleranceLevel) => void;
}

export default function SovereignGovernance({
  isWriteEnabled,
  onToggle,
  currentTxId,
  toleranceLevel = "STANDARD",
  onToleranceChange,
}: SovereignGovernanceProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToleranceMenu, setShowToleranceMenu] = useState(false);

  const toleranceLevels: Array<{ level: ToleranceLevel; label: string; tolerance: string }> = [
    { level: "STRICT", label: "STRICT", tolerance: "0%" },
    { level: "STANDARD", label: "STANDARD", tolerance: "0.5%" },
    { level: "AGILE", label: "AGILE", tolerance: "2%" },
  ];

  useEffect(() => {
    if (isWriteEnabled) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isWriteEnabled]);

  return (
    <div className="flex items-center gap-3">
      {/* TX-ID Display */}
      {currentTxId && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {currentTxId}
        </span>
      )}

      {/* Tolerance Level Selector */}
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => setShowToleranceMenu(!showToleranceMenu)}
          className="relative flex items-center gap-2 border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-400 transition-all hover:border-cyan-500/60"
          style={{ borderRadius: "0px" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shield className="h-3 w-3" />
          <span>{toleranceLevel}</span>
          <span className="text-[9px] text-slate-500">
            ({toleranceLevels.find((t) => t.level === toleranceLevel)?.tolerance})
          </span>
          <ChevronDown className="h-3 w-3" />
        </motion.button>

        {/* Tolerance Menu */}
        {showToleranceMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 z-50 mt-1 border border-slate-800 bg-black"
            style={{ borderRadius: "0px" }}
          >
            {toleranceLevels.map((level) => (
              <button
                key={level.level}
                type="button"
                onClick={() => {
                  onToleranceChange?.(level.level);
                  setShowToleranceMenu(false);
                }}
                className={`w-full border-b border-slate-800 px-4 py-2 text-left font-mono text-[10px] uppercase tracking-wider transition-colors last:border-b-0 ${
                  toleranceLevel === level.level
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
                style={{ borderRadius: "0px" }}
              >
                <div className="flex items-center justify-between">
                  <span>{level.label}</span>
                  <span className="text-[9px] text-slate-500">{level.tolerance}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Governance Toggle */}
      <motion.button
        type="button"
        onClick={() => onToggle(!isWriteEnabled)}
        className={`relative flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
          isWriteEnabled
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
            : "border-slate-700 bg-black text-slate-400"
        }`}
        style={{ borderRadius: "0px" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Pulsing border when Write is enabled */}
        {isWriteEnabled && (
          <motion.div
            className="absolute inset-0 border border-emerald-500"
            style={{ borderRadius: "0px" }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
                "0 0 20px 4px rgba(16, 185, 129, 0.2)",
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Icon */}
        {isWriteEnabled ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <Shield className="h-3 w-3" />
        )}

        {/* Status Text */}
        <span>
          {isWriteEnabled
            ? "[AUTHORITY GRANTED] WRITE-BACK ENABLED"
            : "[SHIELD ACTIVE] READ-ONLY MODE"}
        </span>

        {/* Toggle Switch */}
        <div
          className={`relative h-4 w-7 border transition-all ${
            isWriteEnabled
              ? "border-emerald-500 bg-emerald-500/20"
              : "border-slate-600 bg-slate-800"
          }`}
          style={{ borderRadius: "0px" }}
        >
          <motion.div
            className="absolute top-0.5 h-3 w-3 bg-emerald-400"
            style={{ borderRadius: "0px" }}
            animate={{
              x: isWriteEnabled ? 12 : 2,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>
    </div>
  );
}

