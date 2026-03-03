"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalMessage {
  id: string;
  timestamp: Date;
  agent: string;
  message: string;
  type: "system" | "agent" | "sentinel" | "writer";
  statusCode: "OK" | "SCAN" | "FIX" | "DEBATE";
  displayText: string; // For typewriter effect
  isTyping: boolean;
}

interface AgenticPulseTerminalProps {
  isActive?: boolean;
  isIngesting?: boolean;
  activeConnectors?: string[];
  onMessage?: (message: TerminalMessage) => void;
}

// Custom hook to prevent hydration errors
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  return hasMounted;
}

const INITIAL_MESSAGES: Omit<TerminalMessage, "displayText" | "isTyping">[] = [
  {
    id: "1",
    timestamp: new Date(),
    agent: "SYSTEM",
    message: "ALL 12 AGENTIC CORES SYNCHRONIZED. READY FOR INGESTION.",
    type: "system",
    statusCode: "OK",
  },
  {
    id: "2",
    timestamp: new Date(),
    agent: "SYSTEM",
    message: "Booting SovereignContext...",
    type: "system",
    statusCode: "OK",
  },
  {
    id: "3",
    timestamp: new Date(),
    agent: "AGENT_0",
    message: "Truth Established.",
    type: "agent",
    statusCode: "OK",
  },
  {
    id: "4",
    timestamp: new Date(),
    agent: "AGENT_2",
    message: "Math Integrity: Verified.",
    type: "agent",
    statusCode: "SCAN",
  },
  {
    id: "5",
    timestamp: new Date(),
    agent: "SENTINEL",
    message: "Anomaly Scan Active.",
    type: "sentinel",
    statusCode: "SCAN",
  },
];

export default function AgenticPulseTerminal({ isActive = true, isIngesting = false, activeConnectors = [], onMessage }: AgenticPulseTerminalProps) {
  const hasMounted = useHasMounted();
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const ingestionMessagesRef = useRef<string[]>([]);

  // Typewriter effect function
  const typewriterEffect = (msg: Omit<TerminalMessage, "displayText" | "isTyping">, delay: number = 0) => {
    const timeoutId = setTimeout(() => {
      const newMessage: TerminalMessage = {
        ...msg,
        displayText: "",
        isTyping: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate typing
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < msg.message.length) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? { ...m, displayText: msg.message.slice(0, charIndex + 1), isTyping: true }
                : m
            )
          );
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isTyping: false } : m))
          );
        }
      }, 30);

      typingTimeoutsRef.current.set(msg.id, typingInterval as any);
    }, delay);

    typingTimeoutsRef.current.set(`delay-${msg.id}`, timeoutId);
  };

  // Expose addMessage function globally for external use
  useEffect(() => {
    (window as any).__neurasight_addTerminalMessage = (msg: { agent: string; message: string; type?: TerminalMessage["type"]; statusCode: TerminalMessage["statusCode"] }) => {
      const newMsg: Omit<TerminalMessage, "displayText" | "isTyping"> = {
        id: `external-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        agent: msg.agent,
        message: msg.message,
        type: msg.type || "system",
        statusCode: msg.statusCode,
      };
      typewriterEffect(newMsg, 0);
    };
    return () => {
      delete (window as any).__neurasight_addTerminalMessage;
    };
  }, []);

  // Initialize messages with typewriter effect after mount
  useEffect(() => {
    if (!hasMounted) return;

    const initializeMessages = () => {
      INITIAL_MESSAGES.forEach((msg, index) => {
        setTimeout(() => {
          typewriterEffect(msg, 0);
        }, index * 500);
      });
    };

    initializeMessages();
  }, [hasMounted]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && hasMounted) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, hasMounted]);

  // Ingestion Ceremony: Fast-scrolling forensic logs during ingestion
  useEffect(() => {
    if (!isIngesting || !hasMounted) return;

    const ingestionMessages: Array<Omit<TerminalMessage, "displayText" | "isTyping" | "id" | "timestamp">> = [
      { agent: "SYSTEM", message: "BOOTING SOVEREIGN_CONTEXT...", type: "system", statusCode: "OK" },
      { agent: "VAULT", message: "SECURING SESSION NS-9921...", type: "system", statusCode: "OK" },
      { agent: "GOVERNANCE", message: "SECURITY LEVEL: SOVEREIGN SHIELD (READ-ONLY).", type: "system", statusCode: "SCAN" },
      { agent: "AGENT_2", message: "AUDITING MATHEMATICAL INTEGRITY (AGENT 2)...", type: "agent", statusCode: "SCAN" },
      { agent: "SYSTEM", message: "52,104 ROWS VERIFIED.", type: "system", statusCode: "OK" },
      { agent: "SENTINEL", message: "ANOMALY DETECTED IN MARGIN_STRUCTURE.", type: "sentinel", statusCode: "SCAN" },
      { agent: "STRATEGIST", message: "RECALLING CONTEXT FROM JAN 15... NO DELTA DETECTED.", type: "agent", statusCode: "OK" },
      { agent: "SYSTEM", message: "DETERMINISTIC TRUTH ESTABLISHED.", type: "system", statusCode: "OK" },
    ];

    // Clear previous messages and add ingestion messages rapidly
    setMessages([]);
    ingestionMessages.forEach((msg, index) => {
      setTimeout(() => {
        const newMsg: Omit<TerminalMessage, "displayText" | "isTyping"> = {
          ...msg,
          id: `ingestion-${index}-${Date.now()}`,
          timestamp: new Date(),
        };
        typewriterEffect(newMsg, 0);
      }, index * 400); // Fast interval: 400ms between messages
    });

    // Clear ingestion messages after ceremony completes
    return () => {
      ingestionMessagesRef.current = [];
    };
  }, [isIngesting, hasMounted]);

  // Simulate periodic diagnostic messages
  useEffect(() => {
    if (!isActive || !hasMounted || isIngesting) return; // Don't show periodic messages during ingestion

    const interval = setInterval(() => {
      const diagnosticMessages: Array<Omit<TerminalMessage, "displayText" | "isTyping" | "id" | "timestamp">> = [
        { agent: "SYSTEM", message: "SovereignContext: Operational.", type: "system", statusCode: "OK" },
        { agent: "AGENT_0", message: "Validation: In Progress.", type: "agent", statusCode: "SCAN" },
        { agent: "AGENT_2", message: "DETECTING OUTLIERS VIA IQR METHOD...", type: "agent", statusCode: "SCAN" },
        { agent: "AGENT_2", message: "MATH VERIFIED (99.98% CONFIDENCE).", type: "agent", statusCode: "OK" },
        { agent: "SENTINEL", message: "Threat Assessment: Clear.", type: "sentinel", statusCode: "SCAN" },
        { agent: "GOVERNANCE", message: "SECURITY LEVEL: STANDARD. ALL REPORTS UNLOCKED.", type: "system", statusCode: "OK" },
        { agent: "SYSTEM", message: "Data Pipeline: Synchronized.", type: "system", statusCode: "OK" },
        { agent: "AGENT_3", message: "Policy Violation: Detected.", type: "agent", statusCode: "FIX" },
        { agent: "AGENT_11", message: "Strategic Conflict: Resolved.", type: "agent", statusCode: "DEBATE" },
      ];

      const randomMessage = diagnosticMessages[Math.floor(Math.random() * diagnosticMessages.length)];
      const newMsg: Omit<TerminalMessage, "displayText" | "isTyping"> = {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...randomMessage,
      };

      // Start typewriter effect for new message
      setTimeout(() => {
        typewriterEffect(newMsg, 0);
      }, 100);
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive, hasMounted]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, []);

  const getStatusColor = (statusCode: TerminalMessage["statusCode"]) => {
    switch (statusCode) {
      case "OK":
        return "text-emerald-400";
      case "SCAN":
        return "text-cyan-400";
      case "FIX":
        return "text-amber-400";
      case "DEBATE":
        return "text-purple-400";
      default:
        return "text-slate-400";
    }
  };

  const getAgentColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "system":
        return "text-slate-400";
      case "agent":
        return "text-emerald-400";
      case "sentinel":
        return "text-cyan-400";
      case "writer":
        return "text-emerald-400"; // Emerald pulse for successful writes
      default:
        return "text-slate-400";
    }
  };

  // Accept external messages via prop
  useEffect(() => {
    if (onMessage) {
      // This will be called from parent when a message is added
      // The parent should use a ref or callback to add messages
    }
  }, [onMessage]);

  if (!isActive || !hasMounted) return null;

  return (
    <div
      className="fixed bottom-0 left-0 z-40 w-full max-w-md border-t border-r border-slate-800 backdrop-blur-md"
      style={{
        borderRadius: "0px",
        maxHeight: "300px",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-black/60 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            AGENTIC PULSE TERMINAL
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-600">
          {messages.length} LOGS
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        className="overflow-y-auto px-4 py-3"
        style={{
          maxHeight: "250px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(16, 185, 129, 0.3) #000000",
        }}
      >
        <div className="space-y-1">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 font-mono text-[11px] leading-relaxed"
              >
                {/* Timestamp */}
                {hasMounted && (
                  <span className="text-slate-600" suppressHydrationWarning>
                    {msg.timestamp.toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}

                {/* Status Code */}
                <span className={`font-semibold ${getStatusColor(msg.statusCode)}`}>
                  [{msg.statusCode}]
                </span>

                {/* Agent Name */}
                {msg.type === "writer" && msg.statusCode === "OK" ? (
                  <motion.span
                    className={`font-semibold ${getAgentColor(msg.type)}`}
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.6)",
                        "0 0 20px rgba(16, 185, 129, 1), 0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.4)",
                        "0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.6)",
                      ],
                      opacity: [1, 0.9, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {msg.agent}
                  </motion.span>
                ) : (
                  <span className={`font-semibold ${getAgentColor(msg.type)}`}>
                    {msg.agent}
                  </span>
                )}

                {/* Message with Typewriter Effect */}
                <span className="text-slate-300">
                  {msg.displayText}
                  {msg.isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-0.5"
                    >
                      |
                    </motion.span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cursor Blink Effect */}
      <div className="flex items-center gap-2 border-t border-slate-800 bg-black/60 px-4 py-1.5 backdrop-blur-sm">
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="h-3 w-0.5 bg-emerald-400"
        />
        <span className="font-mono text-[10px] text-slate-500">
          SYSTEM STANDBY
        </span>
      </div>
    </div>
  );
}
