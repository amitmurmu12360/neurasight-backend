"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { IntelligenceHealthResult } from "@/lib/healthEngine";
import { getPersonaHealthLabel } from "@/lib/healthEngine";

type PersonaType = "CEO" | "CMO" | "VP Sales";

interface ExecutiveHealthGaugeProps {
  health: IntelligenceHealthResult;
  persona: PersonaType;
  className?: string;
  onFactorClick?: (factor: 'freshness' | 'integrity' | 'execution') => void;
  isDetectiveMode?: boolean; // Optional: for pulse animation when detective mode is active
  isExecuting?: boolean; // Optional: for processing state animation
  executionSuccess?: boolean; // Optional: for success pulse animation
  onDeepScanComplete?: (factor: 'freshness' | 'integrity' | 'execution') => void; // Callback for deep scan completion
}

/**
 * Executive Health Gauge Component
 * =================================
 * A semi-circular progress gauge displaying Intelligence Health Score (0-100)
 * with smooth needle sweep animation, color-coded glow effects, and an animated
 * collapsible "Strategic Breakdown" section.
 */
export default function ExecutiveHealthGauge({
  health,
  persona,
  className = "",
  onFactorClick,
  isDetectiveMode = false,
  isExecuting = false,
  executionSuccess = false,
  onDeepScanComplete,
}: ExecutiveHealthGaugeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deepScanningFactor, setDeepScanningFactor] = useState<'freshness' | 'integrity' | 'execution' | null>(null);
  const { score, label, color, statusDescription, breakdown } = health;
  
  // Handle factor click with deep scan for 100% factors
  const handleFactorClick = async (factor: 'freshness' | 'integrity' | 'execution') => {
    const factorScore = factor === 'freshness' 
      ? breakdown.freshness.score / breakdown.freshness.maxScore
      : factor === 'integrity'
      ? breakdown.integrity.score / breakdown.integrity.maxScore
      : breakdown.execution.score / breakdown.execution.maxScore;
    
    const isPerfectScore = factorScore >= 1.0;
    
    if (isPerfectScore) {
      // Trigger 2-second deep forensic scan animation
      setDeepScanningFactor(factor);
      
      // Wait 2 seconds for animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete deep scan
      setDeepScanningFactor(null);
      onDeepScanComplete?.(factor);
    }
    
    // Always call the original handler
    onFactorClick?.(factor);
  };
  
  // Calculate angle for semi-circle (0-180 degrees)
  // Score 0 = 0°, Score 100 = 180°
  const angle = (score / 100) * 180;
  
  // SVG dimensions
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Calculate arc path for semi-circle (0° to 180°)
  const startAngle = 0;
  const endAngle = 180;
  
  // Helper function to calculate arc path
  const getArcPath = (start: number, end: number) => {
    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(Math.PI - startRad);
    const y1 = centerY - radius * Math.sin(Math.PI - startRad);
    const x2 = centerX + radius * Math.cos(Math.PI - endRad);
    const y2 = centerY - radius * Math.sin(Math.PI - endRad);
    
    const largeArcFlag = end - start > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x2} ${y2}`;
  };
  
  // Background arc (full semi-circle)
  const backgroundPath = getArcPath(startAngle, endAngle);
  
  // Progress arc (0 to score angle)
  const progressPath = getArcPath(startAngle, angle);
  
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      {/* Gauge Container */}
      <motion.div 
        className="relative"
        animate={deepScanningFactor ? {
          // 1.5x MORE INTENSE: Scale increased from 1.08 to 1.12, glow increased from 40px to 60px
          scale: [1, 1.12, 1],
          boxShadow: [
            "0 0 0 0 rgba(6, 182, 212, 0.5)",
            deepScanningFactor === 'freshness' 
              ? "0 0 60px 18px rgba(6, 182, 212, 0.8)" // Cyan for Freshness
              : deepScanningFactor === 'integrity'
              ? "0 0 60px 18px rgba(16, 185, 129, 0.8)" // Emerald for Integrity
              : "0 0 60px 18px rgba(59, 130, 246, 0.8)", // Blue for Execution
            "0 0 0 0 rgba(6, 182, 212, 0.5)",
          ],
        } : isDetectiveMode ? {
          scale: [1, 1.08, 1],
          boxShadow: [
            "0 0 0 0 rgba(6, 182, 212, 0.4)",
            "0 0 40px 12px rgba(6, 182, 212, 0.6)",
            "0 0 0 0 rgba(6, 182, 212, 0.4)",
          ],
        } : executionSuccess ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0.4)",
            "0 0 35px 10px rgba(16, 185, 129, 0.6)",
            "0 0 0 0 rgba(16, 185, 129, 0.4)",
          ],
        } : {}}
        transition={{
          duration: deepScanningFactor ? 0.6 : isDetectiveMode ? 0.8 : executionSuccess ? 1.2 : 2, // Faster pulse for deep scan
          repeat: (isDetectiveMode || deepScanningFactor || executionSuccess) ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={backgroundPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc with animation */}
          <motion.path
            d={progressPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
          
          {/* Score text */}
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="fill-white font-mono text-4xl font-bold"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          >
            {score}
          </text>
          
          {/* Label text */}
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            className="fill-current text-xs font-medium uppercase tracking-wider opacity-70"
            style={{ color }}
          >
            {label}
          </text>
        </svg>
        
        {/* Outer glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            top: "-10%",
            left: "-10%",
            width: "120%",
            height: "120%",
          }}
        />
      </motion.div>
      
      {/* Status Info */}
      <div className="flex flex-col gap-1.5">
        <p 
          className="font-mono text-xs uppercase tracking-wider leading-tight"
          style={{
            color: "#06b6d4",
            fontWeight: 600,
            textShadow: "0 0 8px rgba(6, 182, 212, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          {getPersonaHealthLabel(persona)}
        </p>
        <p className="max-w-[200px] text-xs text-white/50 leading-relaxed">{statusDescription}</p>
      </div>
      
      {/* Strategic Breakdown - Collapsible */}
      <motion.div
        className="w-full overflow-hidden rounded-lg border border-white/5 bg-black/40 backdrop-blur-sm"
        initial={false}
        animate={{ height: isExpanded ? "auto" : "auto" }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
        >
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-white/70">
            Strategic Breakdown
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-white/50" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/50" />
            )}
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-white/5 p-3">
                {/* Freshness Breakdown */}
                <motion.div
                  className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-cyan-500/20 hover:bg-cyan-500/5 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFactorClick('freshness')}
                  animate={deepScanningFactor === 'freshness' ? {
                    borderColor: "rgba(6, 182, 212, 0.5)",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    boxShadow: [
                      "0 0 0 0 rgba(6, 182, 212, 0.4)",
                      "0 0 20px 4px rgba(6, 182, 212, 0.6)",
                      "0 0 0 0 rgba(6, 182, 212, 0.4)",
                    ],
                  } : {}}
                  transition={deepScanningFactor === 'freshness' ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  } : {}}
                >
                  <div className="mt-0.5">
                    <Clock className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white/80">
                        Freshness (30%)
                      </span>
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        {breakdown.freshness.score}/{breakdown.freshness.maxScore}
                      </span>
                    </div>
                    {breakdown.freshness.deduction > 0 && (
                      <p className="mb-1 text-xs text-red-400">
                        -{breakdown.freshness.deduction} points
                      </p>
                    )}
                    <p className="text-xs text-white/50">{breakdown.freshness.message}</p>
                  </div>
                </motion.div>
                
                {/* Integrity Breakdown */}
                <motion.div
                  className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/5 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFactorClick('integrity')}
                  animate={deepScanningFactor === 'integrity' ? {
                    borderColor: "rgba(16, 185, 129, 0.5)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    boxShadow: [
                      "0 0 0 0 rgba(16, 185, 129, 0.4)",
                      "0 0 20px 4px rgba(16, 185, 129, 0.6)",
                      "0 0 0 0 rgba(16, 185, 129, 0.4)",
                    ],
                  } : {}}
                  transition={deepScanningFactor === 'integrity' ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  } : {}}
                >
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white/80">
                        Integrity (40%)
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {breakdown.integrity.score}/{breakdown.integrity.maxScore}
                      </span>
                    </div>
                    {breakdown.integrity.deduction > 0 && (
                      <p className="mb-1 text-xs text-red-400">
                        -{breakdown.integrity.deduction} points
                      </p>
                    )}
                    <p className="text-xs text-white/50">{breakdown.integrity.message}</p>
                  </div>
                </motion.div>
                
                {/* Execution Breakdown */}
                <motion.div
                  className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-all hover:border-purple-500/20 hover:bg-purple-500/5 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFactorClick('execution')}
                  animate={deepScanningFactor === 'execution' ? {
                    borderColor: "rgba(168, 85, 247, 0.5)",
                    backgroundColor: "rgba(168, 85, 247, 0.1)",
                    boxShadow: [
                      "0 0 0 0 rgba(168, 85, 247, 0.4)",
                      "0 0 20px 4px rgba(168, 85, 247, 0.6)",
                      "0 0 0 0 rgba(168, 85, 247, 0.4)",
                    ],
                  } : {}}
                  transition={deepScanningFactor === 'execution' ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  } : {}}
                >
                  <div className="mt-0.5">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-white/80">
                        Execution (30%)
                      </span>
                      <span className="font-mono text-xs font-semibold text-purple-400">
                        {breakdown.execution.score}/{breakdown.execution.maxScore}
                      </span>
                    </div>
                    {breakdown.execution.bonus > 0 && (
                      <p className="mb-1 text-xs text-green-400">
                        +{breakdown.execution.bonus} points
                      </p>
                    )}
                    <p className="text-xs text-white/50">{breakdown.execution.message}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
