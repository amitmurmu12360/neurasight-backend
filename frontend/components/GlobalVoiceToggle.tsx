/**
 * GlobalVoiceToggle - Compact Voice Control for Main Dashboard
 * =============================================================
 * Compact voice toggle button for the main dashboard header.
 * Provides quick access to voice controls outside of Boardroom Mode.
 */

"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useNeuralVoice, type PersonaType } from "@/hooks/useNeuralVoice";

interface GlobalVoiceToggleProps {
  persona: PersonaType;
}

export default function GlobalVoiceToggle({ persona }: GlobalVoiceToggleProps) {
  const { isMuted, toggleMute, getPersonaColor } = useNeuralVoice(true, persona);

  return (
    <div className="flex items-center gap-2">
      {/* Muted Indicator - Pulsing Red */}
      {isMuted && (
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400"
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-red-400"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.8)",
            }}
          />
          MUTED
        </motion.div>
      )}

      {/* Voice Toggle Button */}
      <motion.button
        onClick={toggleMute}
        className={`flex items-center justify-center rounded-full p-2 transition-all ${
          isMuted
            ? "border border-slate-700/50 bg-slate-800/60 hover:border-slate-600/50"
            : "border border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500/60"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isMuted ? "Unmute Voice" : "Mute Voice"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-slate-400" />
        ) : (
          <Volume2 className="h-4 w-4" style={{ color: getPersonaColor() }} />
        )}
      </motion.button>
    </div>
  );
}

