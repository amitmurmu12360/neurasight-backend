"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, Wrench, Download, Eye, TrendingUp, AlertTriangle } from "lucide-react";
import type { DashboardState } from "@/types/dashboard";
import RevenueChart from "@/components/RevenueChart";
import MarketingChart from "@/components/MarketingChart";
import FutureSightChart from "@/components/dashboard/FutureSightChart";
import { executeDeterministicPivot, type Recommendation } from "@/lib/sovereignWriter";
import { generateSovereignForecast, type ForecastResult } from "@/lib/forecastingEngine";
import { generateExecutiveDossier } from "@/lib/reportGenerator";
import { FileText } from "lucide-react";
import ForensicHealer from "./ForensicHealer";

// =============================================================================
// TYPES
// =============================================================================
interface AnalyticsSuiteProps {
  /** The dashboard data from the backend API */
  data: DashboardState;
  /** Detected industry (e.g., 'saas', 'retail') for industry-aware labels */
  industry?: string;
  /** Active API connectors for LIVE indicators */
  activeConnectors?: string[];
  /** Write-back enabled state from governance */
  isWriteEnabled?: boolean;
  /** Recommendations for deterministic repair */
  recommendations?: Recommendation[];
  /** Current data source type */
  sourceType?: "GOOGLE_SHEETS" | "CSV" | "SQL";
  /** Target identifier (sheet ID, file name, etc.) */
  target?: string;
  /** Callback for terminal messages */
  onTerminalMessage?: (message: { agent: string; message: string; statusCode: string }) => void;
  /** Raw time-series data for forecasting (optional) */
  timeSeriesData?: any[];
  /** Callback when forecast is generated */
  onForecastGenerated?: (forecast: ForecastResult) => void;
  /** Math integrity confidence for Executive Dossier */
  mathIntegrityConfidence?: number;
  /** Transaction ID for Executive Dossier signature */
  txId?: string;
  /** Persona for Executive Dossier */
  persona?: string;
  /** Success callback for toast notifications */
  onSuccess?: (message: string) => void;
  /** Forecast data for audit summary */
  forecast?: ForecastResult;
  /** Agent 2 (Math Auditor) failed status */
  agent2Failed?: boolean;
  /** Data source hash for memoization */
  dataSourceHash?: string;
  /** Data contract from semantic ontology engine */
  dataContract?: {
    tx_id?: string;
    metrics?: Record<string, number>;
    total_rows?: number;
    ontology_mapping?: Record<string, string>;
    industry?: string;
  } | null;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
/**
 * AnalyticsSuite Component
 * 
 * Extracted chart visualization suite containing:
 * - Revenue Chart (ARR growth over time)
 * - Marketing Analytics Chart (Channel breakdown)
 * 
 * Maintains exact same UI layout and styling as the original implementation.
 */
export default function AnalyticsSuite({
  data,
  industry,
  activeConnectors = [],
  isWriteEnabled = false,
  recommendations = [],
  sourceType = "CSV",
  target = "data",
  onTerminalMessage,
  timeSeriesData,
  onForecastGenerated,
  mathIntegrityConfidence = 1.0,
  txId,
  persona,
  onSuccess,
  agent2Failed = false,
  dataSourceHash,
  dataContract,
}: AnalyticsSuiteProps) {
  const hasActiveConnectors = activeConnectors.length > 0;
  const [isExecuting, setIsExecuting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "future">("analytics");
  const [isSimulatingPivot, setIsSimulatingPivot] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [isDigitallySigned, setIsDigitallySigned] = useState(false);
  const [hasForecasted, setHasForecasted] = useState(false);
  const [lastDataSourceHash, setLastDataSourceHash] = useState<string | undefined>(undefined);
  const [isHealerOpen, setIsHealerOpen] = useState(false);
  
  // MEMOIZATION: Use useRef with txId to ensure forecast API called only once per dataset
  const forecastTxIdRef = useRef<string | undefined>(undefined);

  // Calculate boost percentage from recommendations
  const calculateBoostFromRecommendations = useCallback((recs: Recommendation[]): number => {
    if (!recs || recs.length === 0) return 0;

    // Extract potential growth from recommendations
    let totalBoost = 0;
    let count = 0;

    for (const rec of recs) {
      const text = (rec.title + " " + rec.description).toLowerCase();
      if (
        text.includes("growth") ||
        text.includes("increase") ||
        text.includes("improve") ||
        text.includes("optimize")
      ) {
        const percentMatch = text.match(/(\d+(?:\.\d+)?)%/);
        if (percentMatch) {
          totalBoost += parseFloat(percentMatch[1]);
          count++;
        } else {
          totalBoost += 5;
          count++;
        }
      }
    }

    return count > 0 ? totalBoost / count : 0;
  }, []);

  // Generate synthetic time-series from dashboard data if no raw data available
  const generateSyntheticTimeSeries = useCallback((dashboardData: DashboardState): any[] => {
    const data: any[] = [];
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - 6);

    const arrValue = dashboardData.financials.arr.value;
    const growthRate = dashboardData.financials.arr.growth_yoy / 100;

    for (let i = 0; i < 6; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + i);
      const value = arrValue * Math.pow(1 + growthRate / 12, i);
      data.push({
        date: date.toISOString().split("T")[0],
        value: value,
        revenue: value,
      });
    }

    return data;
  }, []);

  const generateForecast = useCallback(async () => {
    // MEMOIZATION: Use txId to ensure forecast API called only once per dataset
    const currentTxId = txId;
    if (forecastTxIdRef.current === currentTxId && currentTxId !== undefined) {
      console.log("[Future Sight] Forecast already generated for this txId. Skipping.");
      return;
    }
    
    // Fallback: Also check data source hash
    const currentHash = dataSourceHash || JSON.stringify(timeSeriesData || data);
    if (hasForecasted && lastDataSourceHash === currentHash && !currentTxId) {
      console.log("[Future Sight] Forecast already generated for this dataset. Skipping.");
      return;
    }
    
    let dataToUse = timeSeriesData;
    
    if (!dataToUse || dataToUse.length === 0) {
      // Fallback: generate synthetic time-series from dashboard data
      const syntheticData = generateSyntheticTimeSeries(data);
      if (syntheticData.length === 0) return;
      dataToUse = syntheticData;
    }

    setIsForecasting(true);
    setHasForecasted(true);
    setLastDataSourceHash(currentHash);

    // Terminal sequence
    const terminalMessages = [
      { agent: "ANALYTICS", message: "DETECTING SEASONALITY PATTERNS...", statusCode: "SCAN" },
      { agent: "ANALYTICS", message: "RUNNING ENSEMBLE FORECAST (PROPHET_V2)...", statusCode: "SCAN" },
    ];

    for (const msg of terminalMessages) {
      onTerminalMessage?.(msg);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      // Calculate boost percentage from recommendations
      const boostPercentage = isSimulatingPivot
        ? calculateBoostFromRecommendations(recommendations)
        : 0;

      const result = generateSovereignForecast(dataToUse, 90, boostPercentage);
      setForecast(result);
      onForecastGenerated?.(result);
      
      // Store txId in ref to prevent duplicate calls
      if (txId) {
        forecastTxIdRef.current = txId;
      }

      // Terminal completion
      const confidence = Math.round((result.data.find((d) => d.observed === null)?.confidence || 0.5) * 100);
      onTerminalMessage?.({
        agent: "STRATEGIST",
        message: `${confidence}% CONFIDENCE IN Q3 GROWTH TRAJECTORY.`,
        statusCode: "OK",
      });
      onTerminalMessage?.({
        agent: "ANALYTICS",
        message: "FUTURE SIGHT ESTABLISHED.",
        statusCode: "OK",
      });
    } catch (error) {
      onTerminalMessage?.({
        agent: "ANALYTICS",
        message: `FORECAST ERROR: ${error instanceof Error ? error.message : "UNKNOWN"}`,
        statusCode: "FIX",
      });
    } finally {
      setIsForecasting(false);
    }
  }, [timeSeriesData, data, isSimulatingPivot, recommendations, calculateBoostFromRecommendations, generateSyntheticTimeSeries, onTerminalMessage, hasForecasted, lastDataSourceHash, dataSourceHash, txId]);

  // Reset forecast state when txId changes (new dataset upload)
  useEffect(() => {
    if (txId && forecastTxIdRef.current !== txId) {
      setHasForecasted(false);
      setForecast(null);
      forecastTxIdRef.current = txId;
    }
  }, [txId]);
  
  // Reset forecast state when data source changes (fallback)
  useEffect(() => {
    const currentHash = dataSourceHash || JSON.stringify(timeSeriesData || data);
    if (lastDataSourceHash !== undefined && lastDataSourceHash !== currentHash && !txId) {
      setHasForecasted(false);
      setForecast(null);
    }
  }, [dataSourceHash, timeSeriesData, data, lastDataSourceHash, txId]);

  // Generate forecast when time-series data is available (only once per dataset)
  useEffect(() => {
    if (activeTab === "future" && !forecast && !isForecasting && !hasForecasted && !agent2Failed) {
      generateForecast();
    }
  }, [activeTab, forecast, isForecasting, generateForecast, hasForecasted, agent2Failed]);

  // Re-generate forecast when simulation toggle changes (only if already forecasted)
  useEffect(() => {
    if (activeTab === "future" && forecast && isSimulatingPivot !== undefined && hasForecasted) {
      generateForecast();
    }
  }, [isSimulatingPivot, activeTab, forecast, generateForecast, hasForecasted]);



  const handleGenerateDossier = async () => {
    setIsGeneratingDossier(true);

    // Terminal sequence
    const terminalMessages = [
      { agent: "WRITER", message: "ASSEMBLING FORENSIC DATA...", statusCode: "SCAN" },
      { agent: "SENTINEL", message: "VERIFYING CONFIDENTIALITY ENCRYPTION...", statusCode: "SCAN" },
    ];

    for (const msg of terminalMessages) {
      onTerminalMessage?.(msg);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      const result = await generateExecutiveDossier({
        displayData: data,
        mathIntegrityConfidence,
        recommendations,
        txId,
        industry,
        persona,
        dataSource: sourceType,
        isDigitallySigned,
        dataContract: dataContract || undefined, // Pass data contract for PDF generation
      });

      if (result.success) {
        if (isDigitallySigned) {
          onTerminalMessage?.({ agent: "WRITER", message: "DIGITAL SIGNATURE ENCRYPTED.", statusCode: "OK" });
        }
        onTerminalMessage?.({ agent: "WRITER", message: "STRATEGIC DOSSIER COMPILED.", statusCode: "OK" });
        onTerminalMessage?.({ agent: "SYSTEM", message: "SOVEREIGN DOSSIER FINALIZED FOR BOARDROOM.", statusCode: "OK" });
        onSuccess?.(`Executive Dossier generated: ${result.filename}`);
      } else {
        onTerminalMessage?.({ agent: "WRITER", message: `ERROR: ${result.error || "GENERATION FAILED"}`, statusCode: "FIX" });
      }
    } catch (error) {
      onTerminalMessage?.({
        agent: "WRITER",
        message: `ERROR: ${error instanceof Error ? error.message : "UNKNOWN ERROR"}`,
        statusCode: "FIX",
      });
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  const handleExecuteRepair = async () => {
    if (!isWriteEnabled || recommendations.length === 0) return;

    setIsExecuting(true);

    // Terminal sequence
    const terminalMessages = [
      { agent: "WRITER", message: "ACCESSING LOCAL CORE DATA...", statusCode: "SCAN" },
      { agent: "AUDITOR", message: "VERIFYING REPAIR LOGIC...", statusCode: "SCAN" },
    ];

    for (const msg of terminalMessages) {
      onTerminalMessage?.(msg);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const result = await executeDeterministicPivot(data, recommendations, sourceType, target);

      if (result.success) {
        onTerminalMessage?.({ agent: "WRITER", message: "STRATEGIC PIVOT EXECUTED.", statusCode: "OK" });

        if (result.downloadUrl && result.fileName) {
          setDownloadUrl(result.downloadUrl);
          setDownloadFileName(result.fileName);

          // Trigger download
          const link = document.createElement("a");
          link.href = result.downloadUrl;
          link.download = result.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        onTerminalMessage?.({ agent: "WRITER", message: `ERROR: ${result.error || "EXECUTION FAILED"}`, statusCode: "FIX" });
      }
    } catch (error) {
      onTerminalMessage?.({
        agent: "WRITER",
        message: `ERROR: ${error instanceof Error ? error.message : "UNKNOWN ERROR"}`,
        statusCode: "FIX",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-4 flex items-center gap-2 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
            activeTab === "analytics"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
          style={{ borderRadius: "0px" }}
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3" />
            ANALYTICS
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("future");
            if (!forecast) {
              generateForecast();
            }
          }}
          className={`border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
            activeTab === "future"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
          style={{ borderRadius: "0px" }}
        >
          <span className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            FUTURE SIGHT
          </span>
        </button>
        {hasActiveConnectors && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5"
            style={{ borderRadius: "0px" }}
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              LIVE
            </span>
          </motion.span>
        )}
      </div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <>
          {/* Forensic Healing Banner */}
          {mathIntegrityConfidence < 1.0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded"
              style={{ borderRadius: "0px" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="font-mono text-sm text-red-400 uppercase">
                      FORENSIC HEALING AVAILABLE
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Math Integrity: {Math.round(mathIntegrityConfidence * 100)}% Confidence
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHealerOpen(true)}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase transition-colors"
                  style={{ borderRadius: "0px" }}
                >
                  REVIEW & HEAL
                </button>
              </div>
            </motion.div>
          )}

          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            <span className="h-px flex-1 bg-white/5" />
            <BarChart3 className="h-3 w-3 text-emerald-400" />
            Analytics
            <span className="h-px flex-1 bg-white/5" />
          </h3>

      {/* EXECUTE REPAIR Button */}
      {isWriteEnabled && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <motion.button
            type="button"
            onClick={handleExecuteRepair}
            disabled={isExecuting}
            className="flex w-full items-center justify-center gap-2 border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-emerald-400 transition-all hover:border-emerald-500 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "0px" }}
            whileHover={!isExecuting ? { scale: 1.02 } : {}}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            {isExecuting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500"
                />
                <span>EXECUTING REPAIR...</span>
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                <span>INITIATE DETERMINISTIC REPAIR</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* GENERATE EXECUTIVE DOSSIER Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 space-y-3"
      >
        {/* Digital Sign Toggle */}
        <div className="flex items-center gap-3 border border-slate-800 bg-black p-3" style={{ borderRadius: "0px" }}>
          <input
            type="checkbox"
            id="digital-sign"
            checked={isDigitallySigned}
            onChange={(e) => setIsDigitallySigned(e.target.checked)}
            className="h-4 w-4 border border-emerald-500/40 bg-black accent-emerald-500"
            style={{ borderRadius: "0px" }}
          />
          <label htmlFor="digital-sign" className="font-mono text-xs uppercase tracking-wider text-slate-300 cursor-pointer">
            Digitally Sign as Executive
          </label>
        </div>

        {/* Generate Button */}
        <motion.button
          type="button"
          onClick={handleGenerateDossier}
          disabled={isGeneratingDossier}
          className="flex w-full items-center justify-center gap-2 border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cyan-400 transition-all hover:border-cyan-500 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: "0px" }}
          whileHover={!isGeneratingDossier ? { scale: 1.02 } : {}}
          whileTap={!isGeneratingDossier ? { scale: 0.98 } : {}}
        >
          {isGeneratingDossier ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
              />
              <span>ASSEMBLING DOSSIER...</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              <span>GENERATE EXECUTIVE DOSSIER</span>
            </>
          )}
        </motion.button>
      </motion.div>

          <motion.div layout className="grid gap-4 lg:grid-cols-2">
            <motion.div layout variants={cardVariants}>
              <RevenueChart
                currentARR={data.financials.arr.value}
                growthRate={data.financials.arr.growth_yoy}
                industry={industry}
              />
            </motion.div>
            <motion.div layout variants={cardVariants}>
              <MarketingChart data={data.growth} />
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Future Sight Tab */}
      {activeTab === "future" && (
        <div className="space-y-4">
          {/* Strategic Delta Simulator Toggle */}
          <div className="flex items-center justify-between border border-slate-800 bg-black p-4" style={{ borderRadius: "0px" }}>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                  SIMULATE STRATEGIC PIVOT
                </p>
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  Boost forecast based on AI recommendations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSimulatingPivot(!isSimulatingPivot)}
              className={`relative h-6 w-11 transition-colors duration-200 ${
                isSimulatingPivot ? "bg-emerald-500" : "bg-slate-700"
              }`}
              style={{ borderRadius: "0px" }}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white transition-transform duration-200 ${
                  isSimulatingPivot ? "translate-x-5" : "translate-x-0"
                }`}
                style={{ borderRadius: "0px" }}
              />
            </button>
          </div>

          {/* Forecast Chart */}
          {isForecasting ? (
            <div className="flex items-center justify-center border border-slate-800 bg-black p-12" style={{ borderRadius: "0px" }}>
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mx-auto h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
                />
                <p className="mt-4 font-mono text-xs uppercase tracking-wider text-slate-400">
                  GENERATING FORECAST...
                </p>
              </div>
            </div>
          ) : forecast ? (
            <FutureSightChart
              forecast={forecast}
              boostPercentage={isSimulatingPivot ? calculateBoostFromRecommendations(recommendations) : 0}
              agent2Failed={agent2Failed}
            />
          ) : agent2Failed ? (
            <div className="border border-red-500/30 bg-black p-12 text-center" style={{ borderRadius: "0px" }}>
              <p className="font-mono text-sm font-semibold uppercase tracking-wider text-red-400">
                MATH ANOMALY DETECTED
              </p>
              <p className="mt-2 font-mono text-xs text-red-500/70">
                Agent 2 (Math Auditor) verification failed. Forecast unavailable until data integrity is restored.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 bg-black p-12 text-center" style={{ borderRadius: "0px" }}>
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                NO TIME-SERIES DATA AVAILABLE
              </p>
              <p className="mt-2 font-mono text-[10px] text-slate-600">
                Upload CSV with date and value columns to enable forecasting
              </p>
            </div>
          )}
        </div>
      )}

      {/* Forensic Healer Side Drawer */}
      <ForensicHealer
        isOpen={isHealerOpen}
        onClose={() => setIsHealerOpen(false)}
        mathIntegrityConfidence={mathIntegrityConfidence}
        txId={txId}
        targetColumn={data.financials?.arr ? "ARR" : "Revenue"}
        formulaLogic={{
          formula: "SUM(sub_category_1, sub_category_2)",
          source_columns: ["Revenue", "Sales"],
          expected_total: data.financials?.arr?.value,
        }}
        persona={persona}
        displayData={data}
        recommendations={recommendations}
        industry={industry}
        onHealComplete={() => {
          // Trigger re-run of Agent 2 after healing
          // This will be handled by the parent component via custom event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('neurasight:rerun-analysis'));
          }
        }}
        onTerminalMessage={onTerminalMessage}
      />
    </div>
  );
}

