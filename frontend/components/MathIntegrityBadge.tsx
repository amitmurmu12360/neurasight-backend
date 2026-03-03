"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";

interface MathIntegrityBadgeProps {
  confidence: number; // 0-1
  toleranceLevel: "STRICT" | "STANDARD" | "AGILE";
}

/**
 * Math Integrity Badge
 * ====================
 * Displays current verification percentage based on Swarm's confidence.
 * Pulsing badge with color-coded status.
 */
export default function MathIntegrityBadge({
  confidence,
  toleranceLevel,
}: MathIntegrityBadgeProps) {
  const confidencePercent = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.95;
  const isMediumConfidence = confidence >= 0.8 && confidence < 0.95;
  const isLowConfidence = confidence < 0.8;

  const getColor = () => {
    if (isHighConfidence) return "#10b981"; // Emerald
    if (isMediumConfidence) return "#06b6d4"; // Cyan
    return "#ef4444"; // Red
  };

  const getStatusText = () => {
    if (isHighConfidence) return "VERIFIED";
    if (isMediumConfidence) return "PARTIAL";
    return "ANOMALY";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex items-center gap-2 border px-3 py-1 font-mono text-xs uppercase tracking-wider"
      style={{
        borderColor: `${getColor()}40`,
        backgroundColor: `${getColor()}10`,
        color: getColor(),
        borderRadius: "0px",
      }}
    >
      {/* Pulsing indicator */}
      <motion.div
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: getColor() }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Icon */}
      {isHighConfidence ? (
        <CheckCircle className="h-3 w-3" style={{ color: getColor() }} />
      ) : isLowConfidence ? (
        <AlertTriangle className="h-3 w-3" style={{ color: getColor() }} />
      ) : (
        <Shield className="h-3 w-3" style={{ color: getColor() }} />
      )}

      {/* Status */}
      <span>{getStatusText()}</span>

      {/* Confidence Percentage */}
      <span className="font-semibold">{confidencePercent}%</span>

      {/* Tolerance Level */}
      <span className="text-[10px] text-slate-500">({toleranceLevel})</span>

      {/* Glow effect for high confidence */}
      {isHighConfidence && (
        <motion.div
          className="absolute inset-0 border"
          style={{
            borderColor: getColor(),
            borderRadius: "0px",
            boxShadow: `0 0 10px ${getColor()}40`,
          }}
          animate={{
            boxShadow: [
              `0 0 10px ${getColor()}40`,
              `0 0 20px ${getColor()}60`,
              `0 0 10px ${getColor()}40`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

