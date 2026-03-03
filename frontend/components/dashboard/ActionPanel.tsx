"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  X,
  Activity,
  Shield,
  AlertCircle,
} from "lucide-react";
import type { Persona } from "@/components/ExecutionLog";

/**
 * Strategic Action from Agent 11
 */
export interface StrategicAction {
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
}

interface ActionPanelProps {
  strategicActions?: StrategicAction[];
  persona: Persona;
  isVisible?: boolean;
  onActionExecute?: (action: StrategicAction) => Promise<void>;
  validatorCertificate?: {
    integrity_seal?: string;
    domain_verified?: boolean;
  };
}

/**
 * Pre-Execution Confirmation Modal
 */
function ExecutionModal({
  action,
  isOpen,
  onClose,
  onConfirm,
  isExecuting,
}: {
  action: StrategicAction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isExecuting: boolean;
}) {
  if (!action) return null;

  // Determine target system based on action type
  const getTargetSystem = (actionType: string): string => {
    const systemMap: Record<string, string> = {
      reduce_burn_rate: "Financial System",
      launch_customer_success: "CRM (HubSpot)",
      optimize_burn_multiple: "Financial System",
      reallocate_marketing_budget: "Google Ads / Marketing Platforms",
      expand_sales_team: "HR / ATS System",
      accelerate_sales_velocity: "CRM (HubSpot)",
      optimize_product_mix: "Inventory Management",
      launch_loyalty_program: "Customer Platform",
      improve_client_retention: "CRM (HubSpot)",
      optimize_inventory_turnover: "Inventory Management",
      optimize_ltv_cac: "Marketing & Analytics",
      t2d3_acceleration: "Strategic Planning",
    };
    return systemMap[actionType] || "NeuraSight Execution Engine";
  };

  const targetSystem = getTargetSystem(action.one_click_action_payload.action_type);

  // Build logic summary
  const logicSummary = action.metadata?.anomaly_source
    ? `${action.metadata.anomaly_source}. Agent 11 analyzed this deviation and determined ${action.title} is the optimal strategic response.`
    : `Agent 11 (Dynamic Strategy Engine) analyzed verified metrics from Agent 2 (Math Auditor) and determined ${action.title} is the optimal strategic response for your ${action.persona_alignment} priorities.`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-8 shadow-2xl backdrop-blur-xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-emerald-300">Pre-Execution Confirmation</h2>
                </div>
                <p className="text-slate-400">Review the strategic action before execution</p>
              </div>

              {/* Action Title */}
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-slate-800/50 p-4">
                <h3 className="text-xl font-semibold text-white">{action.title}</h3>
              </div>

              {/* NeuraSight Logic Summary */}
              <div className="mb-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-300">NeuraSight Logic Summary</span>
                  </div>
                  <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-slate-200">
                    {logicSummary}
                  </p>
                </div>

                {/* Target System */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">Target System</span>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-sm font-medium text-emerald-200">{targetSystem}</p>
                    {action.one_click_action_payload.expected_impact && (
                      <p className="mt-1 text-xs text-emerald-300/80">
                        Expected Impact: {action.one_click_action_payload.expected_impact.change_percent > 0 ? "+" : ""}
                        {action.one_click_action_payload.expected_impact.change_percent.toFixed(1)}% on{" "}
                        {action.one_click_action_payload.expected_impact.metric} within{" "}
                        {action.one_click_action_payload.expected_impact.timeframe}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk & Confidence */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-amber-300">Risk Level</div>
                  <div className="flex items-center gap-2">
                    {action.risk_level === "low" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {action.risk_level === "medium" && <AlertCircle className="h-4 w-4 text-amber-400" />}
                    {action.risk_level === "high" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    <span className="text-sm font-semibold capitalize text-white">{action.risk_level}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-cyan-300">Confidence Score</div>
                  <div className="text-sm font-semibold text-white">
                    {(action.confidence_score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Final Approval Button */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isExecuting}
                  className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isExecuting || action.metadata?.requires_manual_review}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-6 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Confirm Execution
                    </>
                  )}
                </button>
              </div>

              {/* Manual Review Warning */}
              {action.metadata?.requires_manual_review && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-300">
                    ⚠️ This action requires manual review before execution. Confidence score is below 75%.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ActionPanel({
  strategicActions = [],
  persona,
  isVisible = true,
  onActionExecute,
  validatorCertificate,
}: ActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<StrategicAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  // Filter actions by current persona
  const filteredActions = useMemo(() => {
    return strategicActions.filter((action) => action.persona_alignment === persona);
  }, [strategicActions, persona]);

  // Handle execute button click
  const handleExecuteClick = (action: StrategicAction) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  // Handle confirmation
  const handleConfirmExecution = async () => {
    if (!selectedAction) return;

    setIsExecuting(true);
    try {
      // Call the execution handler
      if (onActionExecute) {
        await onActionExecute(selectedAction);
      }

      // Mark as executed
      setExecutedActions((prev) => new Set(prev).add(selectedAction.title));

      // Close modal after a brief delay
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedAction(null);
        setIsExecuting(false);
      }, 1000);
    } catch (error) {
      console.error("Execution failed:", error);
      setIsExecuting(false);
    }
  };

  // Get risk level color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "emerald";
      case "medium":
        return "amber";
      case "high":
        return "red";
      default:
        return "slate";
    }
  };

  if (!isVisible || filteredActions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Action Panel Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-300">Strategic Actions</h3>
            {validatorCertificate?.domain_verified && (
              <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-300">Verified</span>
              </div>
            )}
          </div>
          <span className="text-sm text-slate-400">
            {filteredActions.length} action{filteredActions.length !== 1 ? "s" : ""} for {persona}
          </span>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filteredActions.map((action, index) => {
              const riskColor = getRiskColor(action.risk_level);
              const isExecuted = executedActions.has(action.title);
              const confidencePercent = action.confidence_score * 100;

              // Dynamic border color classes based on risk level
              const borderColorClass = isExecuted
                ? "border-emerald-500/50"
                : riskColor === "emerald"
                ? "border-emerald-500/30"
                : riskColor === "amber"
                ? "border-amber-500/30"
                : riskColor === "red"
                ? "border-red-500/30"
                : "border-slate-500/30";

              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative overflow-hidden rounded-xl border p-5 backdrop-blur-xl transition-all ${
                    isExecuted
                      ? "bg-emerald-500/10"
                      : "bg-gradient-to-br from-slate-900/80 to-slate-950/80"
                  } ${borderColorClass}`}
                >
                  {/* Execution Pulse Animation */}
                  {isExecuted && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        boxShadow: [
                          `0 0 0 0 rgba(16, 185, 129, 0.4)`,
                          `0 0 30px 10px rgba(16, 185, 129, 0.2)`,
                          `0 0 0 0 rgba(16, 185, 129, 0.4)`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Glassmorphism overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

                  <div className="relative z-10">
                    {/* Header with Risk Badge */}
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="flex-1 text-base font-semibold text-white">{action.title}</h4>
                      <div
                        className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          riskColor === "emerald"
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                            : riskColor === "amber"
                            ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                            : "border-red-500/40 bg-red-500/20 text-red-300"
                        }`}
                      >
                        {action.risk_level === "low" && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {action.risk_level === "medium" && <AlertCircle className="h-2.5 w-2.5" />}
                        {action.risk_level === "high" && <AlertTriangle className="h-2.5 w-2.5" />}
                        {action.risk_level}
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <p className="mb-4 text-sm leading-relaxed text-slate-300">{action.impact_analysis}</p>

                    {/* Confidence Score Meter */}
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Confidence Score</span>
                        <span className="font-semibold text-cyan-400">{confidencePercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className={`h-full ${
                            confidencePercent >= 75
                              ? "bg-gradient-to-r from-cyan-500 to-emerald-500"
                              : confidencePercent >= 50
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                              : "bg-gradient-to-r from-red-500 to-rose-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${confidencePercent}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                      {action.metadata?.requires_manual_review && (
                        <p className="mt-1 text-[10px] text-amber-400">⚠️ Requires manual review</p>
                      )}
                    </div>

                    {/* Expected Impact */}
                    {action.one_click_action_payload.expected_impact && (
                      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="h-3 w-3 text-cyan-400" />
                          <span className="text-cyan-300">
                            Expected:{" "}
                            {action.one_click_action_payload.expected_impact.change_percent > 0 ? "+" : ""}
                            {action.one_click_action_payload.expected_impact.change_percent.toFixed(1)}% on{" "}
                            {action.one_click_action_payload.expected_impact.metric} in{" "}
                            {action.one_click_action_payload.expected_impact.timeframe}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Execute Button */}
                    <button
                      onClick={() => handleExecuteClick(action)}
                      disabled={isExecuted || action.metadata?.requires_manual_review}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
                        isExecuted
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 cursor-not-allowed"
                          : action.metadata?.requires_manual_review
                          ? "border-slate-600 bg-slate-800/50 text-slate-400 cursor-not-allowed"
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20"
                      }`}
                    >
                      {isExecuted ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Executed
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="h-4 w-4" />
                          Execute Strategy
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Execution Modal */}
      <ExecutionModal
        action={selectedAction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAction(null);
        }}
        onConfirm={handleConfirmExecution}
        isExecuting={isExecuting}
      />
    </>
  );
}

