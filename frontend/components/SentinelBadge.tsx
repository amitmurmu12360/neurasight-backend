"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface SentinelBadgeProps {
  isActive?: boolean;
  anomalyCount?: number;
}

/**
 * Sentinel Status Badge
 * =====================
 * Displays Guardian mode status with pulsing cyan dot.
 * Hover shows monitoring status message.
 */
export default function SentinelBadge({
  isActive = true,
  anomalyCount = 0,
}: SentinelBadgeProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <div className="flex items-center gap-2 border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-cyan-400">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 8px rgba(6, 182, 212, 0.8)",
          }}
        />
        <span>SENTINEL ACTIVE</span>
        {anomalyCount > 0 && (
          <span className="ml-1 text-[10px] text-red-400">
            ({anomalyCount})
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="border border-slate-700 bg-black px-3 py-2 font-mono text-[10px] text-slate-300 whitespace-nowrap" style={{ borderRadius: "0px" }}>
          Sentinel is monitoring your forecast for strategic drift.
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
      </div>
    </motion.div>
  );
}

