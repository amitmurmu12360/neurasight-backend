"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircle, ArrowUpRight, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import type { Persona } from "./ExecutionLog";

type Role = "user" | "ai";

interface ChatMessage {
  id: number;
  role: Role;
  content: string;
  badges?: string[]; // Forensic badges: [CRITICAL], [STRATEGIC], [ANOMALY]
  metrics?: { name: string; value: string | number }[]; // Extracted metrics for widgets
}

interface InsightPanelProps {
  persona: Persona;
  dashboardState?: any; // Current dashboard state for forensic context
  agent2Status?: string; // Agent 2 Math Audit status (PASS/FAIL)
}

const panelVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.9,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const SUGGESTED_PROMPTS = [
  "Analyze trends in this view",
  "Where is the biggest upside for next quarter?",
  "What risks should I take to the board?",
];

// Extract forensic badges and metrics from AI response
function parseInsight(content: string): { badges: string[]; metrics: { name: string; value: string | number }[]; cleanContent: string } {
  const badges: string[] = [];
  const metrics: { name: string; value: string | number }[] = [];
  
  // Extract badges (e.g., [CRITICAL], [STRATEGIC], [ANOMALY])
  const badgePattern = /\[(CRITICAL|STRATEGIC|ANOMALY|WARNING|OPPORTUNITY)\]/gi;
  const badgeMatches = content.match(badgePattern);
  if (badgeMatches) {
    badges.push(...badgeMatches.map(b => b.toUpperCase()));
  }
  
  // Extract metrics (e.g., "MQLs: 1,240", "ARR: $24.3M")
  const metricPatterns = [
    /(MQLs?|ARR|NRR|Burn|Churn|CAC|LTV):\s*([\d,\.]+[MK%]?)/gi,
    /(\$[\d,\.]+[MK]?)/g,
    /(\d+\.\d+%)/g,
  ];
  
  metricPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2]) {
        metrics.push({ name: match[1], value: match[2] });
      } else if (match[1]) {
        metrics.push({ name: "Metric", value: match[1] });
      }
    }
  });
  
  // Clean content (remove badge markers for display)
  const cleanContent = content.replace(badgePattern, '').trim();
  
  return { badges, metrics, cleanContent };
}

export default function InsightPanel({ persona, dashboardState, agent2Status }: InsightPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const streamRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = input.trim().length > 0 && !isThinking && !isStreaming;

  const handleSend = async (prompt?: string) => {
    const content = (prompt ?? input).trim();
    if (!content || isThinking || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
    setStreamingText("");

    let fullResponse: string;

    try {
      // SOVEREIGN BRAIN 3.0: Chat Forensic Awareness - Inject dashboard state and Agent 2 status
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: content, 
          persona,
          dashboard_state: dashboardState,
          agent2_status: agent2Status,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { response?: string };
      fullResponse =
        data.response ??
        "NeuraSight Brain responded, but no textual content was provided.";
    } catch (error) {
      console.error(error);
      fullResponse =
        "NeuraSight Brain is temporarily unavailable. Please try again.";
    } finally {
      setIsThinking(false);
    }

    // Parse insight for badges and metrics
    const parsed = parseInsight(fullResponse);
    
    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "ai",
      content: parsed.cleanContent,
      badges: parsed.badges,
      metrics: parsed.metrics,
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isThinking, streamingText]);

  const personaLabel = useMemo(() => {
    switch (persona) {
      case "CEO":
        return "CEO · Strategic";
      case "CMO":
        return "CMO · Growth";
      case "VP Sales":
        return "VP Sales · Pipeline";
      default:
        return persona;
    }
  }, [persona]);

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center border border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.7)] backdrop-blur-md transition hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 md:bottom-8 md:right-8"
        style={{ borderRadius: "0px" }}
        aria-label={isOpen ? "Close NeuraSight insights" : "Open NeuraSight insights"}
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 z-40 w-[380px] max-w-[90vw] md:bottom-24 md:right-8 md:w-[420px]"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Card-within-Card: Outer container */}
            <div className="border border-emerald-500/30 bg-black p-[2px]" style={{ borderRadius: "0px" }}>
              {/* Inner card */}
              <div className="flex h-[480px] flex-col overflow-hidden bg-black border border-emerald-500/20" style={{ borderRadius: "0px" }}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/20 px-4 py-3 bg-black">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center border border-emerald-500/40 bg-emerald-500/10 text-emerald-300" style={{ borderRadius: "0px" }}>
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                        NEURA · INSIGHTS
                      </span>
                      <span className="text-[10px] font-mono font-medium uppercase tracking-[0.16em] text-emerald-400">
                        {personaLabel}
                      </span>
                    </div>
                  </div>
                  <span className="h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" style={{ borderRadius: "0px" }} />
                </div>

                {/* Messages area */}
                <div
                  ref={listRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-3 bg-black"
                >
                  {messages.length === 0 && !isThinking && !isStreaming && (
                    <div className="mb-2 space-y-3 text-[11px] text-white/60 font-mono">
                      <p>
                        Ask NeuraSight to interpret what you&apos;re seeing in this
                        dashboard. It will respond in the voice of{" "}
                        <span className="font-semibold text-emerald-400">
                          {personaLabel}
                        </span>
                        .
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleSend(prompt)}
                            className="border border-emerald-500/30 bg-black px-3 py-1.5 text-[11px] text-emerald-400 font-mono uppercase tracking-wider transition hover:border-emerald-500 hover:bg-emerald-500/10"
                            style={{ borderRadius: "0px" }}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((message) => {
                      const parsed = message.role === "ai" ? parseInsight(message.content) : null;
                      return (
                        <motion.div
                          key={message.id}
                          variants={messageVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {/* Card-within-Card: Message module */}
                          <div className={`max-w-[85%] border ${
                            message.role === "user"
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : "border-emerald-500/20 bg-black"
                          } p-[1px]`} style={{ borderRadius: "0px" }}>
                            <div className={`px-3 py-2 ${
                              message.role === "user"
                                ? "bg-emerald-500/5 text-emerald-300"
                                : "bg-black text-white"
                            }`}>
                              {/* Forensic Badges */}
                              {message.badges && message.badges.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {message.badges.map((badge, idx) => {
                                    const badgeColor = badge.includes("CRITICAL") || badge.includes("ANOMALY")
                                      ? "border-red-500/60 text-red-400 bg-red-500/10"
                                      : badge.includes("STRATEGIC") || badge.includes("OPPORTUNITY")
                                      ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                                      : "border-cyan-500/60 text-cyan-400 bg-cyan-500/10";
                                    return (
                                      <span
                                        key={idx}
                                        className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border ${badgeColor}`}
                                        style={{ borderRadius: "0px" }}
                                      >
                                        {badge}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Content */}
                              <div className="text-[11px] leading-relaxed font-mono text-white/90">
                                {message.content}
                              </div>
                              
                              {/* Metric Widgets */}
                              {message.metrics && message.metrics.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap gap-2">
                                  {message.metrics.slice(0, 3).map((metric, idx) => (
                                    <div
                                      key={idx}
                                      className="border border-emerald-500/30 bg-black px-2 py-1"
                                      style={{ borderRadius: "0px" }}
                                    >
                                      <div className="text-[9px] font-mono uppercase text-emerald-400/60 tracking-wider">
                                        {metric.name}
                                      </div>
                                      <div className="text-[11px] font-mono font-bold text-emerald-400">
                                        {metric.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {isThinking && (
                      <motion.div
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex justify-start"
                      >
                        <div className="flex items-center gap-2 border border-emerald-500/20 bg-black px-3 py-2 text-[11px] text-white/60 font-mono" style={{ borderRadius: "0px" }}>
                          <span>PROCESSING</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="h-1.5 w-1.5 bg-emerald-400"
                                style={{ borderRadius: "0px" }}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {isStreaming && (
                      <motion.div
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] border border-emerald-500/20 bg-black px-3 py-2 text-[11px] leading-relaxed text-white font-mono" style={{ borderRadius: "0px" }}>
                          {streamingText}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input form */}
                <form
                  className="border-t border-emerald-500/20 bg-black px-3 py-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (canSend) {
                      handleSend();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 border border-emerald-500/30 bg-black px-3 py-1.5" style={{ borderRadius: "0px" }}>
                    <input
                      type="text"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="ASK NEURA..."
                      className="flex-1 bg-transparent text-[11px] text-white font-mono uppercase tracking-wider placeholder:text-white/30 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!canSend}
                      className="inline-flex h-6 w-6 items-center justify-center border border-emerald-500 bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: "0px" }}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
