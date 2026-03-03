"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Database, Zap, Brain, Activity } from "lucide-react";
import LiveDashboard from "./LiveDashboard";
import type { DashboardState } from "@/types/dashboard";
import { generateMockDashboardState } from "@/lib/mockGenerator";

interface SovereignEmptyStateProps {
  onInitialize: () => void;
}

// Generate synthetic data for "ghost mode" preview (realistic random values)
const SYNTHETIC_DATA = generateMockDashboardState();

// Neural Grid Canvas Component
function NeuralGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 40;
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);

      // Draw grid lines
      ctx.strokeStyle = "rgba(16, 185, 129, 0.1)";
      ctx.lineWidth = 1;

      for (let i = 0; i <= cols; i++) {
        const x = i * gridSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let i = 0; i <= rows; i++) {
        const y = i * gridSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw interactive nodes near mouse
      const mouse = mouseRef.current;
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * gridSize;
          const y = j * gridSize;
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;

          if (dist < maxDist) {
            const intensity = 1 - dist / maxDist;
            const alpha = intensity * 0.3;

            // Draw connection line
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw node
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 * intensity, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className || ""}`}
      style={{ pointerEvents: "none" }}
    />
  );
}

export default function SovereignEmptyState({
  onInitialize,
}: SovereignEmptyStateProps) {
  return (
    <div className="relative min-h-[600px] w-full overflow-hidden rounded-2xl">
      {/* Neural Grid Background */}
      <NeuralGrid className="z-0" />

      {/* Blurred Synthetic Dashboard Preview - Ghost Mode */}
      <div className="relative z-10 opacity-40 blur-sm">
        <LiveDashboard data={SYNTHETIC_DATA} persona="CEO" />
      </div>

      {/* Scanline Overlay (No Gradient) */}
      <motion.div
        className="absolute inset-0 z-20"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.03) 2px, rgba(16, 185, 129, 0.03) 4px)",
        }}
      />

      {/* Glassmorphism Portal Card */}
      <div className="absolute inset-0 z-30 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          {/* Glassmorphism Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-8 shadow-2xl">
            {/* Subtle grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10"
              >
                <Brain className="h-10 w-10 text-emerald-400" />
              </motion.div>

              {/* Title */}
              <h2 className="mb-3 font-mono text-2xl font-bold uppercase tracking-wider text-white">
                AWAITING DATA INGESTION FOR SOVEREIGN ANALYSIS. SYSTEM STANDBY.
              </h2>

              {/* Description */}
              <p className="mb-8 font-mono text-sm text-slate-400">
                Initialize the 11-agent intelligence swarm to unlock deterministic strategic execution.
              </p>

              {/* Initialize Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onInitialize}
                className="group relative mx-auto flex items-center gap-3 overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400 shadow-lg shadow-emerald-500/20 transition-all hover:border-emerald-500 hover:bg-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {/* Pulse Glow Effect (No Gradient) */}
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-500/50"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    boxShadow: [
                      "0 0 10px rgba(16, 185, 129, 0.2)",
                      "0 0 20px rgba(16, 185, 129, 0.4)",
                      "0 0 10px rgba(16, 185, 129, 0.2)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <Zap className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Initialize Data Swarm</span>

                {/* Pulse Ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border border-emerald-500/50"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.button>

              {/* Subtle Stats */}
              <div className="mt-8 flex items-center justify-center gap-6 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="h-3 w-3" />
                  <span>11 Agents Ready</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Database className="h-3 w-3" />
                  <span>Multi-Source</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="h-3 w-3" />
                  <span>Real-Time</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

