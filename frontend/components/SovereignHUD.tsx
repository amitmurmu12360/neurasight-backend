"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Hash,
  Brain,
  Activity,
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import type { Persona } from "./ExecutionLog";
import type { AgentStatus } from "@/lib/agents/orchestrator";
import type { VerificationCertificate } from "@/lib/agents/agent0Validator";
import ActionPanel, { type StrategicAction } from "./dashboard/ActionPanel";
import { getArchetypeDefinition, type BusinessArchetype } from "@/lib/intelligence/archetypeLibrary";

interface AgentStatusInfo {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  message?: string;
}

interface SovereignHUDProps {
  persona: Persona;
  verifiedIndustry?: string;
  agentStatuses?: Map<string, AgentStatusInfo>;
  validatorResult?: {
    success: boolean;
    certificate?: VerificationCertificate;
    error?: string;
    data?: {
      requiresReScan?: boolean;
      integrityFailure?: boolean;
    };
  };
  isGenerating?: boolean;
  strategicActions?: StrategicAction[];
  onActionExecute?: (action: StrategicAction) => Promise<void>;
}

// =============================================================================
// PERSONA THEMES (Visual Identity)
// =============================================================================

const PERSONA_THEMES = {
  CEO: {
    name: "Strategist",
    primary: "rgb(20, 20, 30)", // Deep Obsidian
    accent: "rgb(212, 175, 55)", // Royal Gold
    glow: "rgba(212, 175, 55, 0.3)",
    border: "rgba(212, 175, 55, 0.2)",
    text: "text-yellow-200",
    icon: TrendingUp,
  },
  CMO: {
    name: "Growth",
    primary: "rgb(5, 46, 22)", // Deep Emerald
    accent: "rgb(16, 185, 129)", // Emerald Green
    glow: "rgba(16, 185, 129, 0.3)",
    border: "rgba(16, 185, 129, 0.2)",
    text: "text-emerald-200",
    icon: Activity,
  },
  "VP Sales": {
    name: "Velocity",
    primary: "rgb(15, 23, 42)", // Electric Blue Base
    accent: "rgb(59, 130, 246)", // Electric Blue
    glow: "rgba(59, 130, 246, 0.3)",
    border: "rgba(59, 130, 246, 0.2)",
    text: "text-blue-200",
    icon: Zap,
  },
} as const;

// =============================================================================
// INDUSTRY-AWARE TERMINOLOGY
// =============================================================================

const INDUSTRY_LABELS: Record<
  string,
  {
    revenue: string;
    retention: string;
    efficiency: string;
    growth: string;
    deals: string;
    icon: typeof DollarSign;
  }
> = {
  saas: {
    revenue: "ARR",
    retention: "NRR",
    efficiency: "LTV/CAC",
    growth: "YoY Growth",
    deals: "Deals Closed",
    icon: Target,
  },
  retail: {
    revenue: "Total Sales",
    retention: "Gross Margin",
    efficiency: "Inventory Velocity",
    growth: "MoM Growth",
    deals: "Transactions",
    icon: ShoppingCart,
  },
  ecommerce: {
    revenue: "GMV",
    retention: "Repeat Purchase Rate",
    efficiency: "ROAS",
    growth: "MoM Growth",
    deals: "Orders",
    icon: Package,
  },
  agency: {
    revenue: "Managed Spend",
    retention: "Client Retention",
    efficiency: "Project Margin",
    growth: "Client Growth",
    deals: "Active Projects",
    icon: Briefcase,
  },
  marketing_agency: {
    revenue: "Managed Spend",
    retention: "Client Retention",
    efficiency: "ROAS",
    growth: "Client Growth",
    deals: "Active Campaigns",
    icon: Briefcase,
  },
};

// =============================================================================
// AGENT CONFIGURATION
// =============================================================================

const AGENT_CONFIG = [
  { id: "janitor", name: "Agent 0: Janitor", icon: Brain, color: "cyan" },
  { id: "sentinel", name: "Agent 1: Sentinel", icon: Shield, color: "cyan" },
  { id: "auditor", name: "Agent 2: Math Audit", icon: CheckCircle2, color: "emerald" },
  { id: "policy", name: "Agent 3: Policy", icon: BarChart3, color: "cyan" },
  { id: "simulation", name: "Agent 4: Simulator", icon: Activity, color: "emerald" },
  { id: "competitive", name: "Agent 5: Intel", icon: Target, color: "emerald" },
  { id: "narrative", name: "Agent 7: Narrative", icon: Users, color: "emerald" },
  { id: "vocal", name: "Agent 8: Vocal", icon: Zap, color: "emerald" },
  { id: "predictive", name: "Agent 10: Seer", icon: TrendingUp, color: "emerald" },
  { id: "validator", name: "Agent 0: Final Boss", icon: Shield, color: "yellow" },
];

export default function SovereignHUD({
  persona,
  verifiedIndustry = "saas",
  agentStatuses = new Map(),
  validatorResult,
  isGenerating = false,
  strategicActions = [],
  onActionExecute,
}: SovereignHUDProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hashStream, setHashStream] = useState<string>("");
  const [isLockdown, setIsLockdown] = useState(false);

  const theme = PERSONA_THEMES[persona];
  const industryLabels = INDUSTRY_LABELS[verifiedIndustry.toLowerCase()] || INDUSTRY_LABELS.saas;
  const ThemeIcon = theme.icon;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate hash stream animation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        const randomHash = Math.random().toString(16).substring(2, 10).toUpperCase();
        setHashStream((prev) => {
          const newStream = prev + randomHash + " ";
          return newStream.slice(-100); // Keep last 100 chars
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setHashStream("");
    }
  }, [isGenerating]);

  // Check for system lockdown
  useEffect(() => {
    if (validatorResult && !validatorResult.success) {
      setIsLockdown(true);
    } else if (validatorResult?.data?.requiresReScan) {
      setIsLockdown(true);
    } else {
      setIsLockdown(false);
    }
  }, [validatorResult]);

  // Get agent status for visualization
  const agentStatusList = useMemo(() => {
    return AGENT_CONFIG.map((config) => {
      const status = agentStatuses.get(config.id);
      return {
        ...config,
        status: status?.status || "idle",
        message: status?.message,
      };
    });
  }, [agentStatuses]);

  // Check if Agent 2 (Math Audit) is active
  const isMathAuditActive = agentStatuses.get("auditor")?.status === "active";

  // Check if Agent 0 (Final Boss) has certified
  const isCertified = validatorResult?.success && validatorResult?.certificate;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Main HUD Container */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
        {/* Left: Swarm Thinking Visualizer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto"
        >
          <div
            className="rounded-2xl border backdrop-blur-xl bg-black/40 p-4 shadow-2xl"
            style={{
              borderColor: theme.border,
              boxShadow: `0 0 40px ${theme.glow}`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ThemeIcon className={`h-4 w-4 ${theme.text}`} />
              <span className={`text-xs font-semibold ${theme.text} tracking-wider`}>
                SOVEREIGN SWARM
              </span>
            </div>

            {/* Agent Status List */}
            <div className="space-y-2 min-w-[280px]">
              {agentStatusList.map((agent, index) => {
                const AgentIcon = agent.icon;
                const isActive = agent.status === "active";
                const isSuccess = agent.status === "success";
                const isError = agent.status === "error";

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-cyan-500/20 border border-cyan-500/40"
                        : isSuccess
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : isError
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-black/30 border border-white/5"
                    }`}
                  >
                    <AgentIcon
                      className={`h-3.5 w-3.5 ${
                        isActive
                          ? "text-cyan-400"
                          : isSuccess
                          ? "text-emerald-400"
                          : isError
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-300 flex-1 truncate">
                      {agent.name}
                    </span>
                    {isActive && (
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Agent 2 Math Audit Special Effect */}
            {isMathAuditActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 px-2 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-[10px] text-emerald-300 font-medium">
                    Data Integrity Scanning...
                  </span>
                </div>
              </motion.div>
            )}

            {/* Agent 0 Certification Seal */}
            {isCertified && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-yellow-300 tracking-wider">
                      VERIFIED
                    </div>
                    <div className="text-[9px] text-yellow-400/80">
                      Integrity Seal: {validatorResult.certificate?.integrity_seal?.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right: Real-time HUD Elements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto flex flex-col gap-3"
        >
          {/* System Clock */}
          <div
            className="rounded-xl border backdrop-blur-xl bg-black/40 p-3 shadow-2xl"
            style={{
              borderColor: theme.border,
              boxShadow: `0 0 30px ${theme.glow}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`h-3.5 w-3.5 ${theme.text}`} />
              <span className={`text-[10px] font-mono ${theme.text}`}>
                {currentTime.toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className={`text-[9px] ${theme.text}/70`}>
              {currentTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Hash Stream */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border backdrop-blur-xl bg-black/40 p-3 shadow-2xl max-w-[200px]"
              style={{
                borderColor: theme.border,
                boxShadow: `0 0 30px ${theme.glow}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Hash className={`h-3.5 w-3.5 ${theme.text}`} />
                <span className={`text-[10px] font-semibold ${theme.text}`}>
                  Processing Hash
                </span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 overflow-hidden">
                <motion.div
                  animate={{ x: [0, -20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="whitespace-nowrap"
                >
                  {hashStream || "00000000"}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Industry Labels */}
          <div
            className="rounded-xl border backdrop-blur-xl bg-black/40 p-3 shadow-2xl"
            style={{
              borderColor: theme.border,
              boxShadow: `0 0 30px ${theme.glow}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <industryLabels.icon className={`h-3.5 w-3.5 ${theme.text}`} />
              <span className={`text-[10px] font-semibold ${theme.text} uppercase tracking-wider`}>
                {verifiedIndustry}
              </span>
            </div>
            <div className="space-y-1 text-[9px] text-slate-400">
              <div>Revenue: {industryLabels.revenue}</div>
              <div>Retention: {industryLabels.retention}</div>
              <div>Efficiency: {industryLabels.efficiency}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Lockdown Overlay */}
      <AnimatePresence>
        {isLockdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-auto bg-red-950/90 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl border-2 border-red-500 bg-black/80 p-8 max-w-md text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="mb-4 flex justify-center"
              >
                <Lock className="h-16 w-16 text-red-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">SYSTEM LOCKDOWN</h2>
              <p className="text-red-300 mb-4">
                {validatorResult?.error || "Critical Integrity Exception detected"}
              </p>
              {validatorResult?.data?.requiresReScan && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                  <AlertTriangle className="h-5 w-5 inline mr-2" />
                  Deep Scan Required: Re-mapping data columns...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

