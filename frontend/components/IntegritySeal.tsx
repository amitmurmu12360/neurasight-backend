"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";

interface IntegritySealProps {
  /** Math integrity confidence (0-1) */
  mathIntegrityConfidence: number;
  /** Whether header mapping matches */
  headerMatch: boolean;
  /** Audit method used (e.g., "Structural Checksum", "Semantic Mapping") */
  auditMethod?: string;
  /** Total rows audited */
  totalRowsAudited?: number;
}

/**
 * Integrity Seal Component
 * =========================
 * High-fidelity "Integrity Seal" showing audit status
 * - Green Seal: 100% Header & Math Match
 * - Yellow Seal: Semantic Match (Math Verified)
 */
export default function IntegritySeal({
  mathIntegrityConfidence,
  headerMatch,
  auditMethod = "Structural Checksum",
  totalRowsAudited,
}: IntegritySealProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine seal color and status
  const isGreenSeal = mathIntegrityConfidence >= 1.0 && headerMatch;
  const isYellowSeal = mathIntegrityConfidence >= 0.95 && !headerMatch;
  const isRedSeal = mathIntegrityConfidence < 0.95;

  const sealColor = isGreenSeal ? "emerald" : isYellowSeal ? "yellow" : "red";
  const sealStatus = isGreenSeal 
    ? "VERIFIED" 
    : isYellowSeal 
    ? "SEMANTIC MATCH" 
    : "ANOMALY DETECTED";

  const confidencePercent = Math.round(mathIntegrityConfidence * 10000) / 100;

  // Build tooltip explanation
  const tooltipText = isGreenSeal
    ? `Verified via ${auditMethod}. Header mapping: 100% match. Math integrity: ${confidencePercent}%. ${totalRowsAudited ? `Audited ${totalRowsAudited.toLocaleString()} rows.` : ""}`
    : isYellowSeal
    ? `Semantic Match verified via ${auditMethod}. Math integrity: ${confidencePercent}%. Header mapping: Partial match (using semantic ontology). ${totalRowsAudited ? `Audited ${totalRowsAudited.toLocaleString()} rows.` : ""}`
    : `Anomaly detected. Math integrity: ${confidencePercent}%. ${auditMethod ? `Method: ${auditMethod}.` : ""} ${totalRowsAudited ? `Audited ${totalRowsAudited.toLocaleString()} rows.` : ""}`;

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Seal Icon */}
      <motion.div
        className={`relative flex items-center justify-center ${
          isGreenSeal
            ? "text-emerald-400"
            : isYellowSeal
            ? "text-yellow-400"
            : "text-red-400"
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        animate={{
          scale: isGreenSeal ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isGreenSeal ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {isGreenSeal ? (
          <ShieldCheck className="h-5 w-5" />
        ) : isYellowSeal ? (
          <ShieldCheck className="h-5 w-5" />
        ) : (
          <AlertTriangle className="h-5 w-5" />
        )}
        
        {/* Pulse Effect for Green Seal */}
        {isGreenSeal && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-${sealColor}-400/20`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {/* Status Text */}
      <span
        className={`font-mono text-xs font-semibold uppercase tracking-wider ${
          isGreenSeal
            ? "text-emerald-400"
            : isYellowSeal
            ? "text-yellow-400"
            : "text-red-400"
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {sealStatus}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded border border-slate-700 bg-black p-3 shadow-xl z-50"
          style={{ borderRadius: "0px" }}
        >
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase text-emerald-400 mb-1">
                INTEGRITY AUDIT DETAILS
              </p>
              <p className="font-mono text-[10px] text-slate-300 leading-relaxed">
                {tooltipText}
              </p>
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 rotate-45 border-r border-b border-slate-700 bg-black" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

