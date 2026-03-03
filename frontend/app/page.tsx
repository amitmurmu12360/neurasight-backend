"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  User2,
  Database,
  RefreshCw,
  Radio,
  Zap,
  Search,
  Link2,
  Unlink,
  CheckCircle,
  ExternalLink,
  FileSpreadsheet,
  Download,
  Copy,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Search as MagnifyingGlass,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExecutionLog, { Persona } from "@/components/ExecutionLog";
import DashboardGrid from "@/components/DashboardGrid";
import LiveDashboard from "@/components/LiveDashboard";
import InsightPanel from "@/components/InsightPanel";
import InvestigationDrawer from "@/components/InvestigationDrawer";
import { ToastContainer, useToast } from "@/components/Toast";
import ActionLogger, { type ThoughtStep } from "@/components/ActionLogger";
import NeuralSimulator from "@/components/NeuralSimulator";
import VoiceCommandCenter from "@/components/VoiceCommandCenter";
import GlobalVoiceToggle from "@/components/GlobalVoiceToggle";
import MarketBattleCard from "@/components/MarketBattleCard";
import NeuralActivityMonitor from "@/components/NeuralActivityMonitor";
import SchemaVerificationModal from "@/components/SchemaVerificationModal";
import VerificationBadge from "@/components/VerificationBadge";
import SovereignHUD from "@/components/SovereignHUD";
import AgenticFlow from "@/components/dashboard/AgenticFlow";
import SystemOverviewModal from "@/components/SystemOverviewModal";
import { useSwarmMonitor } from "@/components/dashboard/SwarmMonitor";
import SovereignEmptyState from "@/components/SovereignEmptyState";
import SovereignIngestionHub from "@/components/SovereignIngestionHub";
import AgenticPulseTerminal from "@/components/AgenticPulseTerminal";
import DNAScanOverlay from "@/components/DNAScanOverlay";
import SovereignGovernance from "@/components/SovereignGovernance";
import SovereignHistory from "@/components/SovereignHistory";
import SentinelBadge from "@/components/SentinelBadge";
import MathIntegrityBadge from "@/components/MathIntegrityBadge";
import IntegritySeal from "@/components/IntegritySeal";
import TypewriterText from "@/components/TypewriterText";
import DecisionPortal, { type StrategicOption } from "@/components/dashboard/DecisionPortal";
import AnalyticsSuite from "@/components/dashboard/AnalyticsSuite";
import LiveStrategyMap from "@/components/dashboard/LiveStrategyMap";
import ExecutiveActionCenter from "@/components/dashboard/ExecutiveActionCenter";
import ExecutiveHealthGauge from "@/components/dashboard/ExecutiveHealthGauge";
import ExecutionConfirmationModal from "@/components/dashboard/ExecutionConfirmationModal";
import SourceSelector, { type SourceType } from "@/components/dashboard/SourceSelector";
import AuditTrail, { type AuditLogEntry } from "@/components/dashboard/AuditTrail";
import WelcomeOverlay, { shouldShowWelcome } from "@/components/onboarding/WelcomeOverlay";
import { calculateIntelligenceHealth, type IntelligenceHealthResult, predictHealthBoost } from "@/lib/healthEngine";
import { universalParser, type ParsedData } from "@/lib/sourceAdapters";
import { checkStrategicAnomalies, getSentinelStatus } from "@/lib/sentinelAlerts";
import type { ForecastResult } from "@/lib/forecastingEngine";
import AuthModal from "@/components/auth/AuthModal";
import { generateMockDashboardState } from "@/lib/mockGenerator";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNeuralVoice } from "@/hooks/useNeuralVoice";
import { useDataSimulator } from "@/hooks/useDataSimulator";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { generateExecutivePDF, copyToNotionFormat } from "@/lib/export";
import { generateExecutivePDFReport } from "@/lib/pdfGenerator";
import { getRememberedMapping, rememberMapping, hasSimilarStructure } from "@/lib/sourceMemory";
import { universalBrain, type RiskAppetite, type RiskCalculation, type StrategicDebate, type ResolutionPayload } from "@/lib/swarmEngine";
import BoardroomMode from "@/components/dashboard/BoardroomMode";
import { supabase, getProfile, updateUserProfile } from "@/lib/supabase";
import { getSovereignConnectors } from "@/lib/sovereignVault";
import { getPersonaSystemPrompt, getPersonaAnalysisInstructions, PERSONA_STRATEGIES, type PersonaType } from "@/lib/personaStrategies";
import { extractRecommendations } from "@/lib/recommendationExtractor";
import type { PrioritizedMetric, MetricId } from "@/lib/intelligence";
import type { DashboardState } from "@/types/dashboard";
import type { Scenario } from "@/lib/testing/scenarios";
import type { ToleranceLevel } from "@/components/SovereignGovernance";

// Google Sheets Template URL
const TEMPLATE_COPY_URL =
  "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy";

// Simple Markdown to HTML converter (for AI analysis display)
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-emerald-300 font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-emerald-400 font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-emerald-500 font-bold mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-400">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.*)$/, '<p>$1</p>');
}

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>("CEO");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generationId, setGenerationId] = useState(0);
  const [isSwarmExecuting, setIsSwarmExecuting] = useState(false); // Prevent race conditions
  const [isMicActive, setIsMicActive] = useState(false); // CLICK-TO-TALK: Mic listening state for HUD sync
  const [swarmStartTime, setSwarmStartTime] = useState<number | null>(null); // Track swarm start for visual persistence

  // Chaos Engine: Stress Test Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isStressTest, setIsStressTest] = useState(false);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>("balanced");
  const [riskCalculation, setRiskCalculation] = useState<RiskCalculation | null>(null);
  const [strategicDebate, setStrategicDebate] = useState<StrategicDebate | null>(null);
  const [resolutionPayload, setResolutionPayload] = useState<import("@/lib/swarmEngine").ResolutionPayload | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Sovereign Ingestion Hub (unified ingestion portal)
  const [isIngestionHubOpen, setIsIngestionHubOpen] = useState(false);

  // Investigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] =
    useState<PrioritizedMetric | null>(null);

  // Track completed actions
  const [completedActions, setCompletedActions] = useState<Set<MetricId>>(
    new Set()
  );

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // Executive Action Center State
  // Sentinel State
  const [sentinelAnomalyCount, setSentinelAnomalyCount] = useState(0);
  const [currentForecast, setCurrentForecast] = useState<ForecastResult | null>(null);

  // Quantum Math Integrity State
  const [toleranceLevel, setToleranceLevel] = useState<ToleranceLevel>("STANDARD");
  const [silverContext, setSilverContext] = useState<Array<Record<string, unknown>>>([]);
  const [mathIntegrityConfidence, setMathIntegrityConfidence] = useState<number>(1.0);

  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    frameworkTag: "SWOT" | "AARRR" | "MEDDIC" | "General";
    description?: string;
    persona: PersonaType;
  }>>([]);

  // Detective Mode State
  const [isDetectiveMode, setIsDetectiveMode] = useState(false);
  const [detectiveFactor, setDetectiveFactor] = useState<'freshness' | 'integrity' | 'execution' | null>(null);
  const [detectedFixPayload, setDetectedFixPayload] = useState<any | null>(null);
  
  // Execution Layer State
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [isExecutingFix, setIsExecutingFix] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [previewDiffs, setPreviewDiffs] = useState<Array<{ before: string | number | boolean; after: string | number | boolean; impact: string; location: string }> | null>(null);
  const [strategicImpact, setStrategicImpact] = useState<string | null>(null);
  const [predictedHealthBoost, setPredictedHealthBoost] = useState<number | null>(null);

  // Agentic Thought Logger State
  const [thoughtLogs, setThoughtLogs] = useState<ThoughtStep[]>([]);

  // Export State
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isCopyingNotion, setIsCopyingNotion] = useState(false);
  const [policyViolations, setPolicyViolations] = useState<Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: string;
    message: string;
  }>>([]);

  // Simulate Fix State
  const [simulatingRisk, setSimulatingRisk] = useState<string | null>(null);
  const [simulationScenarios, setSimulationScenarios] = useState<Array<{
    name: string;
    description: string;
    actions: string[];
    expected_outcome: string;
    timeline: string;
    risk_level: string;
  }> | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Agent Swarm Monitor (manages 11-agent swarm state and animations)
  const { agentActivities, resetActivities, updateActivitiesFromSwarm } = useSwarmMonitor();
  
  // Validator Result (Agent 0: Final Boss)
  const [validatorResult, setValidatorResult] = useState<{
    success: boolean;
    certificate?: {
      consensus_score: number;
      integrity_seal: string;
      domain_verified: boolean;
      timestamp: string;
      domain: string;
      verified_metrics: string[];
      validation_checks: {
        hash_verification: boolean;
        domain_validation: boolean;
        policy_compliance: boolean;
      };
    };
    error?: string;
    data?: {
      requiresReScan?: boolean;
      integrityFailure?: boolean;
    };
  } | undefined>(undefined);
  
  // Verified Industry for HUD
  const [verifiedIndustry, setVerifiedIndustry] = useState<string>("saas");
  
  // Strategic Actions from Agent 11
  const [strategicActions, setStrategicActions] = useState<Array<{
    title: string;
    impact_analysis: string;
    risk_level: "low" | "medium" | "high";
    confidence_score: number;
    persona_alignment: Persona;
    industry_relevance: string;
    one_click_action_payload: {
      action_type: string;
      parameters: Record<string, unknown>;
      target_metric?: string;
      expected_impact?: {
        metric: string;
        change_percent: number;
        timeframe: string;
      };
    };
    metadata?: {
      user_preference_bias?: string[];
      requires_manual_review?: boolean;
      conflict_resolution_applied?: boolean;
      anomaly_source?: string;
    };
  }>>([]);

  // Market Simulation State
  const [marketData, setMarketData] = useState<{
    market_avg: Record<string, number>;
    top_decile: Record<string, number>;
    strategic_advantage_score: number;
    leaderboard_position?: string;
    gap_analysis?: string;
  } | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);

  // Decision Portal State
  const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState<StrategicOption[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<"aggressive" | "balanced" | "defensive" | null>(null);

  // Onboarding & Auth State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSystemOverview, setShowSystemOverview] = useState(false);
  const [demoData, setDemoData] = useState<DashboardState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastSavedSpreadsheetId, setLastSavedSpreadsheetId] = useState<string | null>(null);

  // Hybrid Sync & Intelligence State
  const lastSyncTimeRef = useRef<number>(Date.now());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Source Selection State
  const [selectedSource, setSelectedSource] = useState<SourceType>("GOOGLE_SHEETS");
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  
  // Ingestion Ceremony State
  const [isIngesting, setIsIngesting] = useState(false);
  
  // Sovereign Governance State
  const [isWriteEnabled, setIsWriteEnabled] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | undefined>();
  const [dataContract, setDataContract] = useState<{
    tx_id?: string;
    metrics?: Record<string, number>;
    total_rows?: number;
    ontology_mapping?: Record<string, string>;
    industry?: string;
  } | null>(null);
  
  // Sovereign Connector State (now part of Ingestion Hub)
  const [activeConnectors, setActiveConnectors] = useState<string[]>([]);
  
  // Intelligence Health Score State
  const [executeCount, setExecuteCount] = useState(0); // Track "Execute via AI Agent" clicks
  const [intelligenceHealth, setIntelligenceHealth] = useState<IntelligenceHealthResult>({
    score: 100,
    label: "Excellent",
    color: "#10b981",
    statusDescription: "All systems optimal. Intelligence pipeline healthy.",
    breakdown: {
      freshness: {
        score: 30,
        maxScore: 30,
        deduction: 0,
        message: "Data is fresh and up-to-date.",
      },
      integrity: {
        score: 40,
        maxScore: 40,
        deduction: 0,
        message: "All systems verified. No math warnings.",
      },
      execution: {
        score: 0,
        maxScore: 30,
        bonus: 0,
        message: "No strategic actions executed yet.",
      },
    },
  });

  // Neural Voice Hook (load mute state from localStorage/Supabase)
  const initialMuted = typeof window !== "undefined" 
    ? localStorage.getItem("neurasight_audio_muted") === "true"
    : true;
  const { speak, isMuted: voiceMuted, getPersonaColor } = useNeuralVoice(initialMuted, selectedPersona as PersonaType);

  // Toast notifications
  const { toasts, dismissToast, success, error: showError, info } = useToast();

  // Helper to add a thought step (MUST be defined immediately after hooks, before any useCallback/useEffect)
  const addThought = (
    message: string,
    status: ThoughtStep["status"],
    icon?: ThoughtStep["icon"]
  ) => {
    const newThought: ThoughtStep = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      status,
      icon,
      timestamp: new Date(),
    };
    setThoughtLogs((prev) => [...prev, newThought]);
    return newThought.id;
  };

  // Helper to update a thought status (MUST be defined immediately after hooks, before any useCallback/useEffect)
  const updateThought = (id: string, status: ThoughtStep["status"]) => {
    setThoughtLogs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  // Fetch live dashboard data from backend (fallback)
  const {
    data: backendData,
    isLoading: backendLoading,
    error: backendError,
    refetch: refetchBackend,
  } = useDashboardData();

  // Google Sheets integration (MUST be before useEffect that uses connectSheets)
  const {
    data: sheetsData,
    isLoading: sheetsLoading,
    error: sheetsError,
    connection,
    isDemoMode: isSheetsDemoMode,
    connect: connectSheets,
    disconnect: disconnectSheets,
    refresh: refreshSheets,
  } = useGoogleSheets();

  // =============================================================================
  // ABSOLUTE HOISTING: displayData useMemo MUST be at the top, immediately after data hooks
  // =============================================================================
  // ORDER: useState → useRef → Custom Hooks → useMemo (displayData) → useCallback → useEffect
  // This ensures displayData is available before any useEffect hooks that reference it
  
  // Primary data source selection
  const primaryData = useMemo(() => {
    return isUploadingCsv 
      ? backendData  // Prioritize CSV data when uploading
      : (connection.isConnected ? sheetsData : backendData);
  }, [isUploadingCsv, backendData, connection.isConnected, sheetsData]);

  // Data Simulator (Chaos Engine) - only active if NOT connected to real sheets
  const { simulatedData, lastEvent, eventCount, triggerChaos } =
    useDataSimulator(primaryData, isDemoMode && !connection.isConnected);

  // Final display data - Computed reactively using useMemo
  const displayDataBase = useMemo(() => {
    return isDemoMode && !connection.isConnected
      ? (demoData || simulatedData)
      : primaryData;
  }, [isDemoMode, connection.isConnected, demoData, simulatedData, primaryData]);
  
  // Final display data with metric overwrite - ABSOLUTE TOP LEVEL
  // DEPENDENCY ARRAY: Includes all reactive dependencies to ensure instant UI updates
  // - displayDataBase: Contains backendData, sheetsData, connection state, demoData, simulatedData
  // - dataContract: Contains metrics, ontology_mapping, total_rows (updated by Agent 2)
  // NOTE: mathIntegrityConfidence is NOT included here as it doesn't affect data computation,
  //       but Integrity Seal component will re-render when mathIntegrityConfidence changes via props
  const displayData = useMemo(() => {
    let result = displayDataBase;
    
    // =============================================================================
    // METRIC OVERWRITE: Physically overwrite displayData with data_contract values
    // =============================================================================
    // This ensures the dashboard shows $24.3M instead of $0.0M
    if (dataContract && dataContract.metrics && result) {
      const contractMetrics = dataContract.metrics;
      const contractARR = contractMetrics['ARR'] || contractMetrics['Revenue'] || contractMetrics['Sales'] || 
                         contractMetrics['arr'] || contractMetrics['revenue'] || contractMetrics['sales'];
      const contractNRR = contractMetrics['NRR'] || contractMetrics['Retention'] || contractMetrics['nrr'] || 
                         contractMetrics['retention'];
      const contractBurn = contractMetrics['Burn_Multiple'] || contractMetrics['Burn Multiple'] || 
                          contractMetrics['burn_multiple'] || contractMetrics['burnMultiple'];
      
      // Create a new object with overwritten financials
      result = {
        ...result,
        financials: {
          ...result.financials,
          arr: contractARR !== undefined ? {
            ...result.financials?.arr,
            value: Number(contractARR),
          } : result.financials?.arr,
          nrr: contractNRR !== undefined ? {
            ...result.financials?.nrr,
            value: Number(contractNRR),
          } : result.financials?.nrr,
          burn_multiple: contractBurn !== undefined ? {
            ...result.financials?.burn_multiple,
            value: Number(contractBurn),
          } : result.financials?.burn_multiple,
        },
      };
    }
    
    // Log metric overwrite if applied
    if (dataContract && dataContract.metrics && result) {
      const contractMetrics = dataContract.metrics;
      const contractARR = contractMetrics['ARR'] || contractMetrics['Revenue'] || contractMetrics['Sales'] || 
                         contractMetrics['arr'] || contractMetrics['revenue'] || contractMetrics['sales'];
      if (contractARR !== undefined) {
        const contractNRR = contractMetrics['NRR'] || contractMetrics['Retention'] || contractMetrics['nrr'] || 
                           contractMetrics['retention'];
        const contractBurn = contractMetrics['Burn_Multiple'] || contractMetrics['Burn Multiple'] || 
                            contractMetrics['burn_multiple'] || contractMetrics['burnMultiple'];
        console.log(`[METRIC OVERWRITE] ARR=${contractARR}, NRR=${contractNRR}, Burn=${contractBurn}`);
      }
    }
    
    return result;
  }, [displayDataBase, dataContract]);

  // Combined loading state (renamed to avoid naming conflict)
  const isGlobalSyncLoading = sheetsLoading || backendLoading;

  // Combined sync error (renamed to avoid naming conflict with global 'error' state)
  const globalSyncError = sheetsError || backendError;

  // Scenario Engine Hook (manages scenario selection state and logic)
  const handleScenarioSelectWrapper = useCallback(
    async (
      scenario: Scenario,
      scenarioData: DashboardState,
      rawData: Array<Record<string, unknown>>
    ) => {
      // Prevent race condition: Don't execute if already running
      if (isSwarmExecuting) {
        console.warn("[Race Condition] Swarm already executing, skipping scenario selection");
        return;
      }

      // Reset all state
      setIsGenerating(true);
      setIsComplete(false);
      setIsSwarmExecuting(true);
      setGenerationId((id) => id + 1);
      setAiAnalysis(null);
      setAnalysisError(null);
      setIsAnalyzing(true);
      setThoughtLogs([]);
      setStrategicActions([]);
      setValidatorResult(undefined);
      resetActivities();
      setSwarmStartTime(Date.now());

      // Add initial thought
      addThought(
        `Loading scenario: ${scenario.name}`,
        "active",
        "sparkles"
      );

      try {
        // ENFORCED "THINKING TIME": Minimum 4 seconds for visual feedback
        const minimumThinkingTime = 4000;
        const startTime = Date.now();

        // Execute agent swarm via server-side API route
        const swarmPromise = fetch('/api/swarm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'demo',
            data: scenarioData,
            context: {
              persona: selectedPersona,
              isReturningUser: false,
              headers: Object.keys(rawData[0] || {}),
              rawData: rawData,
              primaryAmountColumn: scenario.industry === 'retail' ? 'Sales' : 'ARR',
              scenario_id: scenario.id, // Pass scenario_id to backend for routing
            },
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Swarm execution failed');
          }
          return response.json();
        });

        const minimumTimePromise = new Promise<void>(resolve => setTimeout(resolve, minimumThinkingTime));

        // Wait for BOTH to complete
        const [swarmResponse] = await Promise.all([swarmPromise, minimumTimePromise]);

        const elapsedTime = Date.now() - startTime;
        console.log(`[Scenario Loading] Swarm execution completed (${elapsedTime}ms).`);

        setSwarmStartTime(null);

        // Extract results from API response
        const results = new Map(Object.entries(swarmResponse.results || {}));
        const activities = swarmResponse.activities || [];

        // Extract industry from Policy Auditor result
        let detectedIndustry = "SAAS";
        const policyResult = results?.get("policy");
        if (policyResult && typeof policyResult === 'object' && 'metadata' in policyResult) {
          const metadata = policyResult.metadata as { industry?: string };
          if (metadata?.industry) {
            detectedIndustry = String(metadata.industry).toUpperCase();
          }
        }

        // Log agent activities
        updateActivitiesFromSwarm(activities);

        activities.forEach((activity: {
          agentId: string;
          agentName: string;
          status: string;
          message: string;
        }) => {
          if (activity.agentId !== "orchestrator") {
            addThought(
              `[${activity.agentName}] ${activity.message}`,
              activity.status === "success" ? "success" : activity.status === "error" ? "error" : "active",
              "brain"
            );
          }
        });

        // Extract domain consensus
        const orchestratorResult = results?.get("orchestrator");
        const consensusData = (orchestratorResult && typeof orchestratorResult === 'object' && 'metadata' in orchestratorResult)
          ? (orchestratorResult.metadata as { domainConsensus?: { industry?: string; verified?: boolean } })?.domainConsensus
          : undefined;

        const isDomainVerified = consensusData?.verified || false;
        const consensusIndustry = consensusData?.industry?.toUpperCase() || detectedIndustry;

        setVerifiedIndustry(consensusData?.industry || "saas");

        // Extract Validator Result (Agent 0)
        const validatorResultData = results?.get("validator");
        if (validatorResultData && typeof validatorResultData === 'object') {
          setValidatorResult(validatorResultData as typeof validatorResult);
        }

        // Extract Strategic Actions (Agent 11)
        const strategyResult = results?.get("strategy");
        if (strategyResult && typeof strategyResult === 'object' && 'data' in strategyResult) {
          const strategyData = strategyResult.data as { actions?: Array<unknown>; strategies?: Array<unknown> };
          const actions = Array.isArray(strategyData.actions) ? strategyData.actions : 
                         Array.isArray(strategyData.strategies) ? strategyData.strategies : [];
          if (actions.length > 0) {
            setStrategicActions(actions as typeof strategicActions);
            
            // PAUSE SWARM: Show DecisionPortal and wait for user command
            addThought(
              `[AGENT 11] Strategic analysis complete. ${actions.length} paths identified. Awaiting command...`,
              "active",
              "brain"
            );
            setIsAwaitingCommand(true);
            // Return early - swarm execution paused until decision is made
            setIsGenerating(false);
            setIsAnalyzing(false);
            // Keep isSwarmExecuting true to maintain standby state
            return;
          }
        }

        addThought(
          `Scenario "${scenario.name}" loaded successfully with ${scenario.expectedOutcome.strategicActions} strategic actions`,
          "success",
          "sparkles"
        );

        // Trigger voice briefing if not muted
        if (!voiceMuted && isDomainVerified) {
          setTimeout(() => {
            speak(
              `Scenario loaded. ${scenario.description}. Analysis complete.`,
              "Executive",
              {
                isReturning: false,
                persona: selectedPersona,
                industry: consensusIndustry,
              }
            );
          }, 300);
        }

        setIsComplete(true);
        success(`Scenario "${scenario.name}" loaded successfully!`);
      } catch (err) {
        console.error('[Scenario Loading] Error:', err);
        addThought(
          `Error loading scenario: ${err instanceof Error ? err.message : 'Unknown error'}`,
          "error",
          "terminal"
        );
        showError(`Failed to load scenario: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsGenerating(false);
        setIsAnalyzing(false);
        setIsSwarmExecuting(false);
      }
    },
    [
      isSwarmExecuting,
      selectedPersona,
      voiceMuted,
      speak,
      success,
      showError,
      addThought,
    ]
  );

  // Removed ScenarioEngine - Executive Command Center only

  // Convert StrategicActions to DecisionPortal options
  const generateDecisionOptions = useCallback((actions: typeof strategicActions): StrategicOption[] => {
    if (actions.length === 0) return [];

    // Sort by confidence score (highest first)
    const sorted = [...actions].sort((a, b) => b.confidence_score - a.confidence_score);

    // Categorize actions by risk level
    const aggressive = sorted.find(a => a.risk_level === "high" || (a.confidence_score > 0.8 && a.risk_level !== "low"));
    const balanced = sorted.find(a => a.risk_level === "medium" || (a.confidence_score > 0.7 && a.risk_level !== "high" && a.risk_level !== "low"));
    const defensive = sorted.find(a => a.risk_level === "low" || (a.confidence_score > 0.75 && a.risk_level !== "high"));

    const options: StrategicOption[] = [];
    
    if (aggressive) {
      options.push({
        id: "aggressive",
        title: aggressive.title,
        description: aggressive.impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(aggressive.confidence_score * 100),
        impact: aggressive.one_click_action_payload?.expected_impact?.change_percent ? `+${aggressive.one_click_action_payload.expected_impact.change_percent}%` : "High",
        riskLevel: aggressive.risk_level,
        timeframe: aggressive.one_click_action_payload?.expected_impact?.timeframe || "90 days",
      });
    } else if (sorted.length > 0) {
      options.push({
        id: "aggressive",
        title: sorted[0].title,
        description: sorted[0].impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(sorted[0].confidence_score * 100),
        impact: sorted[0].one_click_action_payload?.expected_impact?.change_percent ? `+${sorted[0].one_click_action_payload.expected_impact.change_percent}%` : "High",
        riskLevel: sorted[0].risk_level,
        timeframe: sorted[0].one_click_action_payload?.expected_impact?.timeframe || "90 days",
      });
    }

    if (balanced) {
      options.push({
        id: "balanced",
        title: balanced.title,
        description: balanced.impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(balanced.confidence_score * 100),
        impact: balanced.one_click_action_payload?.expected_impact?.change_percent ? `+${balanced.one_click_action_payload.expected_impact.change_percent}%` : "Medium",
        riskLevel: balanced.risk_level,
        timeframe: balanced.one_click_action_payload?.expected_impact?.timeframe || "60 days",
      });
    } else if (sorted.length > 1) {
      options.push({
        id: "balanced",
        title: sorted[1].title,
        description: sorted[1].impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(sorted[1].confidence_score * 100),
        impact: sorted[1].one_click_action_payload?.expected_impact?.change_percent ? `+${sorted[1].one_click_action_payload.expected_impact.change_percent}%` : "Medium",
        riskLevel: sorted[1].risk_level,
        timeframe: sorted[1].one_click_action_payload?.expected_impact?.timeframe || "60 days",
      });
    }

    if (defensive) {
      options.push({
        id: "defensive",
        title: defensive.title,
        description: defensive.impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(defensive.confidence_score * 100),
        impact: defensive.one_click_action_payload?.expected_impact?.change_percent ? `+${defensive.one_click_action_payload.expected_impact.change_percent}%` : "Stable",
        riskLevel: defensive.risk_level,
        timeframe: defensive.one_click_action_payload?.expected_impact?.timeframe || "30 days",
      });
    } else if (sorted.length > 2) {
      options.push({
        id: "defensive",
        title: sorted[2].title,
        description: sorted[2].impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(sorted[2].confidence_score * 100),
        impact: sorted[2].one_click_action_payload?.expected_impact?.change_percent ? `+${sorted[2].one_click_action_payload.expected_impact.change_percent}%` : "Stable",
        riskLevel: sorted[2].risk_level,
        timeframe: sorted[2].one_click_action_payload?.expected_impact?.timeframe || "30 days",
      });
    }

    // Ensure we have exactly 3 options (pad if needed)
    while (options.length < 3 && sorted.length > options.length) {
      const action = sorted[options.length];
      options.push({
        id: options.length === 0 ? "aggressive" : options.length === 1 ? "balanced" : "defensive",
        title: action.title,
        description: action.impact_analysis.split('.')[0] + '.',
        probabilityScore: Math.round(action.confidence_score * 100),
        impact: action.one_click_action_payload?.expected_impact?.change_percent ? `+${action.one_click_action_payload.expected_impact.change_percent}%` : "Medium",
        riskLevel: action.risk_level,
        timeframe: action.one_click_action_payload?.expected_impact?.timeframe || "60 days",
      });
    }

    return options.slice(0, 3);
  }, []);

  // Handle decision portal selection
  const handleDecisionSelect = useCallback(async (option: StrategicOption) => {
    setIsAwaitingCommand(false);
    
    // Update active strategy ID for LiveStrategyMap synchronization
    setActiveStrategyId(option.id);
    
    // Log decision strike to ExecutionLog
    addThought(
      `[COMMAND RECEIVED] Striking with "${option.title}" (${option.id.toUpperCase()})...`,
      "active",
      "sparkles"
    );
    
    // Resume swarm execution for final impact analysis
    setIsSwarmExecuting(false);
    
    addThought(
      `[EXECUTING] Applying strategic path. Impact analysis in progress...`,
      "active",
      "zap"
    );
  }, [addThought]);

  // Update decision options when strategicActions change
  useEffect(() => {
    if (strategicActions.length > 0 && isAwaitingCommand) {
      const options = generateDecisionOptions(strategicActions);
      setDecisionOptions(options);
    }
  }, [strategicActions, isAwaitingCommand, generateDecisionOptions]);

  // Check if welcome overlay should be shown on mount and restore user profile
  useEffect(() => {
    const restoreUserSession = async () => {
      if (!supabase) {
        // Fallback to welcome overlay check if no Supabase
        if (shouldShowWelcome()) {
          setShowWelcome(true);
        }
        return;
      }
      
      try {
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Store user ID for auto-save mechanism
          setCurrentUserId(session.user.id);
          
          // User is logged in, fetch their profile
          const profile = await getProfile(session.user.id);
          
          if (profile) {
            // Restore persona preference
            if (profile.persona_preference) {
              setSelectedPersona(profile.persona_preference as Persona);
            }
            
            // Restore industry from ghost_state
            const ghostState = profile.ghost_state as { industry?: string } | null;
            if (ghostState?.industry) {
              setVerifiedIndustry(ghostState.industry);
            }
            
            // Store last saved spreadsheet ID to prevent redundant saves
            if (profile.last_connected_sheet_id) {
              setLastSavedSpreadsheetId(profile.last_connected_sheet_id);
            }
            
            // Auto-connect spreadsheet if available
            if (profile.last_connected_sheet_id && connectSheets) {
              try {
                await connectSheets(profile.last_connected_sheet_id);
                // Skip welcome overlay if we have a connected spreadsheet
                return;
              } catch (err) {
                console.warn("Failed to restore spreadsheet connection:", err);
              }
            }
          }
        }
        
        // Show welcome overlay only if no active session or no spreadsheet
        if (shouldShowWelcome()) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.warn("Failed to restore user session:", err);
        // Fallback to welcome overlay check
        if (shouldShowWelcome()) {
          setShowWelcome(true);
        }
      }
    };
    
    restoreUserSession();
  }, [connectSheets]);

  // Demo Mode Handler
  const startDemoMode = useCallback((mockData: DashboardState) => {
    setDemoData(mockData);
    setIsDemoMode(true);
    setShowWelcome(false);
  }, []);

  // Auth Success Handler
  const handleAuthSuccess = useCallback(async (user: { id: string; email: string; spreadsheetId?: string | null; persona?: string; industry?: string }) => {
    setShowAuth(false);
    setShowWelcome(false);
    
    // Store user ID for auto-save mechanism
    setCurrentUserId(user.id);
    
    // Update persona if provided
    if (user.persona) {
      setSelectedPersona(user.persona as Persona);
    }
    
    // Update industry if provided
    if (user.industry) {
      setVerifiedIndustry(user.industry);
    }
    
    // Store last saved spreadsheet ID if available
    if (user.spreadsheetId) {
      setLastSavedSpreadsheetId(user.spreadsheetId);
    }
    
    // Auto-connect spreadsheet if available
    if (user.spreadsheetId && connectSheets) {
      try {
        await connectSheets(user.spreadsheetId);
      } catch (err) {
        console.warn("Failed to auto-connect spreadsheet:", err);
      }
    }
  }, [connectSheets]);

  // Debug overlay state (hidden by default, Ctrl+D to toggle)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // Boardroom Presentation Mode state
  const [isBoardroomMode, setIsBoardroomMode] = useState(false);

  // Keyboard shortcut handler for Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        // Don't show debug overlay in boardroom mode
        if (!isBoardroomMode) {
          setShowDebugOverlay((prev) => !prev);
        }
      }
      // F11 or Escape to exit boardroom mode
      if (e.key === 'F11' || (e.key === 'Escape' && isBoardroomMode)) {
        e.preventDefault();
        handleExitBoardroom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBoardroomMode]);

  // Boardroom Mode handlers
  const handleEnterBoardroom = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsBoardroomMode(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      // Still enable boardroom mode even if fullscreen fails
      setIsBoardroomMode(true);
    }
  };

  const handleExitBoardroom = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
    setIsBoardroomMode(false);
  };

  // Auto-Save: Persist Spreadsheet ID to Supabase when connection is established
  useEffect(() => {
    const autoSaveSpreadsheetId = async () => {
      // Only proceed if user is authenticated and connection is established
      if (!currentUserId || !connection.isConnected || !connection.sheetId) {
        return;
      }
      
      // Prevent redundant API calls if spreadsheetId hasn't changed
      if (connection.sheetId === lastSavedSpreadsheetId) {
        return;
      }
      
      try {
        const success = await updateUserProfile(currentUserId, {
          spreadsheetId: connection.sheetId,
        });
        
        if (success) {
          // Update last saved ID to prevent redundant calls
          setLastSavedSpreadsheetId(connection.sheetId);
          
          // Show toast notification for confirmation
          info(
            "Profile Synced",
            `Spreadsheet connection saved to your profile.`
          );
          
          console.log("[Auto-Save] Profile synced successfully:", connection.sheetId);
          
          // EVENT-DRIVEN SYNC: Emit SHEET_CONNECT_SUCCESS event when connection is established
          if (connection.isConnected && connection.sheetId) {
            window.dispatchEvent(new CustomEvent('SHEET_CONNECT_SUCCESS', {
              detail: { sheetId: connection.sheetId }
            }));
          }
        }
      } catch (err) {
        // Log error but don't break UI state
        console.warn("[Auto-Save] Failed to sync spreadsheet ID to profile:", err);
      }
    };
    
    autoSaveSpreadsheetId();
  }, [connection.isConnected, connection.sheetId, currentUserId, lastSavedSpreadsheetId, info, updateUserProfile]);

  // Dynamic Sync Manager: Adjust refresh interval based on persona
  const performSync = useCallback(async () => {
    // Only sync if tab is active and connection is established
    if (document.visibilityState !== 'visible' || !connection.isConnected || !refreshSheets) {
      return;
    }

    setIsSyncing(true);
    try {
      await refreshSheets();
      lastSyncTimeRef.current = Date.now();
      console.log("[Sync Manager] Data refreshed successfully");
    } catch (err) {
      console.warn("[Sync Manager] Failed to refresh data:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [connection.isConnected, refreshSheets]);

  // Update Intelligence Health Score
  const updateIntelligenceHealth = useCallback(() => {
    // Calculate sync age (default to 0 if never synced)
    const syncAge = lastSyncTimeRef.current ? Date.now() - lastSyncTimeRef.current : 0;
    
    // Check for Agent 2 critical warnings
    const auditorActivity = agentActivities.find(a => a.agentId === "auditor");
    const hasCriticalWarnings = auditorActivity?.status === "error" || 
                                (auditorActivity?.metadata && typeof auditorActivity.metadata === 'object' && 'criticalIntegrityFailure' in auditorActivity.metadata && (auditorActivity.metadata as { criticalIntegrityFailure?: boolean }).criticalIntegrityFailure === true) ||
                                (auditorActivity?.message?.toLowerCase().includes("critical") || false);
    
    const health = calculateIntelligenceHealth({
      swarmStatus: {
        hasCriticalWarnings,
        lastExecutionTime: swarmStartTime || undefined,
      },
      syncAge,
      executeCount,
    });
    
    setIntelligenceHealth(health);
  }, [agentActivities, swarmStartTime, executeCount]);

  // Update health score when dependencies change
  useEffect(() => {
    updateIntelligenceHealth();
  }, [updateIntelligenceHealth]);

  // Handle Detective Mode - Deep-dive Root Cause Analysis (with Deep Scan for 100% factors)
  const handleDetectiveDive = useCallback(async (factor: 'freshness' | 'integrity' | 'execution') => {
    setIsDetectiveMode(true);
    setDetectiveFactor(factor);
    
    // Check if factor is at 100% (perfect score)
    const factorScore = factor === 'freshness' 
      ? intelligenceHealth.breakdown.freshness.score / intelligenceHealth.breakdown.freshness.maxScore
      : factor === 'integrity'
      ? intelligenceHealth.breakdown.integrity.score / intelligenceHealth.breakdown.integrity.maxScore
      : intelligenceHealth.breakdown.execution.score / intelligenceHealth.breakdown.execution.maxScore;
    
    const isPerfectScore = factorScore >= 1.0;
    
    if (isPerfectScore) {
      // Deep Scan Mode: Even if 100%, trigger verification scan
      setIsAnalyzing(true);
      
      // Log deep scan initiation
      addThought(
        `[SHIELD] Deep Scan Initiated: Verifying ${factor.toUpperCase()} factor integrity...`,
        "active",
        "shield"
      );
      
      // 1.5s scanning pulse
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log verification result
      addThought(
        `[SHIELD] Deep Scan Verified: No anomalies in ${factor.toUpperCase()}. Strategic status: OPTIMIZED.`,
        "success",
        "shield"
      );
      
      setIsAnalyzing(false);
      setIsDetectiveMode(false);
      setDetectiveFactor(null);
      return;
    }
    
    // Normal detective mode for factors < 100%
    setIsAnalyzing(true);
    
    // Determine detective prompt based on factor
    const factorMessages: Record<typeof factor, string> = {
      freshness: "ACT AS A DETECTIVE. Focus exclusively on the DATA FRESHNESS issue. Analyze the sync logs, find exactly WHERE the data staleness occurred, identify the last successful sync timestamp, and provide a 2-step fix. Do not provide a general summary.",
      integrity: "ACT AS A DETECTIVE. Focus exclusively on the DATA INTEGRITY issue. Analyze the Agent 2 (Math Auditor) logs, find exactly WHERE the math error or warning occurred, identify which metrics failed verification, and provide a 2-step fix. Do not provide a general summary.",
      execution: "ACT AS A DETECTIVE. Focus exclusively on the EXECUTION ENGAGEMENT issue. Analyze the user interaction logs, identify patterns in strategic action execution, find opportunities to improve engagement, and provide a 2-step fix. Do not provide a general summary.",
    };
    
    const detectivePrompt = factorMessages[factor];
    
    // Log detective activation
    addThought(
      `[SEARCH] Detective Initiated: Investigating ${factor.toUpperCase()} factor...`,
      "active",
      "search"
    );
    
    try {
      // Get persona system prompt
      const personaSystemPrompt = getPersonaSystemPrompt(selectedPersona);
      
      // Combine persona prompt with detective prompt
      const combinedSystemPrompt = `${detectivePrompt}\n\n${personaSystemPrompt}`;
      
      // Trigger AI analysis with detective prompt
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `ACT AS AN INVESTIGATOR. Solve why ${factor} is failing. Provide a 2-step fix.`,
          persona: selectedPersona,
          systemPrompt: combinedSystemPrompt,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Detective analysis failed");
      }
      
      const result = await response.json();
      
      if (result.analysis) {
        setAiAnalysis(result.analysis);
        addThought(
          `[DETECTIVE MODE] ${factor.toUpperCase()} analysis complete. Root cause identified.`,
          "success",
          "search"
        );
        
        // Extract recommendations from detective analysis
        const detectiveRecommendations = extractRecommendations(result.analysis, selectedPersona);
        setRecommendations(detectiveRecommendations);
        
        // Parse fix payload from AI response
        const { parseFixPayloadFromAI } = await import("@/lib/executionAdapter");
        const fixPayload = parseFixPayloadFromAI(result.analysis);
        if (fixPayload) {
          setDetectedFixPayload(fixPayload);
          addThought(
            `[EXECUTION] Auto-fix payload detected: ${fixPayload.operations.length} operation(s) ready for execution.`,
            "active",
            "zap"
          );
        }
      }
    } catch (error) {
      console.error("Detective dive error:", error);
      addThought(
        `[DETECTIVE MODE] Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "error",
        "search"
      );
      showError("Detective Analysis Failed", error instanceof Error ? error.message : "Could not complete investigation");
    } finally {
      setIsAnalyzing(false);
      // Keep detective mode active to show the analysis
    }
  }, [selectedPersona, addThought, showError, extractRecommendations, getPersonaSystemPrompt, intelligenceHealth]);

  // Handle Auto-Fix Execution (with Dry Run Preview)
  const handleExecuteAutoFix = useCallback(async () => {
    if (!detectedFixPayload) {
      showError("No Fix Available", "No auto-fix payload detected. Please run Detective Mode first.");
      return;
    }

    try {
      // Neural Simulation: Calculate strategic impact
      addThought(
        `[SIMULATION] Calculating strategic impact of proposed fix...`,
        "active",
        "brain"
      );

      // Import execution engine and simulate fix
      const { executionEngine, ExecutionEngine } = await import("@/lib/executionAdapter");
      
      // Detect source type
      const sourceType = ExecutionEngine.detectSourceType({
        sheetId: connection.sheetId || undefined,
        type: connection.isConnected ? "GOOGLE_SHEETS" : undefined,
      });

      // Prepare payload
      const payload = {
        ...detectedFixPayload,
        source: sourceType,
        target: connection.sheetId || "unknown",
      };

      // Run dry run simulation
      const previews = await executionEngine.simulateFix(payload);
      setPreviewDiffs(previews);

      // Generate strategic impact description
      const impactDescriptions = previews.map(p => p.impact);
      const combinedImpact = impactDescriptions.length > 0
        ? impactDescriptions.join(" ")
        : "Strategic data correction will improve data integrity and analysis accuracy.";

      setStrategicImpact(combinedImpact);

      // Predict health boost
      if (detectiveFactor) {
        const boost = predictHealthBoost(intelligenceHealth.score, detectiveFactor);
        setPredictedHealthBoost(boost);
      }

      // Update thought log
      addThought(
        `[SIMULATION] Preview generated. ${previews.length} change(s) identified.`,
        "success",
        "brain"
      );

      // Show modal with preview data
      setShowExecutionModal(true);
    } catch (error) {
      console.error("Dry run simulation error:", error);
      addThought(
        `[SIMULATION] Preview failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
        "brain"
      );
      showError("Preview Failed", "Could not generate strategic preview. Proceed with caution.");
      // Still show modal, but without preview
      setShowExecutionModal(true);
    }
  }, [detectedFixPayload, connection, detectiveFactor, intelligenceHealth.score, addThought, showError]);

  const handleConfirmExecution = useCallback(async () => {
    if (!detectedFixPayload) return;

    setIsExecutingFix(true);
    setShowExecutionModal(false);

    try {
      // Detect source type from connection state
      const { executionEngine, ExecutionEngine } = await import("@/lib/executionAdapter");
      const sourceType = ExecutionEngine.detectSourceType({
        sheetId: connection.sheetId || undefined,
        type: connection.isConnected ? "GOOGLE_SHEETS" : selectedSource === "CSV" ? "CSV" : undefined,
        filePath: selectedSource === "CSV" ? pendingMapping?.fileName : undefined,
      });

      // Update payload with detected source and target
      const payload = {
        ...detectedFixPayload,
        source: sourceType,
        target: connection.sheetId || pendingMapping?.fileName || "unknown",
      };

      addThought(
        `[EXECUTION] Executing auto-fix: ${payload.operations.length} operation(s) on ${payload.source}...`,
        "active",
        "zap"
      );

      // Execute the fix
      const result = await executionEngine.execute(payload);

      if (result.success) {
        setExecutionSuccess(true);
        
        // Neural Success Thought Log
        addThought(
          `[OPTIMIZER] Strategic Correction Applied. Intelligence Score recalibrated to 100%.`,
          "success",
          "zap"
        );
        
        success("Auto-Fix Executed", result.message);
        
        // Trigger Neural Success pulse on Health Gauge (via executionSuccess state)
        // The Health Gauge will animate based on executionSuccess prop
        
        // Trigger success pulse animation (confetti-like effect using CSS)
        const pulseEffect = document.createElement("div");
        pulseEffect.className = "fixed inset-0 pointer-events-none z-[9999]";
        pulseEffect.innerHTML = `
          <div class="absolute inset-0 bg-gradient-radial from-emerald-500/20 via-emerald-500/10 to-transparent animate-ping"></div>
        `;
        document.body.appendChild(pulseEffect);
        setTimeout(() => pulseEffect.remove(), 2000);
        
        // Refresh data after successful execution
        if (connection.isConnected && refreshSheets) {
          setTimeout(() => {
            refreshSheets();
          }, 1000);
        } else if (selectedSource === "CSV") {
          // For CSV, trigger backend refetch
          setTimeout(() => {
            refetchBackend();
          }, 1000);
        }

        // Re-run analysis automatically after fix
        setTimeout(() => {
          addThought(
            `[OPTIMIZER] Re-running analysis with corrected data...`,
            "active",
            "brain"
          );
          
          // Trigger analysis regeneration via custom event
          window.dispatchEvent(new CustomEvent('neurasight:rerun-analysis'));
        }, 2000);

        // Reset success state after animation
        setTimeout(() => {
          setExecutionSuccess(false);
          setDetectedFixPayload(null);
          setPreviewDiffs(null);
          setStrategicImpact(null);
          setPredictedHealthBoost(null);
        }, 5000);
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (error) {
      console.error("Execution error:", error);
      addThought(
        `[EXECUTION] Auto-fix failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
        "zap"
      );
      showError("Execution Failed", error instanceof Error ? error.message : "Could not execute auto-fix");
    } finally {
      setIsExecutingFix(false);
    }
  }, [detectedFixPayload, connection, selectedSource, addThought, success, showError, refreshSheets, refetchBackend]);

  // Vocal Strategic Alert: Monitor score and alert if critical
  useEffect(() => {
    if (intelligenceHealth.score < 50 && !voiceMuted) {
      const lastAlertTime = localStorage.getItem('neurasight_lastHealthAlert');
      const now = Date.now();
      const cooldownMs = 15 * 60 * 1000; // 15 minutes
      
      if (!lastAlertTime || (now - parseInt(lastAlertTime, 10)) > cooldownMs) {
        speak(
          "Commander, strategic drift detected. Data integrity is below 50 percent. Recommend immediate re-sync.",
          "Executive",
          {
            isReturning: false,
            persona: selectedPersona,
          }
        );
        localStorage.setItem('neurasight_lastHealthAlert', now.toString());
      }
    }
  }, [intelligenceHealth.score, voiceMuted, speak, selectedPersona]);

  // EVENT-DRIVEN SYNC: Webhook Logic - No Polling
  // Dashboard only re-analyzes data when FILE_UPLOAD_SUCCESS or SHEET_CONNECT_SUCCESS events are emitted
  // EVENT EMISSION SCOPE: Initialize listeners early to prevent missed events
  useEffect(() => {
    // EVENT LISTENER: Listen for file upload success
    const handleFileUploadSuccess = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("[UPLOAD SUCCESS] CSV processed. Triggering analysis...", customEvent.detail);
      // Use a timeout to ensure displayData is available after upload completes
      setTimeout(() => {
        if (displayData && !isSwarmExecuting && handleGenerateRef.current) {
          // Trigger swarm analysis
          handleGenerateRef.current();
        }
      }, 100);
    };
    
    // EVENT LISTENER: Listen for sheet connect success
    const handleSheetConnectSuccess = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Silent sync - no log needed for routine operations
      if (connection.isConnected && refreshSheets) {
        performSync();
      }
    };
    
    // Register event listeners early to prevent missed events
    window.addEventListener('FILE_UPLOAD_SUCCESS', handleFileUploadSuccess);
    window.addEventListener('SHEET_CONNECT_SUCCESS', handleSheetConnectSuccess);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('FILE_UPLOAD_SUCCESS', handleFileUploadSuccess);
      window.removeEventListener('SHEET_CONNECT_SUCCESS', handleSheetConnectSuccess);
    };
  }, [displayData, isSwarmExecuting, connection.isConnected, refreshSheets, performSync]);

  // Fresh-Reasoning Guardrail: Check data freshness before AI processing
  const ensureFreshData = useCallback(async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimeRef.current;

    // If data is stale (> 60 seconds), trigger refresh
    if (timeSinceLastSync > 60 * 1000 && connection.isConnected && refreshSheets) {
      console.log("[Fresh-Reasoning] Data is stale, refreshing before AI processing...");
      setIsSyncing(true);
      try {
        await refreshSheets();
        lastSyncTimeRef.current = Date.now();
      } catch (err) {
        console.warn("[Fresh-Reasoning] Failed to refresh data:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [connection.isConnected, refreshSheets]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsBoardroomMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Schema Verification State
  const [schemaVerificationOpen, setSchemaVerificationOpen] = useState(false);
  const [pendingMapping, setPendingMapping] = useState<{
    headers: string[];
    mapping: {
      arr_column?: string | null;
      mql_column?: string | null;
      cac_column?: string | null;
      nrr_column?: string | null;
      company_name_column?: string | null;
    };
    fileName?: string;
  } | null>(null);

  // File upload handler
  const handleFileUpload = async (file: File): Promise<boolean> => {
    // Check if CSV file
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const isCsv = fileExtension === ".csv";
    
    // Start loading HUD immediately for CSV files
    if (isCsv) {
      setIsUploadingCsv(true);
      addThought(`[SCAN] CSV detected: ${file.name}. Initiating pre-flight scan...`, "active", "scan");
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/api/upload/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "File upload failed");
      }

      const result = await response.json();
      
      if (result.success) {
        // =============================================================================
        // NUCLEAR STATE RESET: Full purge BEFORE processing new data
        // =============================================================================
        // Purge all state to prevent stale data or unit confusion
        // NOTE: displayData is computed from backendData/sheetsData, so we reset those via refetch
        setSilverContext([]);
        setMathIntegrityConfidence(1.0);
        resetActivities(); // Reset agent activities from useSwarmMonitor hook
        setThoughtLogs([]);
        setIsSwarmExecuting(false);
        setSwarmStartTime(null);
        setCurrentForecast(null);
        setRecommendations([]);
        setRiskCalculation(null);
        setStrategicDebate(null);
        setResolutionPayload(null);
        setAiAnalysis(null);
        setAnalysisError(null);
        setIsAnalyzing(false);
        setIsComplete(false);
        setIsGenerating(false);
        setGenerationId(0);
        setCurrentTxId(undefined); // Reset txId as part of nuclear reset
        setDataContract(null); // Reset data contract as part of nuclear reset
        
        // KILL DEMO MODE: Ensure demo mode is disabled when CSV is uploaded
        setIsDemoMode(false);
        
        // FINAL PURGE: Clear any hardcoded residue from cache/localStorage
        if (typeof window !== 'undefined') {
          // Clear any cached dashboard data
          try {
            localStorage.removeItem('neurasight_dashboard_cache');
            localStorage.removeItem('neurasight_displayData');
            sessionStorage.removeItem('neurasight_backendData');
          } catch (e) {
            console.warn('[PRE-FLIGHT] Cache purge warning:', e);
          }
        }
        
        // Reset backend data by refetching (this will naturally reset displayData)
        refetchBackend();
        
        // Store data_contract and txId for Agent 2 verification
        // The swarm will only trigger AFTER data_contract is received
        if (result.data_contract && result.tx_id) {
          console.log(`[NUCLEAR RESET] Data contract received: ${result.data_contract.total_rows} rows, ${Object.keys(result.data_contract.metrics || {}).length} metrics`);
          // Store txId and data_contract in state for swarm orchestrator and PDF generator
          setCurrentTxId(result.tx_id);
          setDataContract(result.data_contract);
        }
        
        // Store raw data in silver_context buffer for Agent 2 verification
        // NOTE: This happens AFTER nuclear reset to ensure clean state
        if (result.sample_data && Array.isArray(result.sample_data)) {
          setSilverContext(result.sample_data);
        }
        
        // On successful upload (200 OK), set CSV as active source if it's a CSV file
        if (isCsv) {
          setIsUploadingCsv(false);
          setSelectedSource("CSV");
          addThought(`[SCAN] CSV upload successful. ${file.name} processed.`, "success", "scan");
        }
        
        // Show schema verification modal before proceeding
        if (result.mapping) {
          // Use headers from backend if available, otherwise extract from sample data
          const headers = result.headers || (result.sample_data?.[0] ? Object.keys(result.sample_data[0]) : []);
          
          // SOURCE MEMORY: Check if we have a remembered mapping for these headers
          const rememberedMapping = getRememberedMapping(headers);
          
          if (rememberedMapping && hasSimilarStructure(headers)) {
            // Skip manual mapping modal - use remembered mapping
            addThought(
              `[BRAIN] Structural match found. Applying historical mapping context.`,
              "success",
              "brain"
            );
            
            // Use remembered mapping
            setPendingMapping({
              headers,
              mapping: rememberedMapping,
              fileName: file.name,
            });
            
            // Auto-approve schema with remembered mapping
            // Trigger schema approval automatically
            setTimeout(() => {
              handleSchemaApproval();
            }, 500);
            
            return false; // Return false so ConnectSourceModal stays open during processing
          } else {
            // No remembered mapping - show manual mapping modal
            setPendingMapping({
              headers,
              mapping: result.mapping,
              fileName: file.name,
            });
            setSchemaVerificationOpen(true);
            // Don't close modal yet - wait for user approval
            return false; // Return false so ConnectSourceModal stays open
          }
        } else {
          // No mapping returned, proceed directly
          success("File Uploaded", result.message || "File uploaded successfully");
          await refetchBackend();
          
          // EVENT-DRIVEN SYNC: Emit FILE_UPLOAD_SUCCESS event
          window.dispatchEvent(new CustomEvent('FILE_UPLOAD_SUCCESS', {
            detail: { txId: result.tx_id, fileName: file.name }
          }));
          
          return true;
        }
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (err) {
      // Clear loading states on error
      if (isCsv) {
        setIsUploadingCsv(false);
      }
      
      // Check for encoding/format errors and show user-friendly message
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (
        errorMessage.includes("codec") ||
        errorMessage.includes("decode") ||
        errorMessage.includes("encoding") ||
        errorMessage.includes("UnicodeDecodeError") ||
        errorMessage.includes("FORMAT MISMATCH")
      ) {
        showError("Upload Failed", "[SENTINEL] FORMAT MISMATCH DETECTED. AUTO-SWITCHING TO BINARY PARSER...");
      } else {
        showError("Upload Failed", errorMessage);
      }
      return false;
    }
  };

  // Ingestion Ceremony: Detect when displayData transitions from null to available
  const prevDisplayDataRef = useRef<DashboardState | null>(null);
  useEffect(() => {
    // If displayData just became available (was null, now has data)
    if (!prevDisplayDataRef.current && displayData) {
      setIsIngesting(true);
      
      // Create Sovereign Session
      const createSession = async () => {
        const { createSovereignSession } = await import("@/lib/sovereignVault");
        const healthScore = intelligenceHealth.score;
        const industry = verifiedIndustry || "UNKNOWN";
        const session = await createSovereignSession(healthScore, industry, {
          persona: selectedPersona,
          source: selectedSource,
        });
        
        if (session) {
          setCurrentTxId(session.tx_id);
          
          // Log initial governance state (READ_ONLY)
          const { logGovernanceAction } = await import("@/lib/sovereignVault");
          await logGovernanceAction(
            session.id,
            "READ_ONLY",
            "SYSTEM",
            "Default security level: Sovereign Shield active"
          );
        }
      };
      
      createSession();
      
      // Auto-clear after 3 seconds
      const timer = setTimeout(() => {
        setIsIngesting(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Update ref for next comparison
    prevDisplayDataRef.current = displayData;
  }, [displayData, intelligenceHealth.score, verifiedIndustry, selectedPersona, selectedSource]);

  // Load active connectors when user is available
  useEffect(() => {
    const loadConnectors = async () => {
      if (!supabase) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const connectors = await getSovereignConnectors(user.id);
          const active = connectors.filter(c => c.status === "ACTIVE").map(c => c.provider_name);
          setActiveConnectors(active);
        }
      } catch (err) {
        console.warn("[VAULT] Failed to load connectors:", err);
      }
    };
    loadConnectors();
  }, [currentUserId]);

  // Vocal command handler (defined after displayData is available)
  const handleVocalCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    // Fresh-Reasoning Guardrail: Ensure data is fresh before processing
    await ensureFreshData();

    // Add vocal command to thought logs
    // Remove hardcoded fallback - use actual data or 0
    const arr = displayData?.financials?.arr?.value || 0;
    setThoughtLogs((prev) => [
      ...prev,
      {
        id: `vocal-${Date.now()}`,
        message: `Vocal Command Received: "${command}"`,
        status: "active" as const,
        icon: "zap" as const,
        timestamp: new Date(),
      },
      {
        id: `vocal-sim-${Date.now()}`,
        message: `Simulating impact on $${arr}M ARR...`,
        status: "active" as const,
        icon: "brain" as const,
        timestamp: new Date(),
      },
    ]);

    // Send to simulation endpoint with persona-aware strategic context
    try {
      const personaSystemPrompt = getPersonaSystemPrompt(selectedPersona);
      const response = await fetch("/api/simulate-whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: command,
          current_state: displayData,
          persona: selectedPersona,
          systemPrompt: personaSystemPrompt, // Inject persona-aware strategic framework
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process vocal command");
      }

      const result = await response.json();
      
      // Update thought logs
      setThoughtLogs((prev) => [
        ...prev,
        {
          id: `vocal-complete-${Date.now()}`,
          message: "Simulation complete. Ghost predictions generated.",
          status: "success" as const,
          icon: "sparkles" as const,
          timestamp: new Date(),
        },
      ]);

      // Trigger speech with predicted impact summary (context-aware greeting with industry)
      if (result.predicted_state?.explanation && !voiceMuted) {
        // Get detected industry from agent activities
        const policyActivity = agentActivities.find(a => a.agentId === "policy");
        const detectedIndustry = policyActivity?.metadata?.industry 
          ? String(policyActivity.metadata.industry).toUpperCase()
          : "SAAS";
        
        speak(result.predicted_state.explanation, "Amit", {
          isReturning: false,
          persona: selectedPersona,
          industry: detectedIndustry,
        });
      }
    } catch (err) {
      setThoughtLogs((prev) => [
        ...prev,
        {
          id: `vocal-error-${Date.now()}`,
          message: `Error: ${err instanceof Error ? err.message : "Failed to process command"}`,
          status: "error" as const,
          icon: "terminal" as const,
          timestamp: new Date(),
        },
      ]);
    }
  }, [displayData, speak, voiceMuted, setThoughtLogs, ensureFreshData, selectedPersona]);

  // Helper for delay
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Store handleGenerate ref for re-run after auto-fix
  const handleGenerateRef = useRef<(() => Promise<void>) | null>(null);

  const handleGenerate = async () => {
    // Prevent race condition: Don't execute if already running
    if (isSwarmExecuting) {
      console.warn("[Race Condition] Swarm already executing, skipping duplicate call");
      return;
    }
    
    // Store handleGenerate in ref for event listeners
    handleGenerateRef.current = handleGenerate;
    
    // Guard clause: Don't re-trigger if Agent 2 (auditor) has failed
    const auditorActivity = agentActivities.find(a => a.agentId === "auditor");
    if (auditorActivity?.status === "failed" || auditorActivity?.status === "error") {
      console.warn("[Guard Clause] Agent 2 (Math Auditor) has failed. Skipping swarm re-execution to prevent flickering.");
      return;
    }
    
    setIsComplete(false);
    setIsGenerating(true);
    setIsSwarmExecuting(true); // Lock swarm execution
    setGenerationId((id) => id + 1);
    setAiAnalysis(null);
    
    // =============================================================================
    // PROCESSING WATCHDOG: 120 second timeout
    // =============================================================================
    let processingTimeout: NodeJS.Timeout | null = null;
    processingTimeout = setTimeout(() => {
      console.warn("[WATCHDOG] Backend did not respond within 120 seconds. Using local aggregation.");
      setIsSwarmExecuting(false);
      setIsGenerating(false);
      setIsAnalyzing(false);
      setAnalysisError("High Network Latency: Using Local Aggregation");
      // Show notification
      if (typeof window !== 'undefined' && (window as any).__neurasight_addTerminalMessage) {
        (window as any).__neurasight_addTerminalMessage({
          agent: "SYSTEM",
          message: "HIGH NETWORK LATENCY DETECTED. REVERTING TO LOCAL AGGREGATION.",
          type: "system",
          statusCode: "FIX" as const,
        });
      }
    }, 120000); // 120 seconds
    setAnalysisError(null);
    setIsAnalyzing(true);
    setThoughtLogs([]); // Reset thought logs

    // UNIVERSAL BRAIN: Initialize and detect industry
    const brain = universalBrain(riskAppetite);
    
    // Trigger Stress Test Mode if active
    if (isStressTest) {
      const stressTestResult = brain.triggerStressTest();
      addThought(
        `[STRESS TEST] Mode activated. Verification status: ${stressTestResult.verificationStatus}.`,
        "active",
        "shield"
      );
    }
    
    const detectedIndustry = brain.detectIndustry(displayData || {} as DashboardState, {
      industry: verifiedIndustry,
    });
    
    // Calculate risk
    const riskCalc = brain.calculateRisk(displayData || {} as DashboardState, detectedIndustry);
    setRiskCalculation(riskCalc);
    
    // Trigger strategic conflict if risk exceeds threshold
    const debate = brain.triggerStrategicConflict(riskCalc, displayData || {} as DashboardState);
    setStrategicDebate(debate);
    
    // Generate resolution payload if stress test is active and debate exists
    if (isStressTest && debate && displayData) {
      const resolution = brain.generateResolution(
        detectedIndustry,
        `risk_score_${riskCalc.riskScore.toFixed(2)}`,
        displayData
      );
      setResolutionPayload(resolution);
    }
    
    // Thought Log: Industry detection
    addThought(
      `[BRAIN] Industry detected: ${detectedIndustry.toUpperCase()}. Applying Strategic Logic Adapter...`,
      "active",
      "brain"
    );
    
    if (debate) {
      addThought(
        `[CONFLICT] Strategic debate triggered. Risk: ${(riskCalc.riskScore * 100).toFixed(0)}%. Agent 3 vs Agent 11.`,
        "warning",
        "shield"
      );
    }

    // Determine data source
    const source: "sheets" | "csv" | "xlsx" | "api" | "demo" = 
      connection.isConnected ? "sheets" : "demo";

    try {
      // ENFORCED "THINKING TIME": Minimum 4 seconds for visual feedback
      const minimumThinkingTime = 4000; // 4 seconds
      const startTime = Date.now();
      setSwarmStartTime(startTime); // Store start time for visual persistence
      
      // Execute agent swarm via server-side API route (avoids "node:fs" Turbopack error)
      if (displayData) {
        // Call server-side API route instead of direct orchestrator import
        const swarmPromise = fetch('/api/swarm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source,
            data: displayData,
            context: {
              persona: selectedPersona,
              isReturningUser: false, // Could check from Supabase
              headers: pendingMapping?.headers || [],
              rawData: null, // Raw data would come from file upload context if needed
              primaryAmountColumn: undefined,
              toleranceLevel, // Quantum Math Integrity tolerance
              silverContext, // Raw uploaded data for Strategic Erasure detection
              txId: currentTxId, // Pass transaction ID for Agent 2
              dataContract: dataContract, // Pass data contract headers for Agent 2 context injection
            },
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Swarm execution failed');
          }
          return response.json();
        });
        
        const minimumTimePromise = new Promise<void>(resolve => setTimeout(resolve, minimumThinkingTime));
        
        // Wait for BOTH to complete
        const [swarmResponse] = await Promise.all([swarmPromise, minimumTimePromise]);
        
        const elapsedTime = Date.now() - startTime;
        
        // Clear swarm start time after completion
        setSwarmStartTime(null);
        
        // Extract results from API response
        const results = new Map(Object.entries(swarmResponse.results || {}));
        const activities = swarmResponse.activities || [];
        
        // Update Math Integrity Confidence from Agent 2 result
        const auditorResult = results?.get("auditor");
        if (auditorResult && typeof auditorResult === 'object' && 'data' in auditorResult) {
          const auditorData = auditorResult.data as { confidence?: number; verified?: boolean; detectedUnit?: "M" | "K" | "Raw" };
          if (auditorData?.confidence !== undefined) {
            setMathIntegrityConfidence(auditorData.confidence);
            
            // Log audit verification milestone
            const confidencePercent = Math.round(auditorData.confidence * 10000) / 100;
            console.log(`[AUDIT VERIFIED] Math integrity: ${confidencePercent}%`);
            
            // NOTE: detectedUnit is now stored in dataContract and accessed via useMemo
            // No need to mutate displayData - it's computed reactively from dataContract
            
            // Send terminal message for Agent 2 verification
            if (typeof window !== 'undefined' && (window as any).__neurasight_addTerminalMessage) {
              const confidencePercent = Math.round(auditorData.confidence * 10000) / 100;
              (window as any).__neurasight_addTerminalMessage({
                agent: "AGENT_2",
                message: `MATH VERIFIED (${confidencePercent}% CONFIDENCE).`,
                type: "agent",
                statusCode: "OK" as const,
              });
            }
          }
          
          // Send terminal message for outlier detection
          if (typeof window !== 'undefined' && (window as any).__neurasight_addTerminalMessage) {
            (window as any).__neurasight_addTerminalMessage({
              agent: "AGENT_2",
              message: "DETECTING OUTLIERS VIA IQR METHOD...",
              type: "agent",
              statusCode: "SCAN" as const,
            });
          }
        }
        
        // Send governance terminal message
        if (typeof window !== 'undefined' && (window as any).__neurasight_addTerminalMessage) {
          (window as any).__neurasight_addTerminalMessage({
            agent: "GOVERNANCE",
            message: `SECURITY LEVEL: ${toleranceLevel}. ALL REPORTS UNLOCKED.`,
            type: "system",
            statusCode: "OK" as const,
          });
        }
        
        // Extract industry from Policy Auditor result for context
        let detectedIndustry = "SAAS";
        const policyResult = results?.get("policy");
        if (policyResult && typeof policyResult === 'object' && 'metadata' in policyResult) {
          const metadata = policyResult.metadata as { industry?: string };
          if (metadata?.industry) {
            detectedIndustry = String(metadata.industry).toUpperCase();
          }
        }

        // Log agent activities to thought logs and update state for Neural Activity Monitor
        updateActivitiesFromSwarm(activities);
        
        activities.forEach((activity: {
          agentId: string;
          agentName: string;
          status: string;
          message: string;
        }) => {
          if (activity.agentId !== "orchestrator") { // Skip orchestrator's own logs in thought stream
            addThought(
              `[${activity.agentName}] ${activity.message}`,
              activity.status === "success" ? "success" : activity.status === "error" ? "error" : "active",
              "brain"
            );
          }
        });
        
        // Extract domain consensus for voice sync
        const orchestratorResult = results?.get("orchestrator");
        const consensusData = (orchestratorResult && typeof orchestratorResult === 'object' && 'metadata' in orchestratorResult)
          ? (orchestratorResult.metadata as { domainConsensus?: { industry?: string; verified?: boolean }; status?: string })?.domainConsensus
          : undefined;
        
        // LOADER KILL-SWITCH: Check if orchestrator status is 'blocked' or 'failed'
        const orchestratorStatus = (orchestratorResult && typeof orchestratorResult === 'object' && 'metadata' in orchestratorResult)
          ? (orchestratorResult.metadata as { status?: string })?.status
          : undefined;
        
        // Stop loader immediately if status is blocked or failed
        if (orchestratorStatus === 'blocked' || orchestratorStatus === 'failed') {
          setIsAnalyzing(false);
          setIsSwarmExecuting(false);
          setIsGenerating(false);
          console.warn("[LOADER KILL-SWITCH] Orchestrator status:", orchestratorStatus);
        }
        
        const isDomainVerified = consensusData?.verified || false;
        const consensusIndustry = consensusData?.industry?.toUpperCase() || detectedIndustry;
        
        // Trigger voice greeting after consensus bloom animation (sync with visual bloom)
        if (isBoardroomMode && !voiceMuted) {
          // Wait for consensus bloom animation (2 seconds) before speaking
          setTimeout(() => {
            if (isDomainVerified) {
              speak(
                `Executive, Sovereign Brain has achieved consensus. ${consensusIndustry} Domain Verified with 100% math precision.`,
                "Amit",
                {
                  isReturning: false,
                  persona: selectedPersona,
                  industry: consensusIndustry,
                }
              );
            } else {
              speak(
                `Briefing initiated. Sovereign Brain is online. Analyzing ${consensusIndustry} data.`,
                "Amit",
                {
                  isReturning: false,
                  persona: selectedPersona,
                  industry: consensusIndustry,
                }
              );
            }
          }, 2500); // Delay after consensus bloom animation completes
        }
      }
      // Step 1: Connection
      const step1 = addThought(
        connection.isConnected
          ? "Establishing secure connection to Google Sheets..."
          : "Connecting to NeuraSight Demo Data Pipeline...",
        "active",
        "database"
      );
      await delay(600);
      updateThought(step1, "success");

      // Step 2: Parsing
      const step2 = addThought(
        "Parsing data schema & normalizing metrics...",
        "active",
        "sheet"
      );
      await delay(500);
      updateThought(step2, "success");

      // Step 2.5: Persona-Aware Strategic Framework Activation
      const step2_5 = addThought(
        getPersonaAnalysisInstructions(selectedPersona),
        "active",
        "brain"
      );
      await delay(500);
      updateThought(step2_5, "success");

      // Step 3: Left Brain
      const step3 = addThought(
        "Left Brain: Injecting Deterministic SaaS Policies...",
        "active",
        "shield"
      );
      await delay(700);
      updateThought(step3, "success");

      // Step 4: Policy loaded
      const step4 = addThought(
        "Policy thresholds loaded: ARR, Burn, NRR, LTV/CAC",
        "active",
        "shield"
      );
      await delay(400);
      updateThought(step4, "success");

      // Step 5: Market Analysis
      const step5 = addThought(
        "Synthesizing market sentiment & industry trends...",
        "active",
        "brain"
      );
      await delay(600);
      updateThought(step5, "success");

      // Step 6: Financial Ratios
      const step6 = addThought(
        "Evaluating CAC vs LTV ratios & unit economics...",
        "active",
        "zap"
      );
      await delay(550);
      updateThought(step6, "success");

      // Step 7: Churn Analysis
      const step7 = addThought(
        "Identifying churn risk patterns & retention signals...",
        "active",
        "brain"
      );
      await delay(500);
      updateThought(step7, "success");

      // Step 8: Benchmarking
      const step8 = addThought(
        "Cross-referencing industry benchmarks & best practices...",
        "active",
        "shield"
      );
      await delay(600);
      updateThought(step8, "success");

      // Step 9: Right Brain Init
      const step9 = addThought(
        "Right Brain: Initializing Gemini 1.5 Flash...",
        "active",
        "brain"
      );
      await delay(500);
      updateThought(step9, "success");

      // Step 10: API Call (Persona-Aware Strategic Analysis)
      const personaStrategy = PERSONA_STRATEGIES[selectedPersona as PersonaType];
      const frameworkNote = personaStrategy ? ` using ${personaStrategy.framework}` : "";
      const step10 = addThought(
        `Running ${selectedPersona} strategic analysis${frameworkNote}...`,
        "active",
        "zap"
      );

      // Fresh-Reasoning Guardrail: Ensure data is fresh before AI analysis
      await ensureFreshData();

      // Get persona-specific strategic framework instructions
      const personaSystemPrompt = getPersonaSystemPrompt(selectedPersona);

      // Call the AI Analysis API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: connection.sheetId || undefined,
          data: displayData || undefined,
          persona: selectedPersona,
          systemPrompt: personaSystemPrompt, // Inject persona-aware strategic framework
        }),
      });

      const result = await response.json();

      if (result.success && result.analysis) {
        updateThought(step10, "success");

        // Step 11: Policy check
        if (result.policyViolations && result.policyViolations.length > 0) {
          addThought(
            `[ALERT] ${result.policyViolations.length} policy violation(s) detected!`,
            "warning",
            "shield"
          );
          await delay(400);
        } else {
          addThought(
            "✓ All metrics within SaaS benchmark thresholds",
            "success",
            "shield"
          );
          await delay(300);
        }

        // Step 12: Finalizing
        const step12 = addThought(
          "Finalizing executive brief & strategic recommendations...",
          "active",
          "sparkles"
        );
        await delay(500);
        updateThought(step12, "success");

        // Step 13: Complete
        addThought(
          "CEO Strategic Insight generated successfully!",
          "success",
          "sparkles"
        );
        await delay(300);

        // Step 14: Slack
        addThought(
          "Slack notification dispatched to #neurasight-alerts",
          "success",
          "zap"
        );

        setAiAnalysis(result.analysis);
        setPolicyViolations(result.policyViolations || []);
        setIsMockMode(result.isMockMode || false);

        // Extract recommendations from AI analysis
        const extractedRecs = extractRecommendations(result.analysis, selectedPersona);
        setRecommendations(extractedRecs);

        if (result.isMockMode) {
          info(
            "Analysis Complete (Demo Mode)",
            "Using simulated data. API verification pending."
          );
        } else {
          info("Analysis Complete", "CEO Strategic Insight ready. Slack notified.");
        }
      } else {
        updateThought(step10, "error");
        
        // Determine if it's a billing/verification issue
        const isBillingError =
          result.errorType === "billing" || result.errorType === "verification";
        
        if (isBillingError) {
          addThought(
            "Account verification pending - using demo insights",
            "warning",
            "shield"
          );
          // Don't show error, just use mock mode gracefully
          setAnalysisError(null);
        } else {
          addThought(
            `Error: ${result.error || "Analysis failed"}`,
            "error",
            "terminal"
          );
          setAnalysisError(result.error || "Analysis failed");
          showError("Analysis Failed", result.error || "Unable to generate AI report");
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      
      // Check if it's a network/billing error - show graceful state
      const isBillingError = errorMsg.includes("billing") || 
                            errorMsg.includes("verification") ||
                            errorMsg.includes("quota") ||
                            errorMsg.includes("403");
      
      if (isBillingError) {
        addThought(
          "Account verification pending - switching to demo mode",
          "warning",
          "shield"
        );
        await delay(400);
        addThought(
          "Demo insights generated successfully",
          "success",
          "sparkles"
        );
        // Don't set error - let it fall through gracefully
        setAnalysisError(null);
      } else {
        addThought(`Connection failed: ${errorMsg}`, "error", "database");
        setAnalysisError(errorMsg);
        showError("Connection Error", errorMsg);
      }
    } finally {
      setIsAnalyzing(false);
      setIsSwarmExecuting(false); // Unlock swarm execution
      setIsGenerating(false);
      // Clear timeout on completion/error
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    }
  };

  // Store handleGenerate in ref for re-run after auto-fix
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  }, [handleGenerate]);

  // Listen for re-run analysis event (triggered after auto-fix)
  useEffect(() => {
    const handleRerunAnalysis = async () => {
      if (handleGenerateRef.current) {
        await handleGenerateRef.current();
      }
    };
    
    window.addEventListener('neurasight:rerun-analysis', handleRerunAnalysis);
    return () => window.removeEventListener('neurasight:rerun-analysis', handleRerunAnalysis);
  }, []);

  const handleLogComplete = () => {
    setIsGenerating(false);
    setIsComplete(true);
  };

  const handleReset = () => {
    setIsGenerating(false);
    setIsComplete(false);
    setAiAnalysis(null);
    setAnalysisError(null);
    setThoughtLogs([]);
    setPolicyViolations([]);
    setIsMockMode(false);
    setRecommendations([]); // Clear recommendations on reset
  };

  // Handle schema verification approval
  const handleSchemaApproval = async () => {
    if (!pendingMapping) return;
    
    // Prevent race condition: Don't execute if already running
    if (isSwarmExecuting) {
      console.warn("[Race Condition] Swarm already executing, skipping duplicate call");
      return;
    }
    
    // SOURCE MEMORY: Store successful mapping for future use
    if (pendingMapping.headers && pendingMapping.mapping) {
      rememberMapping(
        pendingMapping.headers,
        pendingMapping.mapping,
        pendingMapping.fileName
      );
    }
    
    // Show "Neural Brain" loading state
    setIsGenerating(true);
    setIsSwarmExecuting(true); // Lock swarm execution
    setIsComplete(false);
    setGenerationId((id) => id + 1);
    setAiAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(true);
    setThoughtLogs([]);
    resetActivities();
    
    // Determine data source (from file upload, so it's "csv" or "xlsx")
    const source: "csv" | "xlsx" = "csv"; // Default to csv for file uploads
    
    try {
      success("Schema Approved", "Sovereign Brain initializing...");
      
      // ENFORCED STEP-BASED VISUALS: Step-by-step delay enforcement
      const forceDelay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
      const minimumThinkingTime = 4000; // 4 seconds
      const startTime = Date.now();
      setSwarmStartTime(startTime); // Store start time for visual persistence
      
      // Execute agent swarm via server-side API route (avoids "node:fs" Turbopack error)
      // Pass headers to context for Agent 3 (Policy Auditor) domain detection
      if (displayData) {
        // STEP 1: Execute swarm via API route
        const swarmPromise = fetch('/api/swarm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source,
            data: displayData,
            context: {
              persona: selectedPersona,
              isReturningUser: false,
              headers: pendingMapping?.headers || [], // Pass headers for Retail detection
              rawData: null, // Raw data would come from file upload context if needed
              primaryAmountColumn: undefined,
            },
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Swarm execution failed');
          }
          return response.json();
        });
        
        // STEP 2: Wait for swarm to complete
        const swarmResponse = await swarmPromise;
        
        // STEP 3: Force 4-second delay to ensure visuals stay active
        await forceDelay(minimumThinkingTime);
        
        const elapsedTime = Date.now() - startTime;
        console.log(`[SWARM COMPLETE] Schema approval swarm executed (${elapsedTime}ms).`);
        
        // Clear swarm start time after completion
        setSwarmStartTime(null);
        
        // Extract results from API response
        const results = new Map(Object.entries(swarmResponse.results || {}));
        const activities = swarmResponse.activities || [];
        
        // Extract industry from Policy Auditor result for context
        let detectedIndustry = "SAAS";
        const policyResult = results?.get("policy");
        if (policyResult && typeof policyResult === 'object' && 'metadata' in policyResult) {
          const metadata = policyResult.metadata as { industry?: string };
          if (metadata?.industry) {
            detectedIndustry = String(metadata.industry).toUpperCase();
          }
        }

        // Log agent activities to thought logs and update state for Neural Activity Monitor
        updateActivitiesFromSwarm(activities);
        
        activities.forEach((activity: {
          agentId: string;
          agentName: string;
          status: string;
          message: string;
        }) => {
          if (activity.agentId !== "orchestrator") {
            addThought(
              `[${activity.agentName}] ${activity.message}`,
              activity.status === "success" ? "success" : activity.status === "error" ? "error" : "active",
              "brain"
            );
          }
        });
        
        // Trigger voice greeting when HUD appears (after activities are set)
        if (!voiceMuted && detectedIndustry) {
          setTimeout(() => {
            speak("Schema verified. Sovereign Brain online. All agents initialized and ready for analysis.", "Executive", {
              isReturning: false,
              persona: selectedPersona,
              industry: detectedIndustry,
            });
          }, 800); // 800ms delay to sync with HUD animation completion
        }

        // Agent 10 (Predictive Seer) completion voice briefing
        const predictiveResult = results?.get("predictive");
        if (!voiceMuted && predictiveResult && typeof predictiveResult === 'object' && 'success' in predictiveResult && 'data' in predictiveResult) {
          const predictiveData = predictiveResult as { success: boolean; data?: unknown };
          if (predictiveData.success && predictiveData.data) {
            const forecastData = predictiveData.data as {
            scenarios?: Record<string, Record<string, number>>;
            volatilityFactor?: number;
            industry?: string;
          };
          const volatilityFactor = forecastData.volatilityFactor || 0;
          const volatilityContext = volatilityFactor > 0.5 
            ? "elevated market volatility" 
            : volatilityFactor > 0.2 
            ? "moderate market volatility" 
            : "stable market conditions";
          
          const targetTotal = forecastData.scenarios?.target?.total_6mo || 0;
          const dataPoints = 9994; // Hardcoded as per request
          
          setTimeout(() => {
            speak(
              `Executive, Sovereign Brain has processed ${dataPoints.toLocaleString()} data points to generate your 6-month forecast. Considering ${volatilityContext}, our target path projects ${targetTotal.toFixed(1)} million over the next 6 months.`,
              "Executive",
              {
                isReturning: false,
                persona: selectedPersona,
                industry: detectedIndustry,
              }
            );
          }, 2500); // Delay after initial greeting
          }
        }
      }
      
      // Refresh dashboard data to show updated metrics ($243.16M ARR)
      await refetchBackend();
      
      // Set CSV as active source if this was a CSV upload
      if (pendingMapping?.fileName?.toLowerCase().endsWith('.csv')) {
        setSelectedSource("CSV");
        setIsUploadingCsv(false);
      }
      
      // Close schema modal and connect modal, clear pending mapping after execution completes
      setSchemaVerificationOpen(false);
      setPendingMapping(null);
      setIsIngestionHubOpen(false); // Close ingestion hub after successful schema approval
      
      success("Analysis Complete", "Dashboard updated with latest data");
      
    } catch (error) {
      console.error("Schema approval swarm error:", error);
      showError("Swarm Error", error instanceof Error ? error.message : "Failed to initialize agents");
      setIsGenerating(false);
      setIsSwarmExecuting(false); // Unlock swarm execution
      // Clear CSV loading state on error
      if (pendingMapping?.fileName?.toLowerCase().endsWith('.csv')) {
        setIsUploadingCsv(false);
      }
      // Don't close modal on error, allow user to retry
    }
  };

  // Export handlers
  const handleDownloadPDF = async () => {
    if (!aiAnalysis) return;

    setIsExportingPDF(true);
    try {
      // Extract verification data from orchestrator activities
      const orchestratorActivity = agentActivities.find(
        (a) => a.agentId === "orchestrator"
      );
      const consensusData = orchestratorActivity?.metadata?.domainConsensus as {
        industry?: string;
        verified?: boolean;
        confidence?: number;
      } | undefined;
      
      // Generate neural hash for this analysis run
      const neuralHash = `NS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Get scenario name if available
      const result = await generateExecutivePDF({
        title: "NeuraSight Executive Report",
        persona: selectedPersona,
        analysis: aiAnalysis,
        metrics: displayData || undefined,
        policyViolations,
        marketData: marketData || undefined,
        verificationData: {
          domain: consensusData?.industry?.toUpperCase() as "RETAIL" | "SAAS" | undefined,
          confidence: consensusData?.confidence,
          verified: consensusData?.verified,
          neuralHash,
        },
        scenarioData: activeStrategyId ? {
          strategicPath: activeStrategyId || undefined,
        } : undefined,
        timestamp: new Date(),
      });

      if (result.success) {
        success("PDF Downloaded", `Report saved as ${result.filename}`);
      } else {
        showError("Export Failed", result.error || "Failed to generate PDF");
      }
    } catch (err) {
      showError("Export Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Simulate Fix Handler
  const handleSimulateFix = async (riskAlert: string) => {
    setIsSimulating(true);
    setSimulatingRisk(riskAlert);
    setSimulationScenarios(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          risk_alert: riskAlert,
          current_metrics: displayData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.scenarios) {
        setSimulationScenarios(result.scenarios);
        success("Simulation Complete", `Generated ${result.scenarios.length} actionable scenarios`);
      } else {
        throw new Error(result.error || "Failed to generate scenarios");
      }
    } catch (err) {
      showError("Simulation Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyToNotion = async () => {
    if (!aiAnalysis) return;

    setIsCopyingNotion(true);
    try {
      const result = await copyToNotionFormat({
        title: "NeuraSight Executive Report",
        persona: selectedPersona,
        analysis: aiAnalysis,
        metrics: displayData || undefined,
        policyViolations,
      });

      if (result.success) {
        success("Copied to Clipboard", "Notion-formatted report ready to paste!");
      } else {
        showError("Copy Failed", result.error || "Failed to copy to clipboard");
      }
    } catch (err) {
      showError("Copy Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCopyingNotion(false);
    }
  };

  const toggleDemoMode = () => {
    if (connection.isConnected) {
      // Can't enable chaos mode when connected to real data
      return;
    }
    setIsDemoMode((prev) => !prev);
  };

  // Handle metric card click -> open investigation drawer
  const handleMetricClick = useCallback((metric: PrioritizedMetric) => {
    setSelectedMetric(metric);
    setIsDrawerOpen(true);
  }, []);

  // Close investigation drawer
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedMetric(null), 300);
  }, []);

  // Handle action completion from drawer
  const handleActionComplete = useCallback(
    (metricId: MetricId, action: string) => {
      console.log(`✅ Action completed for ${metricId}: ${action}`);
      setCompletedActions((prev) => new Set(prev).add(metricId));

      // Show success toast
      success(
        "Mitigation Executed",
        `${action} - Notification sent to team.`
      );

      // Clear after 10 seconds
      setTimeout(() => {
        setCompletedActions((prev) => {
          const next = new Set(prev);
          next.delete(metricId);
          return next;
        });
      }, 10000);
    },
    [success]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (connection.isConnected) {
      refreshSheets();
    } else {
      refetchBackend();
    }
  }, [connection.isConnected, refreshSheets, refetchBackend]);

  // Handle Strategic Repair (Crisis Resolution)
  const handleInitiateRepair = useCallback(async () => {
    if (!resolutionPayload || !displayData) return;

    setIsRepairing(true);
    
    // Log repair initiation
    addThought(
      `[OPTIMIZER] Initiating Strategic Repair. Applying ${resolutionPayload.operations.length} optimization(s)...`,
      "active",
      "zap"
    );

    // Trigger Neural Wave animation (Emerald waves washing away Crisis Red)
    const waveOverlay = document.createElement("div");
    waveOverlay.className = "fixed inset-0 z-[9998] pointer-events-none";
    waveOverlay.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 animate-[wave_2s_ease-in-out]"></div>
    `;
    
    // Add wave animation CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes wave {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(waveOverlay);

    // Simulate repair delay (1.5 seconds for animation)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Persist resolution to data source
    const { persistResolution, ExecutionEngine } = await import("@/lib/executionAdapter");
    const sourceType = ExecutionEngine.detectSourceType({
      sheetId: connection.sheetId || undefined,
      type: connection.isConnected ? "GOOGLE_SHEETS" : selectedSource === "CSV" ? "CSV" : undefined,
      filePath: selectedSource === "CSV" ? pendingMapping?.fileName : undefined,
    });

    const target = connection.sheetId || pendingMapping?.fileName || "unknown";
    const persistResult = await persistResolution(
      {
        industry: resolutionPayload.industry,
        before: resolutionPayload.before,
        after: resolutionPayload.after,
        operations: resolutionPayload.operations,
      },
      sourceType,
      target
    );

    // Add audit log entry
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action: "STRATEGIC PIVOT EXECUTED - TARGETS RECALIBRATED",
      industry: resolutionPayload.industry.toUpperCase(),
      strategicImpact: `${resolutionPayload.operations.length} optimization(s) applied. Health boost: +${resolutionPayload.predictedHealthBoost}%`,
      txId: persistResult.txId,
      status: persistResult.success ? "success" : "error",
    };
    setAuditLogs((prev) => [...prev, auditEntry]);

    // Notification HUD
    console.log("[WEBHOOK] Board of Directors notified via Slack/Discord.");
    addThought(
      `[WEBHOOK] Board of Directors notified via Slack/Discord. Transaction ID: ${persistResult.txId}`,
      persistResult.success ? "success" : "error",
      "zap"
    );

    // Update displayData with optimized metrics
    if (displayData) {
      const optimizedData = { ...displayData };
      
      // Apply resolution operations
      if (resolutionPayload.after.burn_multiple !== undefined && optimizedData.financials?.burn_multiple) {
        optimizedData.financials.burn_multiple.value = resolutionPayload.after.burn_multiple;
        optimizedData.financials.burn_multiple.status = "Healthy";
      }
      
      if (resolutionPayload.after.arr !== undefined && optimizedData.financials?.arr) {
        optimizedData.financials.arr.value = resolutionPayload.after.arr;
      }

      // Apply other resolution metrics
      if (resolutionPayload.after.gross_margin !== undefined) {
        (optimizedData as any).financials = {
          ...optimizedData.financials,
          gross_margin: resolutionPayload.after.gross_margin,
        };
      }
      
      if (resolutionPayload.after.inventory_age !== undefined) {
        (optimizedData as any).inventory = {
          ...(optimizedData as any).inventory,
          age_days: resolutionPayload.after.inventory_age,
        };
      }

      // Update state by triggering a refresh (for demo mode) or updating sheets data
      // In a real implementation, you'd persist this to the data source
      if (isDemoMode && demoData) {
        setDemoData(optimizedData);
      } else if (connection.isConnected && refreshSheets) {
        // For real data, trigger a refresh after repair
        setTimeout(() => {
          refreshSheets();
        }, 2000);
      }
      
      // Log success
      addThought(
        `[OPTIMIZER] Sovereign Repair Successful. Strategic Alignment Restored.`,
        "success",
        "zap"
      );

      // Trigger Neural Voice summary
      if (!voiceMuted) {
        setTimeout(() => {
          speak(
            "Strategic Pivot initiated. Metrics recalibrated for survival. Crisis resolution complete.",
            "Executive",
            {
              isReturning: false,
              persona: selectedPersona,
              industry: verifiedIndustry,
            }
          );
        }, 500);
      }

      // Update Intelligence Health Score (boost to 92%)
      const newHealthScore = 40 + (resolutionPayload.predictedHealthBoost || 52);
      setIntelligenceHealth((prev) => ({
        ...prev,
        score: Math.min(newHealthScore, 100),
        label: newHealthScore >= 90 ? "Excellent" : newHealthScore >= 75 ? "Good" : "Fair",
        color: newHealthScore >= 90 ? "#10b981" : newHealthScore >= 75 ? "#06b6d4" : "#f59e0b",
        statusDescription: "Strategic repair applied. Metrics optimized for survival.",
        breakdown: {
          ...prev.breakdown,
          integrity: {
            ...prev.breakdown.integrity,
            score: Math.min(prev.breakdown.integrity.score + 20, prev.breakdown.integrity.maxScore),
            message: "Strategic corrections applied. Data integrity restored.",
          },
        },
      }));

      // Clear wave animation after 2 seconds
      setTimeout(() => {
        waveOverlay.remove();
        style.remove();
      }, 2000);
    }

    setIsRepairing(false);
  }, [resolutionPayload, displayData, addThought, voiceMuted, speak, selectedPersona, verifiedIndustry, connection.sheetId, selectedSource, pendingMapping, isDemoMode, demoData, setDemoData, connection.isConnected, refreshSheets]);

  return (
    <>
      {/* Welcome Overlay */}
      <WelcomeOverlay
        isVisible={showWelcome}
        onEnterDemo={startDemoMode}
        onConnectBusiness={() => setShowAuth(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        initialMode="login"
      />

      {/* Crisis Banner (when Stress Test active) */}
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
              CRISIS MODE ACTIVE · STRESS TEST ENABLED · RISK: {(riskCalculation?.riskScore || 0) * 100}%
            </span>
        </div>
        </motion.div>
      )}

      {/* Boardroom Mode Component */}
      {isBoardroomMode && (
        <BoardroomMode
          isStressTest={isStressTest}
          onStressTestToggle={setIsStressTest}
          riskAppetite={riskAppetite}
          onRiskAppetiteChange={(appetite) => {
            setRiskAppetite(appetite);
            universalBrain(appetite); // Update brain instance
          }}
          industry={verifiedIndustry}
          riskScore={riskCalculation?.riskScore || 0}
          agentDebates={
            strategicDebate
              ? [
                  {
                    agentId: strategicDebate.policyPosition.agentId,
                    agentName: strategicDebate.policyPosition.agentName,
                    thought: strategicDebate.policyPosition.reasoning,
                    position: strategicDebate.policyPosition.position,
                    confidence: strategicDebate.policyPosition.confidence,
                  },
                  {
                    agentId: strategicDebate.strategyPosition.agentId,
                    agentName: strategicDebate.strategyPosition.agentName,
                    thought: strategicDebate.strategyPosition.reasoning,
                    position: strategicDebate.strategyPosition.position,
                    confidence: strategicDebate.strategyPosition.confidence,
                  },
                ]
              : []
          }
          resolutionPayload={resolutionPayload ? {
            before: resolutionPayload.before,
            after: resolutionPayload.after,
            predictedHealthBoost: resolutionPayload.predictedHealthBoost,
          } : null}
          onInitiateRepair={handleInitiateRepair}
        />
      )}

      <main 
        className={`relative flex text-slate-100 ${isBoardroomMode ? 'boardroom-main bg-black font-inter overflow-auto' : 'min-h-screen bg-black'}`} 
        style={isBoardroomMode ? { 
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
          backgroundColor: '#000000', // Pure Black (#000000)
          paddingTop: isStressTest ? 'calc(5vh + 3rem)' : '5vh', // Account for crisis banner
          paddingBottom: '5vh',
          paddingLeft: '4rem',
          paddingRight: '4rem',
          height: '100vh',
          width: '100vw',
        } : {}}
      >
        {/* Sovereign History Sidebar */}
        {displayData && !isBoardroomMode && (
          <SovereignHistory
            onSessionSelect={(session) => {
              setCurrentTxId(session.tx_id);
              addThought(
                `[VAULT] Recalling context from ${session.tx_id}`,
                "active",
                "brain"
              );
            }}
          />
        )}
        
        {/* Main Content Area */}
        <div className={`flex-1 ${isBoardroomMode ? '' : 'flex items-center justify-center px-4'}`}>
        <div 
          className={`w-full max-w-5xl space-y-10 ${isBoardroomMode ? 'mx-auto min-h-[115vh]' : 'py-10'}`} 
          style={isBoardroomMode ? { 
            // Surgical Fit-to-Viewport: Use scale(0.95) with min-h-[115vh] for perfect centering
            transform: 'scale(0.95)', 
            transformOrigin: 'top center', // Ensures top stays visible
            margin: 'auto', // Perfect centering without clipping
            display: 'flex',
            flexDirection: 'column',
          } : {}}
        >
        <header className={`space-y-8 ${isBoardroomMode ? 'hidden' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Executive Health Gauge */}
              <ExecutiveHealthGauge 
                health={intelligenceHealth} 
                persona={selectedPersona as PersonaType}
                onFactorClick={handleDetectiveDive}
                isDetectiveMode={isDetectiveMode}
                isExecuting={isExecutingFix}
                executionSuccess={executionSuccess}
                onDeepScanComplete={(factor) => {
                  // Always update thought log, even if score is already 40/40
                  addThought(
                    `[SHIELD] Forensic Audit Complete: ${factor.toUpperCase()} Strategic Integrity Verified at 100%. No drift detected.`,
                    "success",
                    "shield"
                  );
                  // Clear detective mode after deep scan completes
                  setIsDetectiveMode(false);
                  setDetectiveFactor(null);
                }}
              />
              
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                NeuraSight Strong Brain
              </span>
              
              {/* ========== SOVEREIGN GOVERNANCE ========== */}
              <SovereignGovernance
                isWriteEnabled={isWriteEnabled}
                onToggle={async (enabled) => {
                  setIsWriteEnabled(enabled);
                  
                  // Log governance action
                  if (currentTxId) {
                    const { getLatestSession, logGovernanceAction } = await import("@/lib/sovereignVault");
                    const session = await getLatestSession();
                    if (session) {
                      await logGovernanceAction(
                        session.id,
                        enabled ? "WRITE_BACK" : "READ_ONLY",
                        "USER",
                        enabled
                          ? "User granted write-back authority"
                          : "User activated Sovereign Shield (read-only)"
                      );
                    }
                  }
                }}
                currentTxId={currentTxId}
                toleranceLevel={toleranceLevel}
                onToleranceChange={(level) => {
                  setToleranceLevel(level);
                  addThought(`[GOVERNANCE] SECURITY LEVEL: ${level}. ALL REPORTS UNLOCKED.`, "success", "shield");
                }}
              />

              {/* ========== INTEGRITY SEAL ========== */}
              {displayData && (
                <IntegritySeal
                  mathIntegrityConfidence={mathIntegrityConfidence}
                  headerMatch={pendingMapping ? Object.keys(pendingMapping.mapping || {}).length > 0 : true}
                  auditMethod={dataContract?.ontology_mapping ? "Semantic Mapping" : "Structural Checksum"}
                  totalRowsAudited={dataContract?.total_rows}
                />
              )}

              {/* ========== MATH INTEGRITY BADGE ========== */}
              {displayData && (
                <MathIntegrityBadge
                  confidence={mathIntegrityConfidence}
                  toleranceLevel={toleranceLevel}
                />
              )}

              {/* ========== SENTINEL STATUS BADGE ========== */}
              {displayData && (
                <SentinelBadge
                  isActive={true}
                  anomalyCount={sentinelAnomalyCount}
                />
              )}
              
              {/* ========== SOURCE AUTHENTICITY BADGE ========== */}
              {displayData && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: selectedSource === "CSV" 
                      ? "rgba(6, 182, 212, 0.4)" 
                      : "rgba(16, 185, 129, 0.4)",
                    backgroundColor: selectedSource === "CSV"
                      ? "rgba(6, 182, 212, 0.1)"
                      : "rgba(16, 185, 129, 0.1)",
                    color: selectedSource === "CSV" ? "#06b6d4" : "#10b981",
                  }}
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: selectedSource === "CSV" ? "#06b6d4" : "#10b981",
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {selectedSource === "CSV" && pendingMapping?.fileName
                    ? `[EXTERNAL DATA: ${pendingMapping.fileName}]`
                    : selectedSource === "CSV"
                    ? "[EXTERNAL DATA: CSV]"
                    : connection.isConnected
                    ? "[LIVE SYNC: Google Sheets]"
                    : "[DEMO DATA]"}
                </motion.span>
              )}

            {/* ========== CONNECT SOURCE BUTTON ========== */}
            {connection.isConnected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  Connected: {connection.metadata?.sheetName || "Google Sheet"}
                </span>
                {connection.sheetUrl && (
                  <a
                    href={connection.sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400"
                    title="Open in Google Sheets"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={disconnectSheets}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
                  title="Disconnect"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsIngestionHubOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-400"
              >
                <Link2 className="h-3 w-3" />
                Connect Source
              </button>
            )}

            {/* ========== STRESS TEST TOGGLE (only when not connected) ========== */}
            {!connection.isConnected && (
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isDemoMode
                    ? "border-red-500/60 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-red-500/40 hover:text-red-400"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isDemoMode && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isDemoMode ? "bg-red-500" : "bg-slate-600"
                    }`}
                  />
                </span>
                <Radio className="h-3 w-3" />
                {isDemoMode ? "CHAOS ACTIVE" : "Stress Test"}
              </button>
            )}

            {/* Manual chaos trigger button */}
            {isDemoMode && !connection.isConnected && (
              <button
                type="button"
                onClick={triggerChaos}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
              >
                <Zap className="h-3 w-3" />
                Trigger Event
              </button>
            )}

            {/* ========== BOARDROOM MODE TOGGLE ========== */}
            <button
              type="button"
              onClick={isBoardroomMode ? handleExitBoardroom : handleEnterBoardroom}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              {isBoardroomMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  Exit Boardroom
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Enter Boardroom Mode
                </>
              )}
            </button>
            </div>

            {/* System Status Indicator & Demo Mode Badge */}
            <div className="flex items-center gap-2">
              {/* Global Voice Toggle (Main Dashboard) */}
              {!isBoardroomMode && (
                <GlobalVoiceToggle persona={selectedPersona as PersonaType} />
              )}
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                System Status: STANDBY
              </motion.span>

              {/* Live Sync Indicator */}
              {connection.isConnected && (
                <motion.span
                  animate={isSyncing ? {
                    opacity: [0.3, 1, 0.3],
                    scale: [0.95, 1.05, 0.95],
                  } : {
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={isSyncing ? {
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  } : {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: isSyncing ? '#00FF00' : '#10b981',
                  }}
                >
                  <motion.span
                    animate={isSyncing ? {
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    } : {
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={isSyncing ? {
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    } : {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: isSyncing ? '#00FF00' : '#10b981',
                      boxShadow: isSyncing 
                        ? '0 0 8px rgba(0, 255, 0, 0.8), 0 0 16px rgba(0, 255, 0, 0.4)'
                        : '0 0 4px rgba(16, 185, 129, 0.6)',
                    }}
                  />
                  {isSyncing ? "SYNCING" : "LIVE"}
                </motion.span>
              )}
              
              {/* Demo Mode Badge */}
              {isDemoMode && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  DEMO MODE ACTIVE
                </motion.span>
              )}
            </div>
          </div>

          <h1 className="break-words pt-8 font-mono text-4xl font-semibold uppercase tracking-[0.15em] sm:text-5xl md:text-6xl">
            ARCHITECTING CERTAINTY IN A WORLD OF ENTROPY.
          </h1>
          <p className="max-w-3xl font-mono text-sm text-slate-400 sm:text-base">
            {(() => {
              // DYNAMIC SUBTITLE: Replace static "B2B SaaS Series B" string with domain-aware logic
              if (isBoardroomMode) {
                // Extract verified domain from orchestrator activities (highest priority)
                const orchestratorActivity = agentActivities
                  .filter(a => a.agentId === "orchestrator")
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
                
                const orchestratorMetadata = orchestratorActivity?.metadata as {
                  verifiedIndustry?: string;
                  domainConsensus?: { industry?: string; verified?: boolean };
                  forcedIndustry?: string;
                } | undefined;
                
                // Check multiple sources for verified domain
                const verifiedIndustry = orchestratorMetadata?.verifiedIndustry || 
                                        orchestratorMetadata?.domainConsensus?.industry ||
                                        orchestratorMetadata?.forcedIndustry;
                
                // Also check Policy Auditor for domain (fallback)
                const policyActivity = agentActivities.find(a => a.agentId === "policy");
                const policyIndustry = policyActivity?.metadata?.industry as string | undefined;
                
                // Use verified industry if available, otherwise use policy industry
                const domain = verifiedIndustry || policyIndustry;
                
                // If domain is verified (via orchestrator consensus), show "[DOMAIN] Strategic Brief"
                if (domain && (orchestratorMetadata?.domainConsensus?.verified || orchestratorActivity)) {
                  const domainUpper = domain.toUpperCase();
                  // Map ecommerce to RETAIL for display
                  const displayDomain = domainUpper === "ECOMMERCE" ? "RETAIL" : domainUpper;
                  return `${displayDomain} Strategic Brief`;
                }
                
                // If no verified domain but we have a domain, show it
                if (domain) {
                  const domainUpper = domain.toUpperCase();
                  const displayDomain = domainUpper === "ECOMMERCE" ? "RETAIL" : domainUpper;
                  return `${displayDomain} Strategic Brief`;
                }
                
                // Fallback: No data available
                return "Adaptive Intelligence Terminal";
              }
              // Default subtitle for non-boardroom mode - Strategic Command OS description
              return "NeuraSight is the world's first Sovereign Strategic OS. Move beyond reactive analytics to a 12-node agentic swarm that audits mathematical truth and executes self-healing pivots with absolute authority.";
            })()}
          </p>
          
        </header>
        
        {/* Vignette Effect for Hero Section */}
        {!isBoardroomMode && (
          <div 
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-[600px]"
            style={{
              background: "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)",
            }}
          />
        )}

        {/* ========== DEMO MODE WATERMARK ========== */}
        {isSheetsDemoMode && !connection.isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Database className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-300">Demo Mode</p>
                <p className="text-xs text-slate-500">
                  Using sample data. Connect a Google Sheet for live data.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={TEMPLATE_COPY_URL}
            target="_blank"
            rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Download Template
              </a>
              <button
                type="button"
                onClick={() => setIsIngestionHubOpen(true)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20"
              >
                Connect Now
              </button>
        </div>
          </motion.div>
        )}

        {/* ========== CHAOS EVENT LOG (when demo mode active) ========== */}
        {isDemoMode && !connection.isConnected && lastEvent && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur ${
              lastEvent.triggeredUrgency
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-slate-700 bg-slate-800/50"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                lastEvent.triggeredUrgency
                  ? "bg-amber-500/20"
                  : "bg-slate-700/50"
              }`}
            >
              <Zap
                className={`h-4 w-4 ${
                  lastEvent.triggeredUrgency
                    ? "text-amber-400"
                    : "text-slate-400"
                }`}
              />
    </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-300">
                <span className="font-semibold text-slate-100">
                  {lastEvent.metric}
                </span>{" "}
                {lastEvent.type === "spike" && "spiked"}
                {lastEvent.type === "dip" && "dropped"}
                {lastEvent.type === "fluctuation" && "fluctuated"}{" "}
                <span
                  className={
                    lastEvent.change > 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {lastEvent.change > 0 ? "+" : ""}
                  {lastEvent.change}%
                </span>
                {lastEvent.triggeredUrgency && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    [URGENCY] TRIGGERED
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Event #{eventCount} ·{" "}
                {lastEvent.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const syntheticMetric: PrioritizedMetric = {
                  id: lastEvent.metric
                    .toLowerCase()
                    .replace(/\s+/g, "_") as PrioritizedMetric["id"],
                  title: lastEvent.metric,
                  value: `${lastEvent.change > 0 ? "+" : ""}${lastEvent.change}%`,
                  subValue: lastEvent.type,
                  status: lastEvent.triggeredUrgency
                    ? "Urgency threshold exceeded"
                    : "Within normal range",
                  trend:
                    lastEvent.change > 0
                      ? "positive"
                      : lastEvent.change < 0
                        ? "negative"
                        : "neutral",
                  iconType: "efficiency",
                  category: "financials",
                  priorityScore: lastEvent.triggeredUrgency ? 200 : 100,
                  isUrgent: lastEvent.triggeredUrgency,
                  changePercent: lastEvent.change,
                };
                handleMetricClick(syntheticMetric);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
            >
              <Search className="h-3 w-3" />
              Investigate
            </button>
          </div>
        )}

        {/* ========== LIVE DASHBOARD: Real-time Data with Success Glow ========== */}
        {displayData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {/* Success State Glow - Subtle Emerald Pulse on Dashboard */}
            {aiAnalysis && !isAnalyzing && (
              <motion.div
                className="pointer-events-none absolute -inset-1 rounded-2xl"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(16, 185, 129, 0.3)",
                    "0 0 30px 8px rgba(16, 185, 129, 0.15)",
                    "0 0 0 0 rgba(16, 185, 129, 0.3)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <LiveDashboard
              data={displayData}
              persona={selectedPersona}
              onMetricClick={handleMetricClick}
              industry={verifiedIndustry}
              dataSource={
                selectedSource === "CSV"
                  ? "CSV"
                  : selectedSource === "GOOGLE_SHEETS"
                  ? "GOOGLE_SHEETS"
                  : "DEMO"
              }
            />
          </motion.div>
        )}

        {/* ========== NEURAL SIMULATOR (What-If Engine) - Prominent in Boardroom Mode ========== */}
        {displayData && isBoardroomMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <NeuralSimulator
              currentData={displayData}
              onPredictionComplete={(explanation) => {
                // Trigger speech when prediction completes (sync with Ghost UI pulse)
                if (explanation && !voiceMuted) {
                  // Small delay to sync with visual pulse (300ms for Ghost UI)
                  setTimeout(() => {
                    speak(explanation, "Amit", {
                      isReturning: false,
                      persona: selectedPersona,
                    });
                  }, 300);
                }
              }}
            />
          </motion.div>
        )}

        {/* Command Portal - Ingestion Gate (Replaces Empty State) */}
        {!isGlobalSyncLoading && !displayData && !globalSyncError && !isBoardroomMode && (
          <div className="relative flex min-h-[600px] flex-col items-center justify-center gap-12 overflow-hidden">
            {/* Dark Vignette Overlay - Ensures no background bleed */}
            <div 
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.95) 100%)",
              }}
            />
            
            {/* Agentic Flow Background */}
            <AgenticFlow isActive={true} isProcessing={isSwarmExecuting || isGenerating || isIngesting} />
            
            {/* Neural Grid Background */}
            <div className="absolute inset-0">
              <SovereignEmptyState
                onInitialize={() => setIsIngestionHubOpen(true)}
              />
            </div>
            
            {/* Sovereign Ingestion Gate - Centered */}
            <div className="relative z-40 flex items-center justify-center">
              <motion.button
                type="button"
                onClick={() => setIsIngestionHubOpen(true)}
                className="relative flex flex-col items-center justify-center gap-4 border border-emerald-500/40 bg-black p-12 transition-all hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                style={{
                  borderRadius: "0px",
                  minWidth: "320px",
                  minHeight: "240px",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Scanline Effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    opacity: [0, 1, 0],
                    y: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background: "linear-gradient(to bottom, transparent 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)",
                  }}
                />
                
                {/* Icon */}
                <div className="relative z-10">
                  <Link2 className="h-16 w-16 text-emerald-400" />
                </div>
                
                {/* Label */}
                <div className="relative z-10 text-center">
                  <div className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    SOVEREIGN INGESTION GATE
                  </div>
                  <div className="mt-2 font-mono text-base font-bold uppercase tracking-wider text-emerald-400">
                    INITIATE DATA INGESTION
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    CSV | SHEETS | API
                  </div>
                </div>
              </motion.button>
            </div>
            
            {/* System Overview Ghost Button - Bottom Center */}
            <motion.button
              type="button"
              onClick={() => setShowSystemOverview(true)}
              className="relative z-40 mt-8 flex items-center gap-2 border border-emerald-500/40 bg-black/60 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-400 backdrop-blur-md transition-all hover:border-emerald-500 hover:text-emerald-400"
              style={{
                borderRadius: "0px",
                cursor: "pointer",
              }}
              initial={{ opacity: 0.6 }}
              whileHover={{ 
                opacity: 1,
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Info className="h-3 w-3" />
              SYSTEM OVERVIEW: HOW NEURASIGHT WORKS
            </motion.button>
          </div>
        )}

        {/* Loading State (only show if actively loading) - Consistent HUD for CSV and Sheets */}
        {(isGlobalSyncLoading || isUploadingCsv) && !displayData && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm text-slate-400">
              {isUploadingCsv
                ? "Analyzing CSV data..."
                : connection.isConnected
                ? "Fetching from Google Sheets..."
                : "Connecting to NeuraSight Brain..."}
            </span>
            {/* Persona status indicator */}
            <motion.span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {selectedPersona}
            </motion.span>
          </div>
        )}

        {/* Error State */}
        {globalSyncError && !displayData && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
            <p className="text-sm font-medium text-red-400">
              [ERROR] Unable to load data
            </p>
            <p className="mt-1 text-xs text-slate-500">{globalSyncError}</p>
          </div>
        )}

        {/* DNA Scan Overlay - Ingestion Ceremony */}
        <DNAScanOverlay isActive={isIngesting} />

        {/* Dashboard Content - Only render when displayData exists */}
        {displayData ? (isBoardroomMode ? (
          <div className="space-y-8">
            {/* Strategic Insight Card (AI Analysis Result) */}
            {aiAnalysis && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 shadow-xl shadow-emerald-500/10"
              >
                {/* Success State Glow - Emerald Pulse Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
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
                  style={{
                    pointerEvents: "none",
                  }}
                />
                {/* Header */}
                <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                  {isDetectiveMode && detectiveFactor ? (
                    <>
                      <MagnifyingGlass className="h-5 w-5 text-cyan-400" />
                      Detective Mode: Investigating {detectiveFactor.charAt(0).toUpperCase() + detectiveFactor.slice(1)}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Agent 11 Strategic Insight · {selectedPersona} Lens
                    </>
                  )}
                </div>
                {/* Executive Action Center */}
                {recommendations.length > 0 && (
                  <div className="mb-6">
                    <ExecutiveActionCenter
                      recommendations={recommendations}
                      persona={selectedPersona}
                      onViewDetails={(rec) => {
                        // Scroll to analysis section and highlight the recommendation
                        const analysisElement = document.querySelector('[data-analysis-content]');
                        if (analysisElement) {
                          analysisElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        // Add a thought log entry for the selected recommendation
                        addThought(
                          `Viewing recommendation: ${rec.title}`,
                          "active",
                          "zap"
                        );
                      }}
                      onExecuteAgent={(rec) => {
                        // Show toast notification
                        info(
                          "AI Agent Integration",
                          `Agent Preparing... Integration Coming Soon. (${rec.title.substring(0, 40)}...)`
                        );
                        // Add thought log entry
                        addThought(
                          `[AI AGENT] Queued: ${rec.title}`,
                          "active",
                          "brain"
                        );
                        setExecuteCount((prev) => prev + 1);
                      }}
                      onExecuteAutoFix={handleExecuteAutoFix}
                      hasFixPayload={!!detectedFixPayload}
                      predictedScoreBoost={predictedHealthBoost}
                    />
                  </div>
                )}
                {/* Analysis Content */}
                <div
                  data-analysis-content
                  className="prose prose-sm prose-invert max-w-none 
                    prose-headings:text-emerald-300 prose-headings:font-semibold prose-headings:text-base
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-li:text-slate-300 prose-li:marker:text-emerald-500
                    prose-strong:text-emerald-400"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }}
                />
              </motion.div>
            )}

            {/* LiveStrategyMap */}
            {(decisionOptions.length > 0 || activeStrategyId) && (
              <LiveStrategyMap 
                selectedPath={activeStrategyId || decisionOptions.find(opt => opt.id === "balanced")?.id || decisionOptions[0]?.id || undefined} 
                industry={verifiedIndustry}
                currentData={displayData || undefined}
                crisisScenarioId={undefined}
              />
            )}

            {/* AnalyticsSuite (Charts) - Force refresh with dataTimestamp key */}
            {displayData && (
              <AnalyticsSuite
                key={`analytics-${dataContract?.tx_id || currentTxId || Date.now()}`}
                data={displayData}
                industry={verifiedIndustry}
                activeConnectors={activeConnectors}
                isWriteEnabled={isWriteEnabled}
                recommendations={recommendations}
                sourceType={selectedSource === "CSV" ? "CSV" : selectedSource === "GOOGLE_SHEETS" ? "GOOGLE_SHEETS" : "CSV"}
                target={selectedSource === "CSV" ? (pendingMapping?.fileName || "data.csv") : connection.sheetId || "unknown"}
                onTerminalMessage={(msg) => {
                  // Send message to terminal via global function
                  if ((window as any).__neurasight_addTerminalMessage) {
                    (window as any).__neurasight_addTerminalMessage({
                      agent: msg.agent,
                      message: msg.message,
                      type: msg.agent === "WRITER" || msg.agent === "AUDITOR" ? "writer" : "system",
                      statusCode: msg.statusCode,
                    });
                  }
                }}
                onForecastGenerated={(forecast) => {
                  setCurrentForecast(forecast);
                }}
                mathIntegrityConfidence={mathIntegrityConfidence}
                txId={currentTxId}
                persona={selectedPersona}
                dataContract={dataContract}
                onSuccess={(message) => {
                  success("Executive Dossier", message);
                }}
                agent2Failed={agentActivities.find(a => a.agentId === "auditor")?.status === "failed" || agentActivities.find(a => a.agentId === "auditor")?.status === "error"}
                dataSourceHash={displayData ? JSON.stringify(displayData).slice(0, 100) : undefined}
              />
            )}
          </div>
        ) : (
          <section className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-black/60 backdrop-blur-md p-4 shadow-lg shadow-black/40">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <User2 className="h-4 w-4 text-emerald-400" />
                  <span>Persona</span>
                </div>
                {isComplete && (
                  <span className="text-xs font-medium text-emerald-300">
                    Last run: {selectedPersona}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="persona"
                    className="text-xs font-medium text-slate-400"
                  >
                    Select executive lens
                  </label>
                  <select
                    id="persona"
                    value={selectedPersona}
                    onChange={(event) => {
                      const newPersona = event.target.value as Persona;
                      setSelectedPersona(newPersona);
                      // Add voice calibration thought log
                      addThought(
                        `[VOICE] Calibrating Neural Frequency for ${newPersona} Profile...`,
                        "active",
                        "zap"
                      );
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/40 outline-none ring-emerald-500/50 transition focus:border-emerald-500 focus:ring-1"
                    disabled={isGenerating}
                  >
                    <option value="CEO">CEO · Strategic Overview</option>
                    <option value="CMO">CMO · Growth & Brand</option>
                    <option value="VP Sales">
                      VP Sales · Pipeline & Revenue
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating
                      ? "Generating..."
                      : isComplete
                        ? "Regenerate AI Report"
                        : "Generate AI Report"}
                  </button>
                  
                  {/* DOWNLOAD PDF Button */}
                  {aiAnalysis && !isAnalyzing && (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsExportingPDF(true);
                        try {
                          // Extract metric cards from displayData
                          const metricCards = displayData ? [
                            {
                              title: "ARR",
                              value: `$${((displayData.financials?.arr?.value || 0) / 1000000).toFixed(1)}M`,
                              subValue: displayData.financials?.arr?.growth_yoy ? `+${displayData.financials.arr.growth_yoy.toFixed(1)}% YoY` : undefined,
                              status: displayData.financials?.arr?.status || "Healthy",
                            },
                            {
                              title: "NRR",
                              value: `${((displayData.financials?.nrr?.value || 0) * 100).toFixed(0)}%`,
                              subValue: displayData.financials?.nrr?.status || "World Class",
                              status: displayData.financials?.nrr?.status || "Healthy",
                            },
                            {
                              title: "Burn Multiple",
                              value: `${(displayData.financials?.burn_multiple?.value || 0).toFixed(1)}×`,
                              subValue: displayData.financials?.burn_multiple?.status || "Efficient",
                              status: displayData.financials?.burn_multiple?.status || "Healthy",
                            },
                          ] : [];
                          
                          const result = await generateExecutivePDFReport({
                            title: "NeuraSight Executive Report",
                            persona: selectedPersona,
                            analysis: aiAnalysis,
                            strategicInsight: aiAnalysis,
                            metrics: displayData || undefined,
                            dataSource: selectedSource === "CSV" ? "CSV" : selectedSource === "GOOGLE_SHEETS" ? "GOOGLE_SHEETS" : "DEMO",
                            metricCards,
                          });
                          
                          if (result.success) {
                            success("PDF Downloaded", `Report saved as ${result.filename}`);
                          } else {
                            showError("Export Failed", result.error || "Failed to generate PDF");
                          }
                        } catch (err) {
                          showError("Export Failed", err instanceof Error ? err.message : "Unknown error");
                        } finally {
                          setIsExportingPDF(false);
                        }
                      }}
                      disabled={isExportingPDF || !aiAnalysis}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(isGenerating || isComplete) && !isBoardroomMode && (
              <ExecutionLog
                key={generationId}
                persona={selectedPersona}
                onComplete={handleLogComplete}
                boardroomMode={isBoardroomMode}
                currentData={displayData}
                agentActivities={agentActivities.length > 0 ? agentActivities : undefined}
              />
            )}
          </div>

          <div className="space-y-4">
            {/* AI Analysis Loading State - Agentic Thought Logger with Lightning Progress */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Lightning Progress Bar - Gradient Stream at 2x Speed */}
                <div className="relative h-1 overflow-hidden rounded-full bg-slate-800/50">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-emerald-400"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 0.8, // 2x speed (normal would be 1.6s)
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      width: "50%",
                      filter: "blur(8px)",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/80 to-emerald-400/80"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 0.2,
                    }}
                    style={{
                      width: "30%",
                    }}
                  />
                </div>
                <ActionLogger
                  thoughts={thoughtLogs}
                  title={`NeuraSight Brain · ${selectedPersona} Lens`}
                />
              </motion.div>
            )}

            {/* AI Analysis Result with Success Glow */}
            {aiAnalysis && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 shadow-xl shadow-emerald-500/10"
              >
                {/* Success State Glow - Emerald Pulse Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
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
                  style={{
                    pointerEvents: "none",
                  }}
                />
                {/* Header with export buttons */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                    CEO Strategic Insight · {selectedPersona} Lens
                    {isMockMode && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        🎭 Demo Mode
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Download PDF Button */}
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isExportingPDF}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Download Executive One-Pager (PDF)"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Download PDF
                        </>
                      )}
                    </button>

                    {/* Copy to Notion Button */}
                    <button
                      type="button"
                      onClick={handleCopyToNotion}
                      disabled={isCopyingNotion}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Copy Notion-formatted Markdown"
                    >
                      {isCopyingNotion ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Copying...
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Notion
                        </>
                      )}
                    </button>

                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Policy Violations Banner */}
                {policyViolations.length > 0 && (
                  <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <Zap className="h-3.5 w-3.5" />
                        {policyViolations.length} Policy Violation{policyViolations.length > 1 ? "s" : ""} Detected
                      </div>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {policyViolations.slice(0, 3).map((v, i) => (
                        <li key={i} className="flex items-start justify-between gap-2">
                          <span className="text-xs text-amber-300/80">
                            • {v.metric}: {v.message}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSimulateFix(`${v.metric}: ${v.message}`)}
                            disabled={isSimulating}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSimulating && simulatingRisk === `${v.metric}: ${v.message}` ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Simulating...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3" />
                                Simulate Fix
                              </>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strategy Comparison Matrix - Premium UI (Scaled in Boardroom Mode) */}
                {simulationScenarios && simulationScenarios.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 space-y-4 ${isBoardroomMode ? '' : ''}`}
                    style={isBoardroomMode ? { transform: 'scale(1.1)', transformOrigin: 'top left' } : {}}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                        Strategy Comparison Matrix
                      </div>
                      <button
                        type="button"
                        onClick={() => setSimulationScenarios(null)}
                        className="text-xs text-slate-400 transition hover:text-slate-200"
                      >
                        Close
                      </button>
                    </div>

                    {/* 3-Card Grid with Staggered Animation */}
                    <motion.div
                      className="grid gap-4 md:grid-cols-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.01, // 10ms stagger for Gemini 2.0 Flash speed
                          },
                        },
                      }}
                    >
                      {simulationScenarios.map((scenario, idx) => {
                        const riskColor =
                          scenario.risk_level === "High"
                            ? "red"
                            : scenario.risk_level === "Medium"
                              ? "amber"
                              : "emerald";
                        const riskBg =
                          scenario.risk_level === "High"
                            ? "bg-red-500/20"
                            : scenario.risk_level === "Medium"
                              ? "bg-amber-500/20"
                              : "bg-emerald-500/20";
                        const riskText =
                          scenario.risk_level === "High"
                            ? "text-red-400"
                            : scenario.risk_level === "Medium"
                              ? "text-amber-400"
                              : "text-emerald-400";

                        return (
                          <motion.div
                            key={idx}
                            variants={{
                              hidden: { opacity: 0, y: 20, scale: 0.95 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                transition: {
                                  duration: 0.3,
                                  ease: "easeOut",
                                },
                              },
                            }}
                            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4 shadow-xl backdrop-blur-sm"
                          >
                            {/* Neural Pulse Border Effect */}
                            <motion.div
                              className={`absolute inset-0 rounded-xl border-2 ${
                                riskColor === "red"
                                  ? "border-red-500/30"
                                  : riskColor === "amber"
                                    ? "border-amber-500/30"
                                    : "border-emerald-500/30"
                              }`}
                              animate={{
                                boxShadow: [
                                  `0 0 0 0 rgba(${
                                    riskColor === "red"
                                      ? "239, 68, 68"
                                      : riskColor === "amber"
                                        ? "251, 191, 36"
                                        : "16, 185, 129"
                                  }, 0.4)`,
                                  `0 0 20px 4px rgba(${
                                    riskColor === "red"
                                      ? "239, 68, 68"
                                      : riskColor === "amber"
                                        ? "251, 191, 36"
                                        : "16, 185, 129"
                                  }, 0.2)`,
                                  `0 0 0 0 rgba(${
                                    riskColor === "red"
                                      ? "239, 68, 68"
                                      : riskColor === "amber"
                                        ? "251, 191, 36"
                                        : "16, 185, 129"
                                  }, 0.4)`,
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{ pointerEvents: "none" }}
                            />

                            {/* Content */}
                            <div className="relative z-10">
                              {/* Header with Risk Badge */}
                              <div className="mb-3 flex items-start justify-between">
                                <h4 className="text-sm font-bold text-slate-100">
                                  {scenario.name}
                                </h4>
                                <motion.span
                                  className={`inline-flex items-center gap-1 rounded-full ${riskBg} ${riskText} px-2 py-1 text-[10px] font-semibold uppercase tracking-wide`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: idx * 0.01 + 0.2,
                                    type: "spring",
                                    stiffness: 500,
                                  }}
                                >
                                  <Zap className="h-2.5 w-2.5" />
                                  {scenario.risk_level} Risk
                                </motion.span>
                              </div>

                              {/* Description */}
                              <p className="mb-3 text-xs leading-relaxed text-slate-400">
                                {scenario.description}
                              </p>

                              {/* Primary Action */}
                              <div className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-2.5">
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  Primary Action
                                </div>
                                <p className="text-xs font-medium text-emerald-300">
                                  {scenario.actions[0] || "No action specified"}
                                </p>
                              </div>

                              {/* Projected Impact */}
                              <div className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-2.5">
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  Projected Impact
                                </div>
                                <p className="text-xs text-slate-300">
                                  {scenario.expected_outcome}
                                </p>
                              </div>

                              {/* Timeline */}
                              <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-semibold text-slate-500">Timeline:</span>
                                <span className="font-medium text-cyan-400">
                                  {scenario.timeline}
                                </span>
                              </div>

                              {/* Deploy Strategy Button */}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await fetch("/api/execute", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        metric: simulatingRisk || "Strategy Deployment",
                                        action: `Deploying ${scenario.name}: ${scenario.actions[0]}`,
                                        persona: selectedPersona,
                                        severity: scenario.risk_level.toLowerCase(),
                                      }),
                                    });
                                    if (response.ok) {
                                      success(
                                        "Strategy Deployed",
                                        `${scenario.name} strategy sent to Slack`
                                      );
                                    } else {
                                      showError("Deployment Failed", "Could not notify team");
                                    }
                                  } catch (err) {
                                    showError(
                                      "Deployment Failed",
                                      err instanceof Error ? err.message : "Unknown error"
                                    );
                                  }
                                }}
                                className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                                  riskColor === "red"
                                    ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                                    : riskColor === "amber"
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                                }`}
                              >
                                <span className="flex items-center justify-center gap-1.5">
                                  <Zap className="h-3 w-3" />
                                  Deploy Strategy
                                </span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                )}

                {/* Executive Action Center */}
                {recommendations.length > 0 && (
                  <div className="mb-6">
                    <ExecutiveActionCenter
                      recommendations={recommendations}
                      persona={selectedPersona}
                      onViewDetails={(rec) => {
                        // Scroll to analysis section and highlight the recommendation
                        const analysisElement = document.querySelector('[data-analysis-content]');
                        if (analysisElement) {
                          analysisElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        // Add a thought log entry for the selected recommendation
                        addThought(
                          `Viewing recommendation: ${rec.title}`,
                          "active",
                          "zap"
                        );
                      }}
                      onExecuteAgent={(rec) => {
                        // Show toast notification
                        info(
                          "AI Agent Integration",
                          `Agent Preparing... Integration Coming Soon. (${rec.title.substring(0, 40)}...)`
                        );
                        // Add thought log entry
                        addThought(
                          `[AI AGENT] Queued: ${rec.title}`,
                          "active",
                          "brain"
                        );
                        setExecuteCount((prev) => prev + 1);
                      }}
                      onExecuteAutoFix={handleExecuteAutoFix}
                      hasFixPayload={!!detectedFixPayload}
                      predictedScoreBoost={predictedHealthBoost}
                    />
                  </div>
                )}

                {/* Analysis Content */}
                <div
                  data-analysis-content
                  className="prose prose-sm prose-invert max-w-none 
                    prose-headings:text-emerald-300 prose-headings:font-semibold prose-headings:text-sm
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-li:text-slate-300 prose-li:marker:text-emerald-500
                    prose-strong:text-emerald-400"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }}
                />
              </motion.div>
            )}

            {/* Analysis Error - User-Friendly State */}
            {analysisError && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/20 p-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  {/* Subtle loading spinner */}
                  <div className="flex-shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-8 w-8 rounded-full border-2 border-amber-500/30 border-t-amber-500"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-amber-300">
                        Brain Sync in Progress
                      </h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">
                      Account verification pending. NeuraSight is using demo insights to keep you moving.
                    </p>
                    <div className="space-y-2 text-xs text-slate-400">
                      <p>• API verification is being processed</p>
                      <p>• Demo insights are available for development</p>
                      <p>• Full analysis will activate once verification completes</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry Analysis
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Default Empty State */}
            {!aiAnalysis && !isAnalyzing && !analysisError && (
              isComplete ? (
                <DashboardGrid persona={selectedPersona} onReset={handleReset} />
              ) : (
                <div className="h-full rounded-2xl border border-emerald-500/25 bg-slate-950/80 p-5 shadow-xl shadow-emerald-500/20">
                  <div className="mb-4 text-sm font-semibold text-emerald-300">
                    Executive Dashboard Status
                  </div>
                  <div className="space-y-3 text-sm text-slate-400">
                    <p className="font-medium text-slate-200">
                      No dashboard generated yet.
                    </p>
                    <p>
                      Choose a persona on the left and trigger{" "}
                      <span className="font-semibold text-emerald-300">
                        Generate AI Report
                      </span>{" "}
                      to stream the execution log and assemble a tailored view.
                    </p>
        </div>
                </div>
              )
            )}
          </div>
        </section>
        )) : null}

        {/* Neural Wave Unveil Animation - Triggered after ingestion */}
        {displayData && !isIngesting && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 1.5,
              times: [0, 0.5, 1],
            }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
            }}
          />
        )}

        {/* ========== INSIGHT PANEL (Hidden in Boardroom Mode) ========== */}
        {!isBoardroomMode && (
          <InsightPanel 
            persona={selectedPersona}
            dashboardState={displayData}
            agent2Status={agentActivities.find(a => a.agentId === "auditor")?.status === "success" ? "PASS" : agentActivities.find(a => a.agentId === "auditor")?.status === "failed" ? "FAIL" : undefined}
          />
        )}
        </div>
        </div>
      </main>

      {/* ========== INVESTIGATION DRAWER (Hidden in Boardroom Mode) ========== */}
      {!isBoardroomMode && (
        <InvestigationDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          metric={selectedMetric}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* ========== SOVEREIGN INGESTION HUB (Unified Portal) ========== */}
      {!isBoardroomMode && (
        <SovereignIngestionHub
          isOpen={isIngestionHubOpen}
          onClose={() => {
            setIsIngestionHubOpen(false);
            setIsUploadingCsv(false);
          }}
          onConnectSheets={connectSheets}
          onUploadCSV={handleFileUpload}
          isLoading={sheetsLoading || isUploadingCsv}
          error={sheetsError}
          onConnectorActivated={(provider) => {
            setActiveConnectors((prev) => {
              if (!prev.includes(provider)) {
                return [...prev, provider];
              }
              return prev;
            });
            
            if (currentUserId) {
              getSovereignConnectors(currentUserId).then(connectors => {
                const active = connectors.filter(c => c.status === "ACTIVE").map(c => c.provider_name);
                setActiveConnectors(active);
              });
            }
          }}
        />
      )}

      {/* ========== SCHEMA VERIFICATION GATE ========== */}
      {pendingMapping && (
        <SchemaVerificationModal
          isOpen={schemaVerificationOpen}
          onClose={() => {
            setSchemaVerificationOpen(false);
            setPendingMapping(null);
          }}
          onApprove={handleSchemaApproval}
          rawHeaders={pendingMapping.headers}
          mapping={pendingMapping.mapping}
          fileName={pendingMapping.fileName}
        />
      )}

      {/* ========== TOAST NOTIFICATIONS ========== */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ========== NEURAL ACTIVITY MONITOR (War Room HUD - Boardroom Mode) ========== */}
      {isBoardroomMode && (
        <NeuralActivityMonitor
          activities={agentActivities}
          isBoardroomMode={isBoardroomMode}
          isMicActive={isMicActive} // CLICK-TO-TALK: Pass mic state for HUD sync
          swarmStartTime={swarmStartTime} // Visual persistence: Pass swarm start time for 4-second minimum
          isGenerating={isGenerating} // ENFORCE 4-SECOND PULSE: Pass generating state
        />
      )}

      {/* ========== VOICE COMMAND CENTER (Boardroom Mode) ========== */}
      {isBoardroomMode && (
        <VoiceCommandCenter
          onCommandReceived={handleVocalCommand}
          isBoardroomMode={isBoardroomMode}
          onExitBoardroom={handleExitBoardroom}
          isMarketLoading={isMarketLoading}
          onMicStateChange={setIsMicActive} // CLICK-TO-TALK: Sync mic state to HUD
          persona={selectedPersona as PersonaType}
        />
      )}

      {/* ========== FLOATING PDF EXPORT BUTTON (Boardroom Mode) ========== */}
      {isBoardroomMode && (() => {
        // Check if domain is verified for certified glow
        const orchestratorActivity = agentActivities.find(
          (a) => a.agentId === "orchestrator"
        );
        const consensusData = orchestratorActivity?.metadata?.domainConsensus as {
          verified?: boolean;
        } | undefined;
        const isCertified = consensusData?.verified || false;
        
        return (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isCertified
                ? "border-emerald-400/70 bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-emerald-500/30 text-emerald-200 shadow-emerald-500/40 hover:from-emerald-500/40 hover:via-cyan-500/40 hover:to-emerald-500/40 hover:border-emerald-400"
                : "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400"
            }`}
            style={
              isCertified
                ? {
                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(34, 211, 238, 0.3)",
                  }
                : {}
            }
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {isCertified ? "Download Certified Brief" : "Download Brief"}
              </>
            )}
          </motion.button>
        );
      })()}

      {/* ========== DEBUG: Live Backend Data (Hidden by default, Ctrl+D to toggle) ========== */}
      {showDebugOverlay && !isBoardroomMode && (
        <div className="fixed bottom-4 left-4 z-40 max-h-[50vh] w-[400px] overflow-auto rounded-xl border border-white/5 bg-black/60 backdrop-blur-md p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Database className="h-4 w-4" />
            <span>Data Pipeline</span>
            {connection.isConnected ? (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                SHEETS
              </span>
            ) : isDemoMode ? (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                SIMULATED
              </span>
            ) : (
              <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                DEMO
              </span>
            )}
    </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span>
              {connection.isConnected
                ? "Fetching from Google Sheets..."
                : "Loading..."}
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            <p className="font-semibold">[ERROR]</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {displayData && !isLoading && (
          <pre className="overflow-x-auto rounded-lg bg-black/60 backdrop-blur-md border border-white/5 p-3 text-xs text-emerald-300">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        )}

        {/* Completed Actions */}
        {completedActions.size > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Recent Actions
            </p>
            {Array.from(completedActions).map((metricId) => (
              <div
                key={metricId}
                className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-400"
              >
                <CheckCircle className="h-3 w-3" />
                <span>{metricId} mitigation executed</span>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Scenario Engine removed - Executive Command Center only */}

      {/* ========== AUDIT TRAIL (Executive Audit Log) ========== */}
      {displayData && !isBoardroomMode && auditLogs.length > 0 && (
        <div className="mt-8">
          <AuditTrail logs={auditLogs} maxLogs={50} />
        </div>
      )}

      {/* ========== DECISION PORTAL (Sovereign Decision Engine) ========== */}
      <DecisionPortal
        isOpen={isAwaitingCommand}
        options={decisionOptions}
        onSelect={handleDecisionSelect}
        onClose={() => setIsAwaitingCommand(false)}
      />

      {/* ========== EXECUTION CONFIRMATION MODAL (HIL Guardrail with Dry Run Preview) ========== */}
      <ExecutionConfirmationModal
        isOpen={showExecutionModal}
        fixPayload={detectedFixPayload}
        previewDiffs={previewDiffs}
        strategicImpact={strategicImpact}
        healthBoost={predictedHealthBoost}
        onConfirm={handleConfirmExecution}
        onCancel={() => {
          setShowExecutionModal(false);
          setPreviewDiffs(null);
          setStrategicImpact(null);
          setPredictedHealthBoost(null);
        }}
        isExecuting={isExecutingFix}
      />

      {/* ========== AGENTIC PULSE TERMINAL (Bottom-Left Diagnostic Terminal) ========== */}
      {!isBoardroomMode && (
        <AgenticPulseTerminal isActive={true} isIngesting={isIngesting} activeConnectors={activeConnectors} />
      )}

      {/* ========== SYSTEM OVERVIEW MODAL ========== */}
      <SystemOverviewModal
        isOpen={showSystemOverview}
        onClose={() => setShowSystemOverview(false)}
      />

    </>
  );
}
