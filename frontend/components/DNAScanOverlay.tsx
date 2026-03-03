"use client";

import { motion } from "framer-motion";

interface DNAScanOverlayProps {
  isActive: boolean;
}

export default function DNAScanOverlay({ isActive }: DNAScanOverlayProps) {
  if (!isActive) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dimmed Background */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.9 }}
      />
      
      {/* Scanning Line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-cyan-400"
        style={{
          boxShadow: "0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.4)",
        }}
        initial={{ top: "0%" }}
        animate={{ 
          top: "100%",
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Scan Trail Effect */}
      <motion.div
        className="absolute left-0 right-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"
        style={{
          height: "100px",
        }}
        initial={{ top: "-100px" }}
        animate={{ 
          top: "100%",
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.div>
  );
}

