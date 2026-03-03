/**
 * MarketBattleCard - Competitive Benchmarking Component
 * ======================================================
 * Displays side-by-side comparison of current metrics vs. Industry Benchmarks.
 * Uses "Vs. Market" layout with our data (Emerald) vs. Market data (Cyan Ghost).
 */

"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Trophy } from "lucide-react";
import type { DashboardState } from "@/types/dashboard";

interface MarketBenchmark {
  metric: string;
  ourValue: number | string;
  marketAvg: number | string;
  topDecile: number | string;
  leaderboardPosition?: string;
  strategicAdvantageScore?: number;
  unit: string;
  category: "financials" | "growth" | "efficiency";
}

interface MarketBattleCardProps {
  currentData: DashboardState;
  marketData: {
    market_avg: Record<string, number>;
    top_decile: Record<string, number>;
    strategic_advantage_score: number;
    leaderboard_position?: string;
  };
  isLoading?: boolean;
}

export default function MarketBattleCard({
  currentData,
  marketData,
  isLoading = false,
}: MarketBattleCardProps) {
  // Build comparison metrics from current data vs market benchmarks
  const buildMetrics = (): MarketBenchmark[] => {
    const arr = currentData?.financials?.arr?.value || 24.3;
    const nrr = currentData?.financials?.nrr?.value || 132;
    const burnMultiple = currentData?.financials?.burn_multiple?.value || 0.9;
    const mqls = currentData?.growth?.mqls?.value || 1470;
    const cac = currentData?.growth?.cac?.value || 246;

    return [
      {
        metric: "ARR",
        ourValue: arr,
        marketAvg: marketData.market_avg.arr || 18.5,
        topDecile: marketData.top_decile.arr || 30.0,
        unit: "M",
        category: "financials",
      },
      {
        metric: "NRR",
        ourValue: nrr,
        marketAvg: marketData.market_avg.nrr || 110,
        topDecile: marketData.top_decile.nrr || 140,
        unit: "%",
        category: "efficiency",
      },
      {
        metric: "Burn Multiple",
        ourValue: burnMultiple,
        marketAvg: marketData.market_avg.burn_multiple || 1.5,
        topDecile: marketData.top_decile.burn_multiple || 0.8,
        unit: "x",
        category: "efficiency",
      },
      {
        metric: "MQLs",
        ourValue: mqls,
        marketAvg: marketData.market_avg.mqls || 1200,
        topDecile: marketData.top_decile.mqls || 2500,
        unit: "",
        category: "growth",
      },
      {
        metric: "CAC",
        ourValue: cac,
        marketAvg: marketData.market_avg.cac || 280,
        topDecile: marketData.top_decile.cac || 180,
        unit: "$",
        category: "growth",
      },
    ];
  };

  const metrics = buildMetrics();
  const advantageScore = marketData.strategic_advantage_score || 0;
  const position = marketData.leaderboard_position || "Top 25%";

  const formatValue = (value: number | string, unit: string): string => {
    if (typeof value === "string") return value;
    if (unit === "M") return `$${value.toFixed(1)}M`;
    if (unit === "%") return `${value.toFixed(1)}%`;
    if (unit === "x") return `${value.toFixed(1)}x`;
    if (unit === "$") return `$${value.toFixed(0)}`;
    return value.toLocaleString();
  };

  const getPerformanceIndicator = (
    ourValue: number,
    marketAvg: number,
    higherIsBetter: boolean = true
  ) => {
    const diff = ourValue - marketAvg;
    const percentDiff = (diff / marketAvg) * 100;
    
    if (higherIsBetter) {
      return diff > 0 ? (
        <TrendingUp className="h-4 w-4 text-emerald-400" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-400" />
      );
    } else {
      // For burn multiple and CAC, lower is better
      return diff < 0 ? (
        <TrendingUp className="h-4 w-4 text-emerald-400" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-400" />
      );
    }
  };

  const getPerformanceLabel = (
    ourValue: number,
    marketAvg: number,
    higherIsBetter: boolean = true
  ): string => {
    const diff = ourValue - marketAvg;
    const percentDiff = Math.abs((diff / marketAvg) * 100);
    
    if (higherIsBetter) {
      return diff > 0 
        ? `+${percentDiff.toFixed(1)}% above market` 
        : `${percentDiff.toFixed(1)}% below market`;
    } else {
      return diff < 0 
        ? `${percentDiff.toFixed(1)}% better than market` 
        : `${percentDiff.toFixed(1)}% above market`;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 shadow-xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="h-8 w-8 animate-pulse text-cyan-400" />
            <span className="text-sm text-slate-400">Loading market benchmarks...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 p-6 shadow-xl"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Market Battle Card</h3>
            <p className="text-xs text-slate-400">Vs. B2B SaaS Series B Peers</p>
          </div>
        </div>
        
        {/* Leaderboard Position */}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">{position}</span>
        </div>
      </div>

      {/* Strategic Advantage Score */}
      <div className="mb-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Strategic Advantage Score</span>
          <span className={`text-2xl font-bold ${
            advantageScore >= 75 ? 'text-emerald-400' : 
            advantageScore >= 50 ? 'text-amber-400' : 
            'text-red-400'
          }`}>
            {advantageScore.toFixed(1)}/100
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${advantageScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${
              advantageScore >= 75 ? 'bg-emerald-500' : 
              advantageScore >= 50 ? 'bg-amber-500' : 
              'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="space-y-4">
        {metrics.map((metric, idx) => {
          const higherIsBetter = metric.metric !== "Burn Multiple" && metric.metric !== "CAC";
          const ourNum = typeof metric.ourValue === "number" ? metric.ourValue : 0;
          const marketNum = typeof metric.marketAvg === "number" ? metric.marketAvg : 0;

          return (
            <motion.div
              key={metric.metric}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">{metric.metric}</span>
                {getPerformanceIndicator(ourNum, marketNum, higherIsBetter)}
              </div>

              {/* Vs. Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Our Data (Emerald) */}
                <div className="rounded-lg border border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 to-slate-900/80 p-3">
                  <div className="mb-1 text-xs text-emerald-400/70">Our Performance</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatValue(ourNum, metric.unit)}
                  </div>
                </div>

                {/* Market Data (Cyan Ghost) */}
                <motion.div
                  animate={{
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-lg border border-cyan-400/60 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-slate-950/60 p-3"
                >
                  <div className="mb-1 text-xs text-cyan-400/70">Market Average</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {formatValue(marketNum, metric.unit)}
                  </div>
                </motion.div>
              </div>

              {/* Performance Label */}
              <div className="mt-2 text-xs text-slate-400">
                {getPerformanceLabel(ourNum, marketNum, higherIsBetter)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

