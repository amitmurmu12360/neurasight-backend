"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, FileText, Loader2 } from "lucide-react";

interface CommandPortalProps {
  onConnectSheets: () => void;
  onUploadCSV: () => void;
  isLoading?: boolean;
}

export default function CommandPortal({
  onConnectSheets,
  onUploadCSV,
  isLoading = false,
}: CommandPortalProps) {
  const [activeNode, setActiveNode] = useState<"alpha" | "beta" | null>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);

  // Scanline animation effect
  useEffect(() => {
    if (!scanlineRef.current) return;
    
    const interval = setInterval(() => {
      const scanline = scanlineRef.current;
      if (scanline) {
        scanline.style.opacity = "1";
        scanline.style.transform = "translateY(0)";
        
        setTimeout(() => {
          scanline.style.opacity = "0";
          scanline.style.transform = "translateY(100%)";
        }, 300);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center gap-6">
      {/* Alpha Node: SYNC LIVE WORKSPACE */}
      <motion.button
        type="button"
        onClick={() => {
          setActiveNode("alpha");
          onConnectSheets();
        }}
        onMouseEnter={() => setActiveNode("alpha")}
        onMouseLeave={() => setActiveNode(null)}
        disabled={isLoading}
        className="relative flex flex-col items-center justify-center gap-3 border border-emerald-500/40 bg-black p-8 transition-all"
        style={{
          borderRadius: "0px",
          minWidth: "280px",
          minHeight: "200px",
        }}
        whileHover={{ 
          borderColor: "rgba(16, 185, 129, 0.8)",
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Scanline Effect */}
        <div
          ref={scanlineRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)",
            opacity: 0,
            transform: "translateY(-100%)",
            transition: "opacity 0.3s ease, transform 0.5s ease",
          }}
        />

        {/* Glow Pulse Effect */}
        {activeNode === "alpha" && (
          <motion.div
            className="absolute inset-0 border-2 border-emerald-500"
            animate={{
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                "0 0 10px rgba(16, 185, 129, 0.3)",
                "0 0 30px rgba(16, 185, 129, 0.6)",
                "0 0 10px rgba(16, 185, 129, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ borderRadius: "0px" }}
          />
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isLoading && activeNode === "alpha" ? (
            <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
          ) : (
            <Link2 className="h-12 w-12 text-emerald-400" />
          )}
        </div>

        {/* Label */}
        <div className="relative z-10 text-center">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            ALPHA NODE
          </div>
          <div className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-emerald-400">
            SYNC LIVE WORKSPACE
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            (GOOGLE/API)
          </div>
        </div>
      </motion.button>

      {/* Beta Node: FORENSIC DATA INGESTION */}
      <motion.button
        type="button"
        onClick={() => {
          setActiveNode("beta");
          onUploadCSV();
        }}
        onMouseEnter={() => setActiveNode("beta")}
        onMouseLeave={() => setActiveNode(null)}
        disabled={isLoading}
        className="relative flex flex-col items-center justify-center gap-3 border border-cyan-500/40 bg-black p-8 transition-all"
        style={{
          borderRadius: "0px",
          minWidth: "280px",
          minHeight: "200px",
        }}
        whileHover={{ 
          borderColor: "rgba(6, 182, 212, 0.8)",
          boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Scanline Effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)",
            opacity: activeNode === "beta" ? 1 : 0,
            transform: activeNode === "beta" ? "translateY(0)" : "translateY(-100%)",
            transition: "opacity 0.3s ease, transform 0.5s ease",
          }}
        />

        {/* Glow Pulse Effect */}
        {activeNode === "beta" && (
          <motion.div
            className="absolute inset-0 border-2 border-cyan-500"
            animate={{
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                "0 0 10px rgba(6, 182, 212, 0.3)",
                "0 0 30px rgba(6, 182, 212, 0.6)",
                "0 0 10px rgba(6, 182, 212, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ borderRadius: "0px" }}
          />
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isLoading && activeNode === "beta" ? (
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
          ) : (
            <FileText className="h-12 w-12 text-cyan-400" />
          )}
        </div>

        {/* Label */}
        <div className="relative z-10 text-center">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            BETA NODE
          </div>
          <div className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-cyan-400">
            FORENSIC DATA INGESTION
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            (SOVEREIGN CSV)
          </div>
        </div>
      </motion.button>
    </div>
  );
}

