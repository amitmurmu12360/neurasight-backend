"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import type { SovereignSession } from "@/lib/sovereignVault";
import { getSessionHistory, getAgenticMemory } from "@/lib/sovereignVault";

interface SovereignHistoryProps {
  onSessionSelect?: (session: SovereignSession) => void;
}

export default function SovereignHistory({
  onSessionSelect,
}: SovereignHistoryProps) {
  const [sessions, setSessions] = useState<SovereignSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const history = await getSessionHistory(5);
    
    // SOVEREIGN BRAIN 3.0: Unique Audit Deduplication by tx_id
    // Filter out duplicate entries with the same tx_id
    const uniqueSessions = history.reduce((acc: SovereignSession[], session) => {
      const exists = acc.find(s => s.tx_id === session.tx_id);
      if (!exists) {
        acc.push(session);
      }
      return acc;
    }, []);
    
    setSessions(uniqueSessions);
    setIsLoading(false);
  };

  const handleSessionClick = async (session: SovereignSession) => {
    setSelectedSession(session.id);
    
    // Load agentic memory for this session
    const memory = await getAgenticMemory(session.id);
    
    if (onSessionSelect) {
      onSessionSelect(session);
    }

    // Log the recall action
    console.log(`[VAULT] Recalling context from ${session.tx_id}`, memory);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full w-64 border-r border-slate-800 bg-black p-4">
      {/* Header */}
      <div className="mb-4 border-b border-slate-800 pb-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
          SOVEREIGN HISTORY
        </h3>
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          Last 5 Audits
        </p>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-mono text-[10px] text-slate-500">
            No audit history
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.button
                key={session.id}
                type="button"
                onClick={() => handleSessionClick(session)}
                className={`w-full border p-3 text-left transition-all ${
                  selectedSession === session.id
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-slate-800 bg-black hover:border-slate-700"
                }`}
                style={{ borderRadius: "0px" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* TX-ID */}
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      selectedSession === session.id
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    {session.tx_id}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span className="font-mono text-[9px] text-slate-500">
                    {formatTimestamp(session.created_at)}
                  </span>
                </div>

                {/* Health Score & Industry */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-slate-400">
                    Health: {session.health_score}%
                  </span>
                  <span className="font-mono text-[9px] uppercase text-cyan-400">
                    {session.industry}
                  </span>
                </div>

                {/* Chevron Indicator */}
                {selectedSession === session.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center gap-1 text-emerald-400"
                  >
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-mono text-[9px] uppercase">
                      Context Loaded
                    </span>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

