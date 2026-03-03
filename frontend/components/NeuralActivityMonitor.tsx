/**
 * Neural Activity Monitor - Sovereign Brain HUD
 * ===============================================
 * Dual-hemisphere neural circuit architecture for real-time agent swarm visualization.
 * Left Hemisphere: Analytical Hub (Cyan-400). Right Hemisphere: Synthesizer Hub (Emerald-400).
 * Central Hub: Orchestrator (White-glowing diamond).
 */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Brain,
} from "lucide-react";
import type { AgentActivity } from "@/lib/agents/orchestrator";
import ThoughtBubble from "./ThoughtBubble";

interface NeuralActivityMonitorProps {
  activities: AgentActivity[];
  isBoardroomMode: boolean;
  isMicActive?: boolean; // CLICK-TO-TALK: Mic listening state for HUD sync
  swarmStartTime?: number | null; // Visual persistence: Track swarm start time for 4-second minimum
  isGenerating?: boolean; // ENFORCE 4-SECOND PULSE: Track if swarm is still generating
}

// Agent definitions with geometric sigils and hemisphere assignment
const ANALYTICAL_AGENTS = [
  { id: "sentinel", name: "Data Sentinel", sigil: "◊", description: "Semantic ETL", color: "cyan" },
  { id: "auditor", name: "Math Auditor", sigil: "▣", description: "Triple-Check", color: "cyan" },
  { id: "policy", name: "Policy Auditor", sigil: "◈", description: "Dynamic Ontology", color: "cyan" },
];

const SYNTHESIZER_AGENTS = [
  { id: "narrative", name: "Narrative Synthesizer", sigil: "◐", description: "McKinsey Grade", color: "emerald" },
  { id: "vocal", name: "Vocal Executive", sigil: "◯", description: "Strategic Voice", color: "emerald" },
  { id: "simulation", name: "Simulation Architect", sigil: "◉", description: "Ghost Engine", color: "emerald" },
];

const SUPPORT_AGENTS = [
  { id: "competitive", name: "Competitive Intel", sigil: "⬡", description: "Market Spy", color: "amber" },
  { id: "persistence", name: "Persistence Warden", sigil: "◻", description: "State Recovery", color: "amber" },
];

const PREDICTIVE_SEER = {
  id: "predictive",
  name: "Predictive Seer",
  sigil: "⬙",
  description: "6-Month Oracle",
  color: "purple",
};

const ORCHESTRATOR = {
  id: "orchestrator",
  name: "Orchestrator",
  sigil: "◬",
  description: "Swarm Coordinator",
  color: "white",
};

// Get status color for agent
function getStatusColor(status: AgentActivity["status"], agentColor: string): string {
  if (status === "error") return "text-red-400";
  if (status === "success") return "text-emerald-400";
  if (status === "active") {
    if (agentColor === "cyan") return "text-cyan-400";
    if (agentColor === "emerald") return "text-emerald-400";
    if (agentColor === "white") return "text-white";
    if (agentColor === "purple") return "text-purple-400";
    return "text-amber-400";
  }
  return "text-slate-500";
}

// Get status glow color
function getStatusGlow(status: AgentActivity["status"], agentColor: string): string {
  if (status === "active") {
    if (agentColor === "cyan") return "shadow-cyan-500/50";
    if (agentColor === "emerald") return "shadow-emerald-500/50";
    if (agentColor === "white") return "shadow-white/50";
    if (agentColor === "purple") return "shadow-purple-500/50";
    return "shadow-amber-500/50";
  }
  return "";
}

// Get status icon
function getStatusIcon(status: AgentActivity["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-3 w-3" />;
    case "error":
      return <AlertCircle className="h-3 w-3" />;
    case "active":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    default:
      return <Activity className="h-3 w-3" />;
  }
}

// Custom SVG Sigil Components
interface SigilProps {
  agentId: string;
  isActive: boolean;
  color: "cyan" | "emerald" | "amber" | "purple" | "white";
  size?: number;
}

function AgentSigil({ agentId, isActive, color, size = 20 }: SigilProps) {
  const baseColor = color === "cyan" ? "rgb(34, 211, 238)" : 
                    color === "emerald" ? "rgb(16, 185, 129)" : 
                    color === "amber" ? "rgb(251, 191, 36)" : 
                    color === "purple" ? "rgb(168, 85, 247)" :
                    "rgb(255, 255, 255)";
  
  const opacity = isActive ? 1 : 0.4;
  const scale = isActive ? 1 : 0.9;

  // Common animation props for active state
  const pulseProps = isActive ? {
    animate: {
      opacity: [0.8, 1, 0.8],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  } : {};

  switch (agentId) {
    case "sentinel": // Agent 1: Diamond with horizontal pulse line
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Diamond shape */}
          <motion.polygon
            points={`${size/2},0 ${size},${size/2} ${size/2},${size} 0,${size/2}`}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Horizontal pulse line */}
          <motion.line
            x1={size * 0.3}
            y1={size / 2}
            x2={size * 0.7}
            y2={size / 2}
            stroke={baseColor}
            strokeWidth="1"
            opacity={opacity}
            animate={isActive ? {
              opacity: [0.4, 1, 0.4],
              x1: [size * 0.25, size * 0.3, size * 0.25],
              x2: [size * 0.75, size * 0.7, size * 0.75],
            } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );

    case "auditor": // Agent 2: Square with central dot and 4 corner ticks
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Square */}
          <motion.rect
            x={size * 0.2}
            y={size * 0.2}
            width={size * 0.6}
            height={size * 0.6}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Central dot */}
          <circle cx={size / 2} cy={size / 2} r="1.5" fill={baseColor} opacity={opacity} />
          {/* Corner ticks */}
          <g opacity={opacity}>
            <line x1={size * 0.15} y1={size * 0.2} x2={size * 0.2} y2={size * 0.2} stroke={baseColor} strokeWidth="1" />
            <line x1={size * 0.8} y1={size * 0.2} x2={size * 0.85} y2={size * 0.2} stroke={baseColor} strokeWidth="1" />
            <line x1={size * 0.15} y1={size * 0.8} x2={size * 0.2} y2={size * 0.8} stroke={baseColor} strokeWidth="1" />
            <line x1={size * 0.8} y1={size * 0.8} x2={size * 0.85} y2={size * 0.8} stroke={baseColor} strokeWidth="1" />
          </g>
        </g>
      );

    case "policy": // Agent 3: Shield hexagon with vertical line
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Hexagon shield */}
          <motion.polygon
            points={`${size/2},2 ${size*0.85},${size*0.25} ${size*0.85},${size*0.75} ${size/2},${size-2} ${size*0.15},${size*0.75} ${size*0.15},${size*0.25}`}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Vertical line */}
          <motion.line
            x1={size / 2}
            y1={size * 0.3}
            x2={size / 2}
            y2={size * 0.7}
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </g>
      );

    case "simulation": // Agent 4: Two concentric circles with ghost offset pulse
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Outer circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.4}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Inner circle with ghost offset */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.25}
            fill="none"
            stroke={baseColor}
            strokeWidth="1"
            opacity={opacity * 0.7}
            animate={isActive ? {
              cx: [size / 2, size * 0.52, size / 2],
              cy: [size / 2, size * 0.52, size / 2],
              opacity: [opacity * 0.7, opacity, opacity * 0.7],
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );

    case "competitive": // Agent 5: Triangle within circle
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Outer circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.45}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Inner triangle */}
          <motion.polygon
            points={`${size/2},${size*0.25} ${size*0.75},${size*0.7} ${size*0.25},${size*0.7}`}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
          />
        </g>
      );

    case "narrative": // Agent 7: Half-moon with data-stream tail
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Half-moon arc */}
          <motion.path
            d={`M ${size*0.2} ${size/2} A ${size*0.3} ${size*0.3} 0 0 1 ${size*0.8} ${size/2}`}
            fill="none"
            stroke={baseColor}
            strokeWidth="1.5"
            opacity={opacity}
            scale={scale}
            {...pulseProps}
          />
          {/* Data stream tail (3 dots) */}
          <g opacity={opacity}>
            {[0.15, 0.1, 0.05].map((offset, i) => (
              <motion.circle
                key={i}
                cx={size * (0.2 - offset)}
                cy={size / 2}
                r="1"
                fill={baseColor}
                animate={isActive ? {
                  opacity: [0.3, 1, 0.3],
                  cx: [size * (0.2 - offset), size * (0.18 - offset), size * (0.2 - offset)],
                } : {}}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </g>
        </g>
      );

    case "vocal": // Agent 8: 3 vertical sound bars of increasing height
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {[0.3, 0.5, 0.7].map((xPos, i) => (
            <motion.rect
              key={i}
              x={size * xPos - 1.5}
              y={size * (0.5 - (i + 1) * 0.15)}
              width="3"
              height={size * (i + 1) * 0.15 * 2}
              fill={baseColor}
              opacity={opacity}
              animate={isActive ? {
                height: [
                  size * (i + 1) * 0.15 * 2,
                  size * (i + 1) * 0.2 * 2,
                  size * (i + 1) * 0.15 * 2,
                ],
                opacity: [opacity, opacity * 1.2, opacity],
              } : {}}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </g>
      );

    case "persistence": // Agent 8: Cube with glowing core
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Cube outline (isometric view) */}
          <motion.g opacity={opacity} scale={scale} {...pulseProps}>
            <polygon
              points={`${size*0.3},${size*0.5} ${size*0.7},${size*0.5} ${size*0.85},${size*0.7} ${size*0.45},${size*0.7}`}
              fill="none"
              stroke={baseColor}
              strokeWidth="1.5"
            />
            <polygon
              points={`${size*0.3},${size*0.5} ${size*0.45},${size*0.3} ${size*0.85},${size*0.3} ${size*0.7},${size*0.5}`}
              fill="none"
              stroke={baseColor}
              strokeWidth="1.5"
            />
            <line x1={size*0.45} y1={size*0.3} x2={size*0.45} y2={size*0.7} stroke={baseColor} strokeWidth="1.5" />
            <line x1={size*0.85} y1={size*0.3} x2={size*0.85} y2={size*0.7} stroke={baseColor} strokeWidth="1.5" />
          </motion.g>
          {/* Glowing core */}
          <motion.circle
            cx={size / 2}
            cy={size * 0.5}
            r="2"
            fill={baseColor}
            opacity={opacity}
            animate={isActive ? {
              opacity: [0.5, 1, 0.5],
              r: [2, 3, 2],
            } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </g>
      );

    case "orchestrator": // Agent 9: Diamond star (complex)
      return (
        <g transform={`translate(-${size/2}, -${size/2})`}>
          {/* Outer diamond */}
          <motion.polygon
            points={`${size/2},0 ${size},${size/2} ${size/2},${size} 0,${size/2}`}
            fill="none"
            stroke={baseColor}
            strokeWidth="2"
            opacity={opacity}
            animate={isActive ? {
              opacity: [0.8, 1, 0.8],
              strokeWidth: [2, 2.5, 2],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Inner rotated diamond (45deg rotation) */}
          <g transform={`translate(${size/2}, ${size/2}) rotate(45) translate(-${size/2}, -${size/2})`}>
            <motion.polygon
              points={`${size/2},${size*0.2} ${size*0.8},${size/2} ${size/2},${size*0.8} ${size*0.2},${size/2}`}
              fill="none"
              stroke={baseColor}
              strokeWidth="1.5"
              opacity={opacity * 0.8}
              animate={isActive ? {
                opacity: [0.6, 0.9, 0.6],
              } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>
          {/* Central point */}
          <circle cx={size / 2} cy={size / 2} r="2" fill={baseColor} opacity={opacity} />
        </g>
      );

    default:
      return null;
  }
}

// Calculate position for agent node in hemisphere
function getAgentPosition(
  index: number,
  total: number,
  hemisphere: "left" | "right" | "center",
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } {
  if (hemisphere === "center") {
    return { x: centerX, y: centerY };
  }

  // Calculate angle for circular arrangement
  const angleOffset = hemisphere === "left" ? Math.PI : 0; // Left starts at π, Right starts at 0
  const angleStep = Math.PI / (total + 1); // Distribute agents in semicircle
  const angle = angleOffset + angleStep * (index + 1);
  
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export default function NeuralActivityMonitor({
  activities,
  isBoardroomMode,
  isMicActive = false, // CLICK-TO-TALK: Default to false
  swarmStartTime = null, // Visual persistence: Track swarm start time
  isGenerating = false, // ENFORCE 4-SECOND PULSE: Default to false
}: NeuralActivityMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentActivity["status"]>>(
    new Map()
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [consensusMode, setConsensusMode] = useState<"debating" | "verified" | "idle">("idle");
  const [consensusBloom, setConsensusBloom] = useState(false);

  // Extract VERIFIED domain from Domain Consensus (orchestrator) - use FINAL verified industry
  const detectedDomain = useMemo(() => {
    // PRIORITY 1: Check for domain consensus from orchestrator's FINAL activity log
    const orchestratorActivity = activities
      .filter(a => a.agentId === "orchestrator")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]; // Get most recent orchestrator activity
    
    // HUD "VERIFIED" BLOOM SYNC: Read ONLY from Orchestrator's final metadata
    const orchestratorMetadata = orchestratorActivity?.metadata as {
      domainConsensus?: {
        industry?: string;
        verified?: boolean;
        confidence?: number;
      };
      verifiedIndustry?: string; // Explicit verified industry from metadata
      forcedRetail?: boolean; // Flag for forced Retail
      confidence?: number; // Confidence level
    } | undefined;
    
    // Extract from metadata (priority: verifiedIndustry > domainConsensus)
    const verifiedIndustry = orchestratorMetadata?.verifiedIndustry;
    const consensusData = orchestratorMetadata?.domainConsensus as {
      industry?: string;
      verified?: boolean;
      confidence?: number;
    } | undefined;
    
    // HUD "VERIFIED" BLOOM SYNC: Use verifiedIndustry from metadata if available (highest priority)
    if (verifiedIndustry) {
      const industry = verifiedIndustry.toUpperCase();
      const isRetail = industry === "RETAIL";
      
      // HUD "RETAIL" BLOOM LOGIC: Force "VERIFIED RETAIL DOMAIN" with Cyan-400 glow
      if (isRetail) {
        return {
          text: "VERIFIED RETAIL DOMAIN",
          industry: "RETAIL",
          verified: true,
          confidence: orchestratorMetadata?.confidence || 1.0,
          isRetail: true, // Flag for Cyan-400 glow
        };
      }
      
      return {
        text: `VERIFIED ${industry} DOMAIN`,
        industry,
        verified: true,
        confidence: orchestratorMetadata?.confidence || 1.0,
        isRetail: false,
      };
    }
    
    // Fallback: If orchestrator has verified consensus, use it (this is the absolute truth)
    if (consensusData?.industry && consensusData.verified) {
      const industry = (consensusData.industry as string).toUpperCase();
      const isRetail = industry === "RETAIL";
      
      // HUD "RETAIL" BLOOM LOGIC: Force "VERIFIED RETAIL DOMAIN" with Cyan-400 glow
      if (isRetail) {
        return {
          text: "VERIFIED RETAIL DOMAIN",
          industry: "RETAIL",
          verified: true,
          confidence: consensusData.confidence || 1.0,
          isRetail: true, // Flag for Cyan-400 glow
        };
      }
      
      return {
        text: `VERIFIED ${industry} DOMAIN`,
        industry,
        verified: true,
        confidence: consensusData.confidence || 1.0,
        isRetail: false,
      };
    }
    
    // PRIORITY 2: Check for Agent 0 (Janitor) mathematical verification
    const janitorActivity = activities.find(a => a.agentId === "janitor");
    const janitorVerified = (janitorActivity?.metadata?.verified as boolean) || false;
    const policyActivity = activities.find(a => a.agentId === "policy");
    const policyJanitorVerified = (policyActivity?.metadata?.janitorVerified as boolean) || false;
    const policyForcedRetail = (policyActivity?.metadata?.forcedRetail as boolean) || false;
    const policyVerified = (policyActivity?.metadata?.verified as boolean) || false;
    const policyIndustry = (policyActivity?.metadata?.industry as string)?.toUpperCase();
    
    // HUD SYNC: If Agent 0 confirmed the industry, show "VERIFIED RETAIL DOMAIN"
    if ((janitorVerified || policyJanitorVerified) && policyIndustry === "RETAIL") {
      return {
        text: "VERIFIED RETAIL DOMAIN",
        industry: "RETAIL",
        verified: true,
        confidence: 1.0,
        isRetail: true, // Flag for Cyan-400 glow
      };
    }
    
    // PRIORITY 3: Check for forced Retail from Policy Auditor (KILLER HEURISTIC)
    if (policyForcedRetail && policyIndustry === "RETAIL") {
      return {
        text: "VERIFIED RETAIL DOMAIN",
        industry: "RETAIL",
        verified: true,
        confidence: 1.0,
        isRetail: true, // Flag for Cyan-400 glow
      };
    }
    
    // PRIORITY 4: Check for Policy verified status from API response
    if (policyVerified && policyIndustry) {
      const industry = policyIndustry;
      const isRetail = industry === "RETAIL";
      return {
        text: `VERIFIED ${industry} DOMAIN`,
        industry,
        verified: true,
        confidence: (policyActivity?.metadata?.confidence as number) || 1.0,
        isRetail,
      };
    }
    
    // PRIORITY 3: Fallback to Policy Auditor industry (if available)
    if (policyActivity?.metadata?.industry) {
      const industry = (policyActivity.metadata.industry as string).toUpperCase();
      return {
        text: `${industry} DOMAIN ACTIVE`,
        industry,
        verified: false,
        confidence: (policyActivity.metadata.confidence as number) || 0.5,
        isRetail: industry === "RETAIL",
      };
    }
    
    // PRIORITY 5: Check for ecommerce/retail from kill-switch or context
    const killSwitchIndustry = (orchestratorMetadata as { forcedIndustry?: string })?.forcedIndustry;
    if (killSwitchIndustry && (killSwitchIndustry.toLowerCase() === "ecommerce" || killSwitchIndustry.toLowerCase() === "retail")) {
      return {
        text: "VERIFIED RETAIL DOMAIN",
        industry: "RETAIL",
        verified: true,
        confidence: 1.0,
        isRetail: true, // Flag for Cyan-400 glow
      };
    }
    
    // Default fallback: Only show "SAAS DOMAIN ACTIVE" if actually verified as SaaS
    // If no verification, show generic message
    const hasAnyVerification = verifiedIndustry || consensusData?.verified || policyVerified;
    if (!hasAnyVerification) {
      return {
        text: "DOMAIN DETECTION IN PROGRESS",
        industry: "UNKNOWN",
        verified: false,
        confidence: 0.0,
        isRetail: false,
      };
    }
    
    // Only show SaaS if explicitly verified
    return {
      text: "SAAS DOMAIN ACTIVE",
      industry: "SAAS",
      verified: false,
      confidence: 0.5,
      isRetail: false,
    };
  }, [activities]);

  // Track consensus mode based on activities with visual persistence
  // ENFORCE 4-SECOND "THINKING" PULSE: Ensure pulse lasts for full 4 seconds even if Swarm finishes in 1s
  useEffect(() => {
    const sentinelActivity = activities.find(a => a.agentId === "sentinel" && a.status === "active");
    const policyActivity = activities.find(a => a.agentId === "policy" && a.status === "active");
    const orchestratorActivity = activities.find(a => 
      a.agentId === "orchestrator" && 
      (a.message?.includes("Domain Consensus") || 
       a.message?.includes("Domain Verification Gate") ||
       a.message?.includes("KILLER HEURISTIC") ||
       a.message?.includes("ABSOLUTE DOMAIN LOCK"))
    );
    
    const consensusData = orchestratorActivity?.metadata?.domainConsensus as {
      verified?: boolean;
      industry?: string;
    } | undefined;
    
    // Check for forced Retail from Policy Auditor
    const policyResult = activities.find(a => a.agentId === "policy");
    const policyForcedRetail = (policyResult?.metadata?.forcedRetail as boolean) || false;
    const policyIndustry = (policyResult?.metadata?.industry as string)?.toUpperCase();
    
    // ENFORCE 4-SECOND "THINKING" PULSE: Calculate remaining thinking time
    const minimumThinkingTime = 4000; // 4 seconds
    const isStillThinking = swarmStartTime 
      ? (Date.now() - swarmStartTime) < minimumThinkingTime 
      : false;
    
    // ENFORCE 4-SECOND PULSE: Keep "debating" mode active for full 4 seconds
    // This ensures "VERIFIED RETAIL DOMAIN" only appears AFTER the minimum thinking time
    if (sentinelActivity || policyActivity || isStillThinking || isGenerating) {
      // Consensus debate is happening OR still within 4-second thinking window OR still generating
      setConsensusMode("debating");
    } else if (consensusData?.verified || (policyForcedRetail && policyIndustry === "RETAIL")) {
      // SYNC CONSENSUS MODE: "VERIFIED RETAIL DOMAIN" only appears AFTER the 4-second pulse finishes
      // CRITICAL: Only set to verified if NOT still thinking AND NOT generating
      // This ensures the full 4-second "Deep Reasoning" pulse completes before showing verified status
      if (!isStillThinking && !isGenerating) {
        setConsensusMode("verified");
        // Trigger bloom effect
        setConsensusBloom(true);
        // Reset bloom after animation (2 seconds)
        setTimeout(() => setConsensusBloom(false), 2000);
      } else {
        // Still in thinking phase - keep in debating mode to show pulse
        setConsensusMode("debating");
      }
    } else {
      // No consensus reached yet
      if (!isStillThinking && !isGenerating) {
        setConsensusMode("idle");
      } else {
        // Still in thinking phase - keep in debating mode
        setConsensusMode("debating");
      }
    }
  }, [activities, swarmStartTime, isGenerating]);

  // Get latest activity for each agent (for thought bubbles)
  const latestActivities = useMemo(() => {
    const activityMap = new Map<string, AgentActivity>();
    activities.forEach((activity) => {
      const existing = activityMap.get(activity.agentId);
      // Keep the most recent activity, prioritizing active status
      if (!existing || activity.timestamp > existing.timestamp) {
        activityMap.set(activity.agentId, activity);
      } else if (
        activity.status === "active" &&
        existing.status !== "active" &&
        activity.timestamp >= existing.timestamp
      ) {
        activityMap.set(activity.agentId, activity);
      }
    });
    return activityMap;
  }, [activities]);

  // Update agent statuses from activities
  useEffect(() => {
    const statusMap = new Map<string, AgentActivity["status"]>();
    activities.forEach((activity) => {
      const currentStatus = statusMap.get(activity.agentId);
      if (!currentStatus || activity.status === "error" || activity.status === "success") {
        statusMap.set(activity.agentId, activity.status);
      }
    });
    setAgentStatuses(statusMap);
  }, [activities]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  if (!isBoardroomMode) {
    return null;
  }

  // SVG dimensions
  const svgWidth = 360;
  const svgHeight = 280;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = 100;

  // Get agent positions
  const analyticalPositions = ANALYTICAL_AGENTS.map((agent, i) => ({
    agent,
    ...getAgentPosition(i, ANALYTICAL_AGENTS.length, "left", centerX, centerY, radius),
  }));

  const synthesizerPositions = SYNTHESIZER_AGENTS.map((agent, i) => ({
    agent,
    ...getAgentPosition(i, SYNTHESIZER_AGENTS.length, "right", centerX, centerY, radius),
  }));

  const orchestratorPos = getAgentPosition(0, 1, "center", centerX, centerY, 0);
  
  // Agent 10: Predictive Seer at Top-Center
  const predictiveSeerPos: { x: number; y: number } = {
    x: centerX,
    y: centerY - radius - 40, // Top-center, above the hub
  };

  return (
    <motion.div
      initial={{ x: isExpanded ? 0 : 400 }}
      animate={{ x: isExpanded ? 0 : 400 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 z-40 h-full w-96"
    >
      {/* Monitor Panel */}
      <div className="relative h-full w-full border-l border-slate-800/50 bg-slate-950/95 backdrop-blur-xl shadow-2xl">
        {/* Header with Dynamic Domain Context */}
        <div className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
                <Brain className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Sovereign Brain HUD
                </h3>
                <motion.p 
                  className={`text-[10px] font-medium ${
                    isMicActive
                      ? "text-cyan-400" // CLICK-TO-TALK: Cyan when mic is active
                      : detectedDomain.industry === "RETAIL" 
                        ? "text-cyan-400" 
                        : "text-emerald-400"
                  }`}
                  animate={consensusBloom || isMicActive ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.9, 1],
                  } : {}}
                  transition={{
                    duration: isMicActive ? 0.4 : 0.6, // Faster pulse when mic is active
                    repeat: isMicActive ? Infinity : 0,
                    ease: "easeOut",
                  }}
        style={{
          textShadow: (consensusBloom || isMicActive)
            ? ((detectedDomain as { isRetail?: boolean }).isRetail || detectedDomain.industry === "RETAIL" || isMicActive)
              ? "0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4)"
              : "0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4)"
            : "none",
        }}
      >
        {isMicActive ? "SOVEREIGN MIC ACTIVE" : detectedDomain.text}
      </motion.p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              {isExpanded ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[calc(100%-65px)] flex-col"
            >
              {/* Dual-Hemisphere Neural Grid */}
              <div className="border-b border-slate-800/50 bg-slate-900/40 p-4">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  className="mx-auto"
                  style={{ maxWidth: "100%", height: "auto" }}
                >
                  <defs>
                    {/* Cyan gradient for Analytical Hub */}
                    <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0.1" />
                    </linearGradient>
                    {/* Emerald gradient for Synthesizer Hub */}
                    <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.1" />
                    </linearGradient>
                    {/* White gradient for Orchestrator */}
                    <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="rgb(255, 255, 255)" stopOpacity="0.3" />
                    </linearGradient>
                    {/* Purple gradient for Predictive Seer (Agent 10) */}
                    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Neural Veins: Analytical Hub to Orchestrator */}
                  {analyticalPositions.map(({ agent, x, y }) => {
                    const status = agentStatuses.get(agent.id) || "idle";
                    const isActive = status === "active";
                    // Consensus Mode: Rapid flicker for Sentinel and Policy veins
                    const isConsensusAgent = agent.id === "sentinel" || agent.id === "policy";
                    const isConsensusDebating = consensusMode === "debating" && isConsensusAgent;
                    // CLICK-TO-TALK: Higher frequency pulse when mic is active
                    const isMicPulse = isMicActive;

                    return (
                      <motion.line
                        key={`vein-analytical-${agent.id}`}
                        x1={x}
                        y1={y}
                        x2={orchestratorPos.x}
                        y2={orchestratorPos.y}
                        stroke="url(#cyanGradient)"
                        strokeWidth={isActive || isMicPulse ? "2" : "1"}
                        strokeOpacity={isActive || isMicPulse ? 0.6 : 0.2}
                        initial={{ pathLength: 0 }}
                        animate={{
                          pathLength: 1,
                          strokeOpacity: isConsensusDebating
                            ? [0.2, 0.8, 0.2, 0.8, 0.2] // Rapid flicker
                            : isMicPulse
                            ? [0.6, 1.0, 0.6, 1.0, 0.6] // High-frequency pulse for mic
                            : isActive
                            ? [0.6, 0.9, 0.6]
                            : 0.2,
                        }}
                        transition={{
                          duration: isConsensusDebating 
                            ? 0.3 
                            : isMicPulse 
                            ? 0.4 // Faster pulse when mic is active
                            : isActive 
                            ? 1.5 
                            : 0.5,
                          repeat: isConsensusDebating || isActive || isMicPulse ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}

                  {/* Neural Veins: Predictive Seer (Agent 10) to Analytical Hub */}
                  {analyticalPositions.map(({ agent, x, y }) => {
                    const predictiveStatus = agentStatuses.get("predictive") || "idle";
                    const isPredictiveActive = predictiveStatus === "active";
                    const isGlowStorm = isPredictiveActive;

                    if (!isGlowStorm) return null;

                    return (
                      <motion.line
                        key={`vein-predictive-analytical-${agent.id}`}
                        x1={predictiveSeerPos.x}
                        y1={predictiveSeerPos.y}
                        x2={x}
                        y2={y}
                        stroke="url(#purpleGradient)"
                        strokeWidth={isPredictiveActive ? "3" : "1"}
                        strokeOpacity={isPredictiveActive ? 0.8 : 0.2}
                        initial={{ pathLength: 0 }}
                        animate={{
                          pathLength: 1,
                          strokeOpacity: isPredictiveActive ? [0.8, 1, 0.8] : 0.2,
                          strokeWidth: isPredictiveActive ? ["3", "4", "3"] : "1",
                        }}
                        transition={{
                          duration: isPredictiveActive ? 1.2 : 0.5,
                          repeat: isPredictiveActive ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}

                  {/* Neural Veins: Predictive Seer (Agent 10) to Synthesizer Hub */}
                  {synthesizerPositions.map(({ agent, x, y }) => {
                    const predictiveStatus = agentStatuses.get("predictive") || "idle";
                    const isPredictiveActive = predictiveStatus === "active";
                    const isGlowStorm = isPredictiveActive;

                    if (!isGlowStorm) return null;

                    return (
                      <motion.line
                        key={`vein-predictive-synthesizer-${agent.id}`}
                        x1={predictiveSeerPos.x}
                        y1={predictiveSeerPos.y}
                        x2={x}
                        y2={y}
                        stroke="url(#purpleGradient)"
                        strokeWidth={isPredictiveActive ? "3" : "1"}
                        strokeOpacity={isPredictiveActive ? 0.8 : 0.2}
                        initial={{ pathLength: 0 }}
                        animate={{
                          pathLength: 1,
                          strokeOpacity: isPredictiveActive ? [0.8, 1, 0.8] : 0.2,
                          strokeWidth: isPredictiveActive ? ["3", "4", "3"] : "1",
                        }}
                        transition={{
                          duration: isPredictiveActive ? 1.2 : 0.5,
                          repeat: isPredictiveActive ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}

                  {/* Neural Veins: Synthesizer Hub to Orchestrator */}
                  {synthesizerPositions.map(({ agent, x, y }) => {
                    const status = agentStatuses.get(agent.id) || "idle";
                    const isActive = status === "active";
                    // CLICK-TO-TALK: Higher frequency pulse when mic is active
                    const isMicPulse = isMicActive;
                    // VISUAL PERSISTENCE: Keep pulsing if still within 4-second thinking window
                    const minimumThinkingTime = 4000;
                    const isStillThinking = swarmStartTime 
                      ? (Date.now() - swarmStartTime) < minimumThinkingTime 
                      : false;
                    const shouldPulse = isActive || isMicPulse || isStillThinking;

                    return (
                      <motion.line
                        key={`vein-synthesizer-${agent.id}`}
                        x1={x}
                        y1={y}
                        x2={orchestratorPos.x}
                        y2={orchestratorPos.y}
                        stroke="url(#emeraldGradient)"
                        strokeWidth={shouldPulse ? "2" : "1"}
                        strokeOpacity={shouldPulse ? 0.6 : 0.2}
                        initial={{ pathLength: 0 }}
                        animate={{
                          pathLength: 1,
                          strokeOpacity: isMicPulse
                            ? [0.6, 1.0, 0.6, 1.0, 0.6] // High-frequency pulse for mic
                            : isActive || isStillThinking
                            ? [0.6, 0.9, 0.6] // Pulse during active or thinking window
                            : 0.2,
                        }}
                        transition={{
                          duration: isMicPulse ? 0.4 : isActive || isStillThinking ? 1.5 : 0.5, // Faster pulse when mic is active
                          repeat: shouldPulse ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                    );
                  })}

                  {/* Analytical Hub Nodes (Left Hemisphere - Cyan) */}
                  {analyticalPositions.map(({ agent, x, y }) => {
                    const status = agentStatuses.get(agent.id) || "idle";
                    const statusColor = getStatusColor(status, agent.color);
                    const isActive = status === "active";
                    const latestActivity = latestActivities.get(agent.id);

                    return (
                      <g key={`node-analytical-${agent.id}`}>
                        {/* Thought Bubble */}
                        <ThoughtBubble
                          activity={latestActivity || null}
                          isActive={isActive}
                          hemisphereColor="cyan"
                          position={{ x, y }}
                          svgContainer={{ width: svgWidth, height: svgHeight }}
                        />
                        
                        {/* Pulsing glow ring when active */}
                        {isActive && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="16"
                            fill="none"
                            stroke="rgb(34, 211, 238)"
                            strokeWidth="2"
                            opacity={0.5}
                            animate={{
                              r: [16, 20, 16],
                              opacity: [0.5, 0.2, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                        {/* Agent node */}
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill="rgb(15, 23, 42)"
                          stroke={isActive ? "rgb(34, 211, 238)" : "rgb(51, 65, 85)"}
                          strokeWidth={isActive ? "2" : "1"}
                        />
                        {/* Custom SVG Sigil */}
                        <g transform={`translate(${x}, ${y})`}>
                          <AgentSigil
                            agentId={agent.id}
                            isActive={isActive}
                            color="cyan"
                            size={16}
                          />
                        </g>
                        {/* Glow effect when active */}
                        {isActive && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="14"
                            fill="none"
                            stroke="rgb(34, 211, 238)"
                            strokeWidth="1"
                            opacity={0}
                            animate={{
                              opacity: [0, 0.3, 0],
                              r: [14, 18, 14],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Synthesizer Hub Nodes (Right Hemisphere - Emerald) */}
                  {synthesizerPositions.map(({ agent, x, y }) => {
                    const status = agentStatuses.get(agent.id) || "idle";
                    const statusColor = getStatusColor(status, agent.color);
                    const isActive = status === "active";
                    const latestActivity = latestActivities.get(agent.id);

                    return (
                      <g key={`node-synthesizer-${agent.id}`}>
                        {/* Thought Bubble */}
                        <ThoughtBubble
                          activity={latestActivity || null}
                          isActive={isActive}
                          hemisphereColor="emerald"
                          position={{ x, y }}
                          svgContainer={{ width: svgWidth, height: svgHeight }}
                        />
                        
                        {/* Pulsing glow ring when active */}
                        {isActive && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="16"
                            fill="none"
                            stroke="rgb(16, 185, 129)"
                            strokeWidth="2"
                            opacity={0.5}
                            animate={{
                              r: [16, 20, 16],
                              opacity: [0.5, 0.2, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                        {/* Agent node */}
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill="rgb(15, 23, 42)"
                          stroke={isActive ? "rgb(16, 185, 129)" : "rgb(51, 65, 85)"}
                          strokeWidth={isActive ? "2" : "1"}
                        />
                        {/* Custom SVG Sigil */}
                        <g transform={`translate(${x}, ${y})`}>
                          <AgentSigil
                            agentId={agent.id}
                            isActive={isActive}
                            color="emerald"
                            size={16}
                          />
                        </g>
                        {/* Glow effect when active */}
                        {isActive && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="14"
                            fill="none"
                            stroke="rgb(16, 185, 129)"
                            strokeWidth="1"
                            opacity={0}
                            animate={{
                              opacity: [0, 0.3, 0],
                              r: [14, 18, 14],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Agent 10: Predictive Seer (Top-Center - Purple) */}
                  <g>
                    {(() => {
                      const predictiveActivity = latestActivities.get("predictive");
                      const predictiveStatus = agentStatuses.get("predictive") || "idle";
                      const isPredictiveActive = predictiveStatus === "active";
                      return (
                        <>
                          {/* Thought Bubble for Predictive Seer */}
                          <ThoughtBubble
                            activity={predictiveActivity || null}
                            isActive={isPredictiveActive}
                            hemisphereColor="purple"
                            position={{ x: predictiveSeerPos.x, y: predictiveSeerPos.y }}
                            svgContainer={{ width: svgWidth, height: svgHeight }}
                          />
                          
                          {/* Pulsing purple glow ring when active */}
                          {isPredictiveActive && (
                            <motion.circle
                              cx={predictiveSeerPos.x}
                              cy={predictiveSeerPos.y}
                              r="18"
                              fill="none"
                              stroke="rgb(168, 85, 247)"
                              strokeWidth="2"
                              opacity={0.5}
                              animate={{
                                r: [18, 22, 18],
                                opacity: [0.5, 0.2, 0.5],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          )}
                          
                          {/* Predictive Seer node */}
                          <circle
                            cx={predictiveSeerPos.x}
                            cy={predictiveSeerPos.y}
                            r="14"
                            fill="rgb(15, 23, 42)"
                            stroke={isPredictiveActive ? "rgb(168, 85, 247)" : "rgb(51, 65, 85)"}
                            strokeWidth={isPredictiveActive ? "2" : "1"}
                          />
                          
                          {/* Purple crystal diamond sigil */}
                          <text
                            x={predictiveSeerPos.x}
                            y={predictiveSeerPos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-lg text-purple-400"
                            fontWeight="bold"
                          >
                            {PREDICTIVE_SEER.sigil}
                          </text>
                          
                          {/* Glow effect when active */}
                          {isPredictiveActive && (
                            <motion.circle
                              cx={predictiveSeerPos.x}
                              cy={predictiveSeerPos.y}
                              r="16"
                              fill="none"
                              stroke="rgb(168, 85, 247)"
                              strokeWidth="1"
                              opacity={0}
                              animate={{
                                opacity: [0, 0.4, 0],
                                r: [16, 20, 16],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </g>

                  {/* Central Hub: Orchestrator (White-glowing diamond) */}
                  <g>
                    {/* Thought Bubble for Orchestrator */}
                    {(() => {
                      const orchestratorActivity = latestActivities.get("orchestrator");
                      const orchestratorStatus = agentStatuses.get("orchestrator") || "idle";
                      const isOrchestratorActive = orchestratorStatus === "active";
                      return (
                        <ThoughtBubble
                          activity={orchestratorActivity || null}
                          isActive={isOrchestratorActive}
                          hemisphereColor="white"
                          position={{ x: orchestratorPos.x, y: orchestratorPos.y }}
                          svgContainer={{ width: svgWidth, height: svgHeight }}
                        />
                      );
                    })()}
                    
                    {/* Pulsing white glow ring */}
                    <motion.circle
                      cx={orchestratorPos.x}
                      cy={orchestratorPos.y}
                      r="20"
                      fill="none"
                      stroke="rgb(255, 255, 255)"
                      strokeWidth="2"
                      opacity={0.4}
                      animate={{
                        r: [20, 24, 20],
                        opacity: [0.4, 0.6, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    {/* Orchestrator node */}
                    <circle
                      cx={orchestratorPos.x}
                      cy={orchestratorPos.y}
                      r="16"
                      fill="rgb(15, 23, 42)"
                      stroke="rgb(255, 255, 255)"
                      strokeWidth="2"
                    />
                    {/* White diamond sigil */}
                    <text
                      x={orchestratorPos.x}
                      y={orchestratorPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-xl text-white"
                      fontWeight="bold"
                    >
                      {ORCHESTRATOR.sigil}
                    </text>
                  </g>

                  {/* Labels (optional, can be toggled) */}
                  {false && (
                    <>
                      {[...analyticalPositions, ...synthesizerPositions].map(({ agent, x, y }) => (
                        <text
                          key={`label-${agent.id}`}
                          x={x}
                          y={y + 25}
                          textAnchor="middle"
                          className="text-[8px] fill-slate-500"
                        >
                          {agent.name.split(" ")[1] || agent.name}
                        </text>
                      ))}
                    </>
                  )}
                </svg>

                {/* Agent Status Legend */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                  {/* Analytical Hub Legend */}
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
                    <div className="mb-1 font-semibold text-cyan-400">Analytical Hub</div>
                    <div className="space-y-0.5 text-slate-400">
                      {ANALYTICAL_AGENTS.map((agent) => {
                        const status = agentStatuses.get(agent.id) || "idle";
                        return (
                          <div key={agent.id} className="flex items-center gap-1">
                            <span className={getStatusColor(status, agent.color)}>
                              {getStatusIcon(status)}
                            </span>
                            <span className="truncate">{agent.name.split(" ")[1]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Synthesizer Hub Legend */}
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                    <div className="mb-1 font-semibold text-emerald-400">Synthesizer Hub</div>
                    <div className="space-y-0.5 text-slate-400">
                      {SYNTHESIZER_AGENTS.map((agent) => {
                        const status = agentStatuses.get(agent.id) || "idle";
                        return (
                          <div key={agent.id} className="flex items-center gap-1">
                            <span className={getStatusColor(status, agent.color)}>
                              {getStatusIcon(status)}
                            </span>
                            <span className="truncate">{agent.name.split(" ")[1]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Support Agents Legend */}
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                    <div className="mb-1 font-semibold text-amber-400">Support</div>
                    <div className="space-y-0.5 text-slate-400">
                      {SUPPORT_AGENTS.map((agent) => {
                        const status = agentStatuses.get(agent.id) || "idle";
                        return (
                          <div key={agent.id} className="flex items-center gap-1">
                            <span className={getStatusColor(status, agent.color)}>
                              {getStatusIcon(status)}
                            </span>
                            <span className="truncate">{agent.name.split(" ")[1]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Thought Stream */}
              <div className="flex-1 overflow-hidden">
                <div className="border-b border-slate-800/50 bg-slate-900/40 px-4 py-2 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Thought Stream
                    </h4>
                    <div className="flex items-center gap-1.5">
                      {/* Consensus Status Indicator */}
                      {consensusMode === "debating" && (
                        <motion.div
                          className="flex items-center gap-1.5 text-[9px] text-amber-400 mr-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div
                            className="h-1.5 w-1.5 rounded-full bg-amber-400"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span>Consensus Debate</span>
                        </motion.div>
                      )}
                      {consensusMode === "verified" && (
                        <motion.div
                          className="flex items-center gap-1.5 text-[9px] text-emerald-400 mr-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div
                            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span>Domain Verified</span>
                        </motion.div>
                      )}
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        animate={{
                          opacity: [1, 0.3, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="text-[10px] text-emerald-400">LIVE</span>
                    </div>
                  </div>
                </div>

                {/* Terminal-style log */}
                <div
                  ref={scrollRef}
                  className="h-full overflow-y-auto bg-slate-950/50 p-4 font-mono text-xs"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgb(51 65 85) transparent",
                  }}
                >
                  <div className="space-y-1.5">
                    {activities.length === 0 ? (
                      <div className="text-slate-600">
                        <div className="text-slate-500">Waiting for agent activity...</div>
                        <div className="mt-2 text-[10px] text-slate-600">
                          [Orchestrator] Initializing swarm...
                        </div>
                      </div>
                    ) : (
                      activities.map((activity, index) => {
                        const statusColor = getStatusColor(
                          activity.status,
                          ANALYTICAL_AGENTS.find((a) => a.id === activity.agentId)?.color ||
                            SYNTHESIZER_AGENTS.find((a) => a.id === activity.agentId)?.color ||
                            "amber"
                        );
                        const agentConfig = [
                          ...ANALYTICAL_AGENTS,
                          ...SYNTHESIZER_AGENTS,
                          ...SUPPORT_AGENTS,
                          ORCHESTRATOR,
                        ].find((a) => a.id === activity.agentId);

                        // Enhanced consensus messages for Thought Stream
                        let displayMessage = activity.message;
                        
                        // Add consensus-specific messages
                        if (activity.agentId === "sentinel" && activity.status === "active") {
                          displayMessage = "Sentinel: Scanning headers for DNA signatures...";
                        } else if (activity.agentId === "policy" && activity.status === "active") {
                          displayMessage = "Policy: Matching benchmarks against Retail Policy...";
                        } else if (
                          activity.agentId === "orchestrator" &&
                          (activity.message?.includes("Domain Consensus") ||
                           activity.message?.includes("ABSOLUTE DOMAIN LOCK") ||
                           activity.message?.includes("KILLER HEURISTIC"))
                        ) {
                          displayMessage = "Orchestrator: Consensus Reached. Domain Verified.";
                        } else if (
                          activity.agentId === "orchestrator" &&
                          activity.message?.includes("Domain Verification Gate")
                        ) {
                          displayMessage = "Orchestrator: Establishing consensus between Sentinel and Policy...";
                        }

                        return (
                          <motion.div
                            key={`${activity.agentId}-${index}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-2"
                          >
                            <span className={`shrink-0 ${statusColor}`}>
                              {agentConfig?.sigil || "•"}
                            </span>
                            <div className="flex-1">
                              <span className={`${statusColor} font-semibold`}>
                                [{activity.agentName}]
                              </span>
                              <span className="text-slate-400"> {displayMessage}</span>
                              <span className="ml-2 text-[10px] text-slate-600">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
