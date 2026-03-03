/**
 * Audit Trail - Executive Audit Log
 * ==================================
 * High-end terminal-style audit log for tracking strategic operations.
 * Pure OLED Black (#000000) background with typewriter effect.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Zap, Shield, TrendingUp } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  industry: string;
  strategicImpact: string;
  txId: string;
  status?: "success" | "warning" | "error";
}

interface AuditTrailProps {
  logs?: AuditLogEntry[];
  maxLogs?: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AuditTrail({ logs = [], maxLogs = 50 }: AuditTrailProps) {
  const [displayedLogs, setDisplayedLogs] = useState<AuditLogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect: Add logs one by one
  useEffect(() => {
    if (logs.length === 0) return;

    const newLogs = logs.slice(displayedLogs.length);
    if (newLogs.length === 0) return;

    // Add logs with staggered delay for typewriter effect
    newLogs.forEach((log, index) => {
      setTimeout(() => {
        setDisplayedLogs((prev) => {
          const updated = [...prev, log];
          // Keep only the last maxLogs entries
          return updated.slice(-maxLogs);
        });
      }, index * 150); // 150ms delay between each log
    });
  }, [logs, displayedLogs.length, maxLogs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Get status icon and color
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <TrendingUp className="h-3 w-3 text-emerald-400" />;
      case "warning":
        return <Shield className="h-3 w-3 text-amber-400" />;
      case "error":
        return <Zap className="h-3 w-3 text-red-400" />;
      default:
        return <FileText className="h-3 w-3 text-slate-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="relative rounded-xl border border-white/5 bg-black/60 backdrop-blur-md p-4 shadow-xl shadow-black/40">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Executive Audit Log
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500">
          {displayedLogs.length} {displayedLogs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Log Table */}
      <div
        ref={containerRef}
        className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-black scrollbar-thumb-emerald-500/30"
      >
        {displayedLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="font-mono text-xs text-slate-600">
              No audit entries yet. Strategic operations will appear here.
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {displayedLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="grid grid-cols-[140px_1fr_100px_1fr_120px] gap-3 rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-mono text-xs transition hover:border-emerald-500/20 hover:bg-black/60"
                >
                  {/* Timestamp */}
                  <span className="text-slate-500">
                    {log.timestamp.toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>

                  {/* Action */}
                  <span className={`${getStatusColor(log.status)} flex items-center gap-1.5`}>
                    {getStatusIcon(log.status)}
                    {log.action}
                  </span>

                  {/* Industry */}
                  <span className="text-slate-400 uppercase">{log.industry}</span>

                  {/* Strategic Impact */}
                  <span className="text-slate-300">{log.strategicImpact}</span>

                  {/* TX-ID */}
                  <span className="text-emerald-400 font-semibold">{log.txId}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

