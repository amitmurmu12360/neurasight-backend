"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Zap,
  Activity,
  Clock,
  Lock,
  Verified
} from "lucide-react";
import type { DashboardState } from "@/types/dashboard";

/**
 * Persona Types
 */
export type Persona = "CEO" | "CMO" | "VP Sales";

/**
 * Industry Types
 */
export type Industry = "saas" | "retail" | "ecommerce" | "agency" | "generic";

/**
 * Agent Status
 */
export type AgentStatus = "idle" | "active" | "success" | "error";

/**
 * Persona Theme Configuration
 */
const PERSONA_THEMES = {
  CEO: {
    name: "Strategist",
    primary: "rgb(10, 10, 20)", // Deep Obsidian
    accent: "rgb(255, 215, 0)", // Royal Gold
    secondary: "rgb(30, 30, 40)",
    glow: "rgba(255, 215, 0, 0.4)",
    focus: "long-term trends",
    borderColor: "rgba(255, 215, 0, 0.3)",
    textColor: "rgb(255, 215, 0)",
    bgGradient: "linear-gradient(135deg, rgb(10, 10, 20) 0%, rgb(30, 30, 40) 100%)",
  },
  CMO: {
    name: "Growth",
    primary: "rgb(5, 20, 15)", // Dark Emerald
    accent: "rgb(16, 185, 129)", // Emerald Green
    secondary: "rgb(6, 78, 59)",
    glow: "rgba(16, 185, 129, 0.5)",
    focus: "conversion funnels",
    borderColor: "rgba(34, 211, 238, 0.4)", // Cyber Teal
    textColor: "rgb(34, 211, 238)", // Cyber Teal
    bgGradient: "linear-gradient(135deg, rgb(5, 20, 15) 0%, rgb(6, 78, 59) 50%, rgb(5, 30, 25) 100%)",
  },
  "VP Sales": {
    name: "Velocity",
    primary: "rgb(5, 15, 30)", // Deep Blue
    accent: "rgb(59, 130, 246)", // Electric Blue
    secondary: "rgb(30, 58, 138)",
    glow: "rgba(59, 130, 246, 0.5)",
    focus: "real-time targets",
    borderColor: "rgba(192, 192, 192, 0.4)", // High-Octane Silver
    textColor: "rgb(192, 192, 192)", // High-Octane Silver
    bgGradient: "linear-gradient(135deg, rgb(5, 15, 30) 0%, rgb(30, 58, 138) 50%, rgb(15, 25, 45) 100%)",
  },
};

/**
 * Industry Terminology Mapping
 */
const INDUSTRY_TERMINOLOGY: Record<Industry, {
  revenue: string;
  retention: string;
  efficiency: string;
  growth: string;
  additional?: string[];
}> = {
  saas: {
    revenue: "ARR",
    retention: "NRR",
    efficiency: "LTV/CAC",
    growth: "YoY Growth",
    additional: ["Churn Rate", "Burn Multiple"],
  },
  retail: {
    revenue: "Total Sales",
    retention: "Gross Margin",
    efficiency: "Inventory Velocity",
    growth: "MoM Growth",
    additional: ["Profit Margin", "AOV"],
  },
  ecommerce: {
    revenue: "GMV",
    retention: "Repeat Purchase Rate",
    efficiency: "ROAS",
    growth: "MoM Growth",
    additional: ["Conversion Rate", "AOV"],
  },
  agency: {
    revenue: "Managed Spend",
    retention: "Client Retention",
    efficiency: "Project Margin",
    growth: "Revenue Growth",
    additional: ["Utilization Rate", "Billable Hours"],
  },
  generic: {
    revenue: "Revenue",
    retention: "Retention",
    efficiency: "Efficiency",
    growth: "Growth",
  },
};

/**
 * Agent Configuration
 */
const AGENT_CONFIG = [
  { id: "janitor", name: "Agent 0: Janitor", icon: "🧹" },
  { id: "sentinel", name: "Agent 1: Data Sentinel", icon: "🛡️" },
  { id: "auditor", name: "Agent 2: Math Auditor", icon: "🔍" },
  { id: "policy", name: "Agent 3: Policy Auditor", icon: "📋" },
  { id: "simulation", name: "Agent 4: Simulation", icon: "🌊" },
  { id: "competitive", name: "Agent 5: Competitive Intel", icon: "⚔️" },
  { id: "narrative", name: "Agent 7: Narrative", icon: "📝" },
  { id: "vocal", name: "Agent 8: Vocal Executive", icon: "🎙️" },
  { id: "predictive", name: "Agent 10: Predictive Seer", icon: "🔮" },
  { id: "validator", name: "Agent 0: Final Boss", icon: "👑" },
];

interface SovereignHUDProps {
  persona: Persona;
  industry: Industry;
  dashboardState?: DashboardState;
  agentStatuses?: Map<string, AgentStatus>;
  agent0Result?: {
    success: boolean;
    certificate?: {
      integrity_seal: string;
      domain_verified: boolean;
      consensus_score: number;
    };
    error?: string;
    requiresReScan?: boolean;
  };
  isGenerating?: boolean;
}

export default function SovereignHUD({
  persona,
  industry,
  dashboardState,
  agentStatuses = new Map(),
  agent0Result,
  isGenerating = false,
}: SovereignHUDProps) {
  const theme = PERSONA_THEMES[persona];
  const terminology = INDUSTRY_TERMINOLOGY[industry] || INDUSTRY_TERMINOLOGY.generic;
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingHash, setProcessingHash] = useState("");

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate processing hash stream
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        const hash = Math.random().toString(16).substring(2, 10).toUpperCase();
        setProcessingHash(hash);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProcessingHash("");
    }
  }, [isGenerating]);

  // Check if Agent 0 validation failed
  const isSystemLockdown = agent0Result && (!agent0Result.success || agent0Result.requiresReScan);
  const isCertified = agent0Result?.success && agent0Result.certificate?.domain_verified;

  // Get active agents count
  const activeAgents = useMemo(() => {
    let count = 0;
    agentStatuses.forEach((status) => {
      if (status === "active" || status === "success") count++;
    });
    return count;
  }, [agentStatuses]);

  // Get metrics for display
  const metrics = useMemo(() => {
    if (!dashboardState) return null;

    const arr = dashboardState.financials?.arr?.value || 0;
    const nrr = dashboardState.financials?.nrr?.value || 0;
    const burn = dashboardState.financials?.burn_multiple?.value || 0;
    const growth = dashboardState.growth?.mqls?.growth_mom || 0;

    return {
      revenue: arr,
      retention: nrr,
      efficiency: burn,
      growth,
    };
  }, [dashboardState]);

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: theme.bgGradient,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Glassmorphism Overlay with Cinematic Depth */}
      <motion.div 
        className="absolute inset-0 backdrop-blur-[8px] bg-black/30"
        animate={{
          background: [
            "radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
            "radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
            "radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Cinematic Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(${theme.borderColor} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.borderColor} 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Enhanced System Lockdown State - Red Alert */}
      <AnimatePresence>
        {isSystemLockdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-red-950/95 backdrop-blur-xl"
          >
            {/* Pulsing Red Alert Background */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)",
                  "radial-gradient(circle at center, rgba(239, 68, 68, 0.5) 0%, transparent 70%)",
                  "radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Alert Lines Animation */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)",
                  "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)",
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            <motion.div
              initial={{ y: -30, scale: 0.9 }}
              animate={{ 
                y: 0, 
                scale: 1,
              }}
              className="text-center space-y-6 p-12 max-w-2xl relative z-10"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="w-24 h-24 text-red-500 mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
              </motion.div>
              
              <motion.h2 
                className="text-5xl font-black tracking-wider text-red-400"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(239, 68, 68, 0.8)",
                    "0 0 40px rgba(239, 68, 68, 1)",
                    "0 0 20px rgba(239, 68, 68, 0.8)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                SYSTEM LOCKDOWN
              </motion.h2>
              
              <motion.p 
                className="text-red-300 text-xl font-semibold max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                {agent0Result?.error || "Critical Integrity Exception detected"}
              </motion.p>
              
              {agent0Result?.requiresReScan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <motion.p 
                    className="text-red-200 text-sm font-mono"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Deep Scan initiated. Re-validating data integrity...
                  </motion.p>
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Activity className="w-4 h-4 text-red-400 animate-spin" />
                    <span className="text-red-300 text-xs font-mono">Agent 0: Janitor Mode Active</span>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Critical Error Details */}
              {agent0Result?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 backdrop-blur-sm"
                >
                  <p className="text-red-200 text-xs font-mono text-left">
                    {agent0Result.error}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main HUD Container */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                boxShadow: [
                  `0 0 20px ${theme.glow}`,
                  `0 0 40px ${theme.glow}`,
                  `0 0 20px ${theme.glow}`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1 
                className="text-3xl font-black tracking-tight"
                style={{ 
                  color: theme.accent,
                  textShadow: `0 0 10px ${theme.glow}`,
                }}
                animate={{
                  textShadow: [
                    `0 0 10px ${theme.glow}`,
                    `0 0 20px ${theme.glow}`,
                    `0 0 10px ${theme.glow}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                NeuraSight OS
              </motion.h1>
              <motion.p 
                className="text-sm font-medium mt-1"
                style={{ color: theme.textColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {theme.name} Mode • {terminology.revenue} Focus • {industry.toUpperCase()} Domain
              </motion.p>
            </motion.div>
          </div>

          {/* Enhanced Real-time Clock & Processing Hash Stream */}
          <div className="flex items-center gap-6 text-sm">
            <motion.div 
              className="flex items-center gap-2"
              style={{ color: theme.textColor }}
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="w-4 h-4" />
              <motion.span 
                className="font-mono font-semibold"
                key={currentTime.getTime()}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentTime.toLocaleTimeString("en-US", { 
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </motion.span>
            </motion.div>
            {isGenerating && processingHash && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: [0.6, 1, 0.6],
                  x: 0,
                }}
                transition={{ 
                  opacity: { duration: 1, repeat: Infinity },
                  x: { duration: 0.3 },
                }}
                className="flex items-center gap-2"
                style={{ color: theme.textColor }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Activity className="w-4 h-4" />
                </motion.div>
                <span className="font-mono text-xs font-semibold">
                  HASH: <span className="text-cyan-400">{processingHash}</span>
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Agent Swarm Status Sidebar - Cinematic Swarm Visualizer */}
        <motion.div 
          className="absolute top-20 right-6 w-72 space-y-2 z-30"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2"
            style={{ color: theme.textColor }}
          >
            <Activity className="w-4 h-4" />
            <span>Swarm Status ({activeAgents}/10)</span>
            {isGenerating && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-auto"
              >
                <Zap className="w-3 h-3" />
              </motion.span>
            )}
          </motion.div>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {AGENT_CONFIG.map((agent, index) => {
              const status = agentStatuses.get(agent.id) || "idle";
              const isActive = status === "active";
              const isSuccess = status === "success";
              const isError = status === "error";

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: 30, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: 1,
                    backgroundColor: isActive 
                      ? `${theme.glow}25` 
                      : isSuccess 
                      ? "rgba(16, 185, 129, 0.15)"
                      : isError
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    borderColor: isActive 
                      ? theme.borderColor
                      : isSuccess
                      ? "rgba(16, 185, 129, 0.3)"
                      : isError
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(255, 255, 255, 0.1)",
                  }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: isActive ? `${theme.glow}35` : "rgba(255, 255, 255, 0.08)",
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-md border-2 transition-all cursor-pointer group"
                >
                  {/* Pulse Animation for Active Agents */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        boxShadow: [
                          `0 0 10px ${theme.glow}`,
                          `0 0 20px ${theme.glow}`,
                          `0 0 10px ${theme.glow}`,
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <motion.span
                    animate={isActive ? { 
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                      rotate: [0, 5, -5, 0],
                    } : {}}
                    transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                    className="text-xl relative z-10"
                  >
                    {agent.icon}
                  </motion.span>
                  
                  <div className="flex-1 min-w-0 relative z-10">
                    <div 
                      className="text-xs font-semibold truncate mb-0.5"
                      style={{ color: isActive ? theme.textColor : "rgb(203, 213, 225)" }}
                    >
                      {agent.name.split(":")[1]?.trim() || agent.name}
                    </div>
                    <motion.div 
                      className="text-[10px] font-mono"
                      style={{ color: isActive ? theme.textColor : "rgb(148, 163, 184)" }}
                      animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                    >
                      {status === "active" && "Scanning..."}
                      {status === "success" && "✓ Verified"}
                      {status === "error" && "✗ Failed"}
                      {status === "idle" && "Standby"}
                    </motion.div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="relative z-10">
                    {isActive && (
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ 
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1, repeat: Infinity },
                        }}
                        className="w-3 h-3 rounded-full relative"
                        style={{ backgroundColor: theme.accent }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              `0 0 0 0 ${theme.glow}`,
                              `0 0 0 4px ${theme.glow}00`,
                              `0 0 0 0 ${theme.glow}`,
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    )}
                    {isSuccess && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {isError && (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Agent 2 Math Audit Phase - Enhanced Data Integrity Scanning Effect */}
        <AnimatePresence>
          {agentStatuses.get("auditor") === "active" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 pointer-events-none z-40"
              style={{
                background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)`,
              }}
            >
              {/* Scanning Lines Effect */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    "linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    "linear-gradient(270deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    "linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl font-black tracking-wider"
                  style={{ 
                    color: theme.accent,
                    textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
                  }}
                >
                  DATA INTEGRITY SCANNING
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  className="text-sm mt-2 font-mono"
                  style={{ color: theme.textColor }}
                >
                  Agent 2: Mathematical Gatekeeper Active
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent 0 Final Boss - Enhanced Sovereign Integrity Seal (Gold Holographic Stamp) */}
        <AnimatePresence>
          {isCertified && agent0Result?.certificate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -180, y: -100 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, rotate: 180, y: 100 }}
              transition={{ 
                type: "spring", 
                stiffness: 150, 
                damping: 20,
                mass: 1.2,
              }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
            >
              {/* Holographic Glow Effect */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    `0 0 60px ${theme.accent}, 0 0 120px ${theme.accent}, 0 0 180px ${theme.accent}`,
                    `0 0 80px ${theme.accent}, 0 0 160px ${theme.accent}, 0 0 240px ${theme.accent}`,
                    `0 0 60px ${theme.accent}, 0 0 120px ${theme.accent}, 0 0 180px ${theme.accent}`,
                  ],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity },
                  rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative p-10 rounded-3xl backdrop-blur-2xl border-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}95, ${theme.secondary}95)`,
                  borderColor: theme.accent,
                  borderImage: `linear-gradient(45deg, ${theme.accent}, ${theme.textColor}, ${theme.accent}) 1`,
                }}
              >
                {/* Holographic Shimmer */}
                <motion.div
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                  animate={{
                    background: [
                      `linear-gradient(45deg, transparent 30%, ${theme.glow} 50%, transparent 70%)`,
                      `linear-gradient(135deg, transparent 30%, ${theme.glow} 50%, transparent 70%)`,
                      `linear-gradient(45deg, transparent 30%, ${theme.glow} 50%, transparent 70%)`,
                    ],
                    backgroundPosition: ["-200% 0", "200% 0", "-200% 0"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 2, -2, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Verified className="w-20 h-20 mx-auto mb-4" style={{ color: theme.accent }} />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-5xl font-black tracking-wider mb-3"
                    style={{ 
                      color: theme.accent,
                      textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
                    }}
                    animate={{ 
                      textShadow: [
                        `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
                        `0 0 30px ${theme.glow}, 0 0 60px ${theme.glow}`,
                        `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    VERIFIED
                  </motion.h2>
                  
                  <motion.p 
                    className="text-sm font-mono mb-2"
                    style={{ color: theme.textColor }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Integrity Seal: {agent0Result.certificate.integrity_seal.substring(0, 12).toUpperCase()}...
                  </motion.p>
                  
                  <motion.p 
                    className="text-xs font-semibold"
                    style={{ color: theme.textColor }}
                  >
                    Consensus: {(agent0Result.certificate.consensus_score * 100).toFixed(1)}% • Domain: {industry.toUpperCase()}
                  </motion.p>
                  
                  {/* Animated Seal Border */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl"
                    style={{
                      border: `2px solid ${theme.accent}`,
                      clipPath: "inset(0 round 1.5rem)",
                    }}
                    animate={{
                      borderColor: [
                        theme.accent,
                        theme.textColor,
                        theme.accent,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Grid */}
        {metrics && !isSystemLockdown && (
          <div className="grid grid-cols-4 gap-4 mt-8">
            {/* Revenue Card */}
            <MetricCard
              label={terminology.revenue}
              value={metrics.revenue}
              format="currency"
              theme={theme}
              trend={metrics.growth > 0 ? "up" : "down"}
            />

            {/* Retention Card */}
            <MetricCard
              label={terminology.retention}
              value={metrics.retention}
              format="percentage"
              theme={theme}
              trend={metrics.retention > 100 ? "up" : "down"}
            />

            {/* Efficiency Card */}
            <MetricCard
              label={terminology.efficiency}
              value={metrics.efficiency}
              format="ratio"
              theme={theme}
              trend={metrics.efficiency < 1 ? "up" : "down"}
            />

            {/* Growth Card */}
            <MetricCard
              label={terminology.growth}
              value={metrics.growth}
              format="percentage"
              theme={theme}
              trend={metrics.growth > 0 ? "up" : "down"}
            />
          </div>
        )}

        {/* Additional Industry Metrics */}
        {terminology.additional && !isSystemLockdown && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {terminology.additional.map((metric, index) => (
              <motion.div
                key={metric}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
                className="p-4 rounded-lg backdrop-blur-sm border border-white/10 bg-white/5"
              >
                <div className="text-xs text-gray-400 mb-1">{metric}</div>
                <div className="text-lg font-semibold" style={{ color: theme.accent }}>
                  {index === 0 ? "N/A" : "Calculating..."}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.borderColor};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.accent};
        }
      `}</style>
    </motion.div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: number;
  format: "currency" | "percentage" | "ratio";
  theme: typeof PERSONA_THEMES.CEO;
  trend: "up" | "down";
}

function MetricCard({ label, value, format, theme, trend }: MetricCardProps) {
  const formattedValue = useMemo(() => {
    if (format === "currency") {
      return `$${value.toFixed(1)}M`;
    } else if (format === "percentage") {
      return `${value.toFixed(1)}%`;
    } else {
      return `${value.toFixed(2)}x`;
    }
  }, [value, format]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: `0 0 30px ${theme.glow}`,
      }}
      className="relative p-6 rounded-xl backdrop-blur-md border border-white/20 bg-white/5 overflow-hidden group"
    >
      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </span>
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="text-3xl font-bold" style={{ color: theme.accent }}>
          {formattedValue}
        </div>
      </div>
    </motion.div>
  );
}

