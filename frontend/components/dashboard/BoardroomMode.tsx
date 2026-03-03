/**
 * Boardroom Mode - War Room Crisis UI
 * ====================================
 * Pure OLED Black (#000000) War Room aesthetic.
 * Crisis State: Red glow (#ef4444) when Stress Test is active.
 * Features: Stress Test toggle, Risk Appetite slider, Agent avatars with thought bubbles.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Sparkles,
  Zap,
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  Radio,
} from "lucide-react";
import type { RiskAppetite } from "@/lib/swarmEngine";

// =============================================================================
// TYPES
// =============================================================================
interface BoardroomModeProps {
  isStressTest: boolean;
  onStressTestToggle: (enabled: boolean) => void;
  riskAppetite: RiskAppetite;
  onRiskAppetiteChange: (appetite: RiskAppetite) => void;
  industry?: string;
  riskScore?: number;
  agentDebates?: Array<{
    agentId: string;
    agentName: string;
    thought: string;
    position: "enforce" | "pivot" | "neutral";
    confidence: number;
  }>;
  resolutionPayload?: {
    before: Record<string, number>;
    after: Record<string, number>;
    predictedHealthBoost: number;
  } | null;
  onInitiateRepair?: () => void;
}

interface AgentAvatar {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  thought?: string;
  position?: "enforce" | "pivot" | "neutral";
  confidence?: number;
}

// =============================================================================
// AGENT CONFIGURATION
// =============================================================================
const AGENT_AVATARS: Record<string, AgentAvatar> = {
  policy: {
    id: "policy",
    name: "Agent 3: Policy Auditor",
    icon: <Shield className="h-5 w-5" />,
    color: "#ef4444", // Red for enforcement
  },
  strategy: {
    id: "strategy",
    name: "Agent 11: Strategy Engine",
    icon: <Sparkles className="h-5 w-5" />,
    color: "#10b981", // Emerald for growth
  },
  validator: {
    id: "validator",
    name: "Agent 0: Final Boss",
    icon: <Brain className="h-5 w-5" />,
    color: "#06b6d4", // Cyan for resolution
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function BoardroomMode({
  isStressTest,
  onStressTestToggle,
  riskAppetite,
  onRiskAppetiteChange,
  industry = "generic",
  riskScore = 0,
  agentDebates = [],
  resolutionPayload = null,
  onInitiateRepair,
}: BoardroomModeProps) {
  const [thoughtBubbles, setThoughtBubbles] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Update thought bubbles from agent debates
  useEffect(() => {
    const bubbles: Record<string, string> = {};
    agentDebates.forEach((debate) => {
      bubbles[debate.agentId] = debate.thought;
    });
    setThoughtBubbles(bubbles);
  }, [agentDebates]);

  // Handle stress test state changes
  useEffect(() => {
    if (isStressTest) {
      setIsSyncing(true);
      // Simulate brain syncing pulse
      const syncTimeout = setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
      return () => clearTimeout(syncTimeout);
    }
  }, [isStressTest]);

  // Determine crisis glow color
  const crisisGlow = isStressTest ? "#ef4444" : "#000000";

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen w-full overflow-auto"
      style={{
        backgroundColor: "#000000", // Pure OLED Black
      }}
    >
      {/* Crisis Glow Overlay */}
      {isStressTest && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          animate={{
            boxShadow: [
              `inset 0 0 100px 50px rgba(239, 68, 68, 0.1)`,
              `inset 0 0 150px 80px rgba(239, 68, 68, 0.2)`,
              `inset 0 0 100px 50px rgba(239, 68, 68, 0.1)`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Header Controls */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4">
        <div className="flex items-center gap-4">
          {/* STRESS TEST Toggle */}
          <motion.button
            onClick={() => onStressTestToggle(!isStressTest)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex items-center gap-2 rounded-lg border-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
              isStressTest
                ? "border-red-500/60 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                : "border-white/10 bg-black/40 text-slate-400 hover:border-white/20"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isStressTest ? "text-red-400" : "text-slate-500"}`} />
            <span>STRESS TEST</span>
            {isStressTest && (
              <motion.span
                className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.button>

          {/* Industry Badge */}
          <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-1.5">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
              {industry.toUpperCase()}
            </span>
          </div>

          {/* Risk Score Display */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">RISK:</span>
            <motion.span
              className={`font-mono text-sm font-bold ${
                riskScore > 0.7
                  ? "text-red-400"
                  : riskScore > 0.4
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
              animate={riskScore > 0.7 ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1, repeat: riskScore > 0.7 ? Infinity : 0 }}
            >
              {(riskScore * 100).toFixed(0)}%
            </motion.span>
          </div>
        </div>

        {/* RISK APPETITE Slider */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">RISK APPETITE:</span>
          <div className="flex items-center gap-2">
            {(["conservative", "balanced", "aggressive"] as RiskAppetite[]).map((appetite) => (
              <motion.button
                key={appetite}
                onClick={() => onRiskAppetiteChange(appetite)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  riskAppetite === appetite
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "border-white/10 bg-black/40 text-slate-500 hover:border-white/20 hover:text-slate-400"
                }`}
              >
                {appetite}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Avatars with Thought Bubbles */}
      <div className="relative z-10 flex items-center justify-center gap-8 px-6 py-12">
        {/* Fallback UI: Brain Syncing */}
        {agentDebates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isSyncing ? 1 : 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10"
            >
              <Brain className="h-12 w-12 text-emerald-400" />
            </motion.div>
            <span className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Brain Syncing...
            </span>
            <span className="font-mono text-xs text-slate-500">
              Awaiting strategic analysis...
            </span>
          </motion.div>
        )}

        {/* Agent Avatars */}
        {agentDebates.length > 0 && Object.values(AGENT_AVATARS).map((agent, index) => {
          const debate = agentDebates.find((d) => d.agentId === agent.id);
          const thought = thoughtBubbles[agent.id] || debate?.thought || "";
          const position = debate?.position || "neutral";
          const confidence = debate?.confidence || 0;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex flex-col items-center gap-4"
            >
              {/* Agent Avatar Circle */}
              <motion.div
                className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                  isStressTest
                    ? "border-red-500/60 bg-red-500/10"
                    : `border-[${agent.color}]/60 bg-[${agent.color}]/10`
                }`}
                style={{
                  borderColor: isStressTest ? "rgba(239, 68, 68, 0.6)" : `${agent.color}80`,
                  backgroundColor: isStressTest ? "rgba(239, 68, 68, 0.1)" : `${agent.color}1A`,
                }}
                animate={
                  thought
                    ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          `0 0 0 0 ${agent.color}40`,
                          `0 0 30px 8px ${agent.color}60`,
                          `0 0 0 0 ${agent.color}40`,
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: thought ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <div
                  style={{
                    color: isStressTest ? "#ef4444" : agent.color,
                  }}
                >
                  {agent.icon}
                </div>

                {/* Confidence Indicator */}
                {confidence > 0 && (
                  <motion.div
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-emerald-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <span className="text-[8px] font-bold text-black">
                      {Math.round(confidence * 100)}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Agent Name */}
              <span className="font-mono text-xs font-semibold text-slate-400">
                {agent.name}
              </span>

              {/* Thought Bubble */}
              {thought && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative max-w-xs rounded-lg border px-4 py-3 ${
                    position === "enforce"
                      ? "border-red-500/40 bg-red-500/10"
                      : position === "pivot"
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/10 bg-black/40"
                  }`}
                >
                  {/* Thought Bubble Tail */}
                  <div
                    className={`absolute -top-2 left-8 h-4 w-4 rotate-45 ${
                      position === "enforce"
                        ? "border-l border-t border-red-500/40 bg-red-500/10"
                        : position === "pivot"
                        ? "border-l border-t border-emerald-500/40 bg-emerald-500/10"
                        : "border-l border-t border-white/10 bg-black/40"
                    }`}
                  />

                  {/* Thought Text */}
                  <p
                    className={`text-xs leading-relaxed ${
                      position === "enforce"
                        ? "text-red-300"
                        : position === "pivot"
                        ? "text-emerald-300"
                        : "text-slate-300"
                    }`}
                  >
                    {thought}
                  </p>

                  {/* Position Indicator */}
                  {position !== "neutral" && (
                    <div className="mt-2 flex items-center gap-1">
                      {position === "enforce" ? (
                        <XCircle className="h-3 w-3 text-red-400" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {position.toUpperCase()}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Crisis Banner (when Stress Test active) */}
      <AnimatePresence>
        {isStressTest && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-red-500/60 bg-red-500/20 px-6 py-3"
          >
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="h-5 w-5 animate-pulse text-red-400" />
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-red-400">
                CRISIS MODE ACTIVE · STRESS TEST ENABLED
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolution HUD: Strategic Repair Button */}
      {isStressTest && resolutionPayload && agentDebates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-emerald-500/60 bg-black/80 backdrop-blur-xl p-6 shadow-2xl shadow-emerald-500/30">
            {/* Predicted Recovery Indicator */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-emerald-500/20"
              >
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-mono text-xs text-slate-400">PREDICTED RECOVERY</span>
                <motion.span
                  className="font-mono text-lg font-bold text-emerald-400"
                  animate={{
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  40% → {40 + (resolutionPayload.predictedHealthBoost || 52)}%
                </motion.span>
              </div>
            </div>

            {/* Strategic Repair Button */}
            <motion.button
              onClick={onInitiateRepair}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(16, 185, 129, 0.4)",
                  "0 0 30px 10px rgba(16, 185, 129, 0.6)",
                  "0 0 0 0 rgba(16, 185, 129, 0.4)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-emerald-500/30 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-emerald-300 shadow-lg shadow-emerald-500/40 transition hover:from-emerald-500/40 hover:via-emerald-500/30 hover:to-emerald-500/40"
            >
              <Zap className="h-5 w-5" />
              INITIATE STRATEGIC REPAIR
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
