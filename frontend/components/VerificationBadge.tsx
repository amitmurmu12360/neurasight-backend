/**
 * VerificationBadge Component
 * ===========================
 * Visual "Verified by NeuraSight Sovereign Swarm" badge with emerald/cyan gradient seal.
 */

"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface VerificationBadgeProps {
  domain?: "RETAIL" | "SAAS";
  confidence?: number;
  verified?: boolean;
}

export default function VerificationBadge({
  domain = "SAAS",
  confidence = 95,
  verified = true,
}: VerificationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!verified) {
    return null;
  }

  return (
    <div className="relative">
      <motion.div
        className="relative inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 px-3 py-1.5 shadow-lg"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Pulsing Checkmark Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <CheckCircle2
            className={`h-4 w-4 ${
              domain === "RETAIL" ? "text-cyan-400" : "text-emerald-400"
            }`}
          />
        </motion.div>

        {/* Badge Text */}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Verified by Sovereign Swarm
        </span>

        {/* Gradient Glow Effect */}
        <div
          className={`absolute inset-0 rounded-lg opacity-20 blur-sm ${
            domain === "RETAIL"
              ? "bg-gradient-to-br from-cyan-500 to-emerald-500"
              : "bg-gradient-to-br from-emerald-500 to-cyan-500"
          }`}
        />
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs shadow-xl"
        >
          <div className="font-semibold text-emerald-400 mb-1">
            Verified via 3-Layer Consensus
          </div>
          <div className="space-y-1 text-slate-300">
            <div>• DNA Signature: {domain} domain verified</div>
            <div>• Swarm Audit: 9-agent verification complete</div>
            <div>• Python Math Grounding: 100% precision</div>
            <div className="pt-1 text-[10px] text-slate-400">
              Confidence: {confidence.toFixed(1)}%
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

