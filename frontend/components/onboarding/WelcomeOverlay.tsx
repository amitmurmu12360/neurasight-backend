"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "@/components/TypewriterText";
import { generateMockDashboardState } from "@/lib/mockGenerator";
import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
interface WelcomeOverlayProps {
  onEnterDemo: (mockData: DashboardState) => void;
  onConnectBusiness: () => void;
  isVisible: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = "neurasight_welcome_dismissed";

// =============================================================================
// COMPONENT
// =============================================================================
export default function WelcomeOverlay({
  onEnterDemo,
  onConnectBusiness,
  isVisible,
}: WelcomeOverlayProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEnterDemo = () => {
    const mockData = generateMockDashboardState();
    onEnterDemo(mockData);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleConnectBusiness = () => {
    onConnectBusiness();
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!isMounted || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Blurred Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />

          {/* Welcome Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl p-8 shadow-2xl"
            >
              {/* Subtle Grid Pattern */}
              <div
                className="absolute inset-0 rounded-2xl opacity-5"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Content */}
              <div className="relative z-10 space-y-8">
                {/* Header */}
                <div className="space-y-4 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10"
                  >
                    <svg
                      className="h-8 w-8 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-mono text-3xl font-bold uppercase tracking-[0.15em] text-white sm:text-4xl"
                  >
                    NeuraSight
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="min-h-[3rem]"
                  >
                    <TypewriterText
                      phrases={[
                        "Welcome, Commander. NeuraSight Swarm is standing by.",
                        "Welcome, Commander. Intelligence systems online.",
                        "Welcome, Commander. Ready for strategic analysis.",
                      ]}
                      className="font-mono text-lg text-emerald-400 sm:text-xl"
                      typingSpeed={80}
                      deletingSpeed={40}
                      pauseDuration={3000}
                    />
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-4 sm:flex-row sm:justify-center"
                >
                  {/* Enter Demo Mode Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnterDemo}
                    className="group relative overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-8 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400 transition-all hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Enter Demo Mode
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.button>

                  {/* Connect Business Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnectBusiness}
                    className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Connect My Business
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.button>
                </motion.div>

                {/* Footer Note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-center font-mono text-xs text-slate-500"
                >
                  Choose your path to begin analysis
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Check if welcome overlay should be shown
 */
export function shouldShowWelcome(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

