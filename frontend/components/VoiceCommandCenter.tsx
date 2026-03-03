/**
 * VoiceCommandCenter - Neural Voice Control Hub
 * ==============================================
 * Floating control hub for voice interaction in Boardroom Mode.
 * Features neural mic with waveform animation and audio toggle.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Monitor, BarChart3 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useNeuralVoice } from "@/hooks/useNeuralVoice";
import { useState, useEffect } from "react";
import { supabase, updateProfile, getProfile } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

interface VoiceCommandCenterProps {
  onCommandReceived?: (command: string) => void;
  isBoardroomMode: boolean;
  onExitBoardroom?: () => void;
  onSimulateMarket?: () => void;
  isMarketLoading?: boolean;
  onMicStateChange?: (isListening: boolean) => void; // Callback for HUD sync
  persona?: "CEO" | "CMO" | "VP Sales"; // Persona for voice color matching
}

export default function VoiceCommandCenter({
  onCommandReceived,
  isBoardroomMode,
  onExitBoardroom,
  onSimulateMarket,
  isMarketLoading = false,
  onMicStateChange,
  persona = "CEO",
}: VoiceCommandCenterProps) {
  const { isListening, transcript, error, startListening, stopListening, reset } =
    useSpeechRecognition();
  const { isSpeaking, isMuted, speak, toggleMute, getPersonaColor } = useNeuralVoice(true, persona);
  const [isLoadingMuteState, setIsLoadingMuteState] = useState(true);
  const { info: showToast } = useToast();

  // Helper to convert hex to rgba for boxShadow
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Notify HUD when mic state changes
  useEffect(() => {
    onMicStateChange?.(isListening);
  }, [isListening, onMicStateChange]);

  // Load mute state from Supabase on mount
  useEffect(() => {
    const loadMuteState = async () => {
      if (!supabase) {
        // Fallback to localStorage
        const saved = localStorage.getItem("neurasight_audio_muted");
        if (saved === "true") {
          // Will be handled by useNeuralVoice hook
        }
        setIsLoadingMuteState(false);
        return;
      }

      try {
        const userId = "neurasight-user-1"; // Default user
        const profile = await getProfile(userId);
        if (profile?.audio_muted !== undefined) {
          // Update the hook's mute state if needed
          // The hook manages its own state, so we just ensure localStorage is synced
          localStorage.setItem("neurasight_audio_muted", String(profile.audio_muted));
        }
        setIsLoadingMuteState(false);
      } catch (err) {
        console.warn("[Voice] Failed to load mute state:", err);
        setIsLoadingMuteState(false);
      }
    };

    loadMuteState();
  }, []);

  // Save mute state to Supabase when it changes
  const handleToggleMute = async () => {
    const newMutedState = !isMuted;
    toggleMute();
    
    // Save to localStorage immediately
    localStorage.setItem("neurasight_audio_muted", String(newMutedState));
    
    // Save to Supabase if available
    if (supabase) {
      try {
        const userId = "neurasight-user-1";
        await updateProfile(userId, { audio_muted: newMutedState });
      } catch (err) {
        console.warn("[Voice] Failed to save mute state to Supabase:", err);
        // localStorage is already saved, so we're good
      }
    }
  };

  // Handle transcript changes (command received)
  useEffect(() => {
    if (transcript && transcript.trim()) {
      onCommandReceived?.(transcript);
      reset();
    }
  }, [transcript, onCommandReceived, reset]);

  // CLICK-TO-TALK: No error toasts for "no-speech" - user knows why it stopped
  // Errors are handled silently in useSpeechRecognition hook

  if (!isBoardroomMode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-[100] flex items-center gap-3"
    >
      {/* Neural Mic Button with Waveform Animation - CLICK-TO-TALK (Hold-to-Talk) */}
      <motion.button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening} // Stop if mouse leaves button area
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent mouse events on touch
          startListening();
        }}
        onTouchEnd={(e) => {
          e.preventDefault(); // Prevent mouse events on touch
          stopListening();
        }}
        disabled={isLoadingMuteState}
        className={`relative flex items-center justify-center rounded-full p-4 shadow-2xl backdrop-blur-xl transition-all select-none border-2 ${
          isListening
            ? "bg-slate-900/80"
            : "bg-slate-900/80 border-slate-700/50"
        }`}
        style={isListening ? {
          borderColor: hexToRgba(getPersonaColor(), 0.5),
          backgroundColor: hexToRgba(getPersonaColor(), 0.2),
        } : {}}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? "Release to stop" : "Hold to talk"}
      >
        {/* Neural Waveform Animation - Persona-Aware Color Pulse */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full z-0"
            style={{ zIndex: 0 }}
            animate={{
              boxShadow: [
                `0 0 0 0 ${hexToRgba(getPersonaColor(), 0.4)}`,
                `0 0 20px 8px ${hexToRgba(getPersonaColor(), 0.5)}`,
                `0 0 0 0 ${hexToRgba(getPersonaColor(), 0.4)}`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Waveform SVG Animation - Persona-Aware Color */}
        {isListening && (
          <motion.svg
            className="absolute inset-0 h-full w-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 10 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.rect
                key={i}
                x={i * 20}
                y="40"
                width="12"
                height="20"
                fill={getPersonaColor()}
                animate={{
                  height: [20, 40, 20, 30, 20],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.svg>
        )}

        {/* Mic Icon with "Thinking..." Pulse Animation */}
        {isListening ? (
          <motion.div
            className="relative z-10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Mic className="h-5 w-5" style={{ color: getPersonaColor() }} />
          </motion.div>
        ) : (
          <MicOff className="relative z-10 h-5 w-5 text-slate-400" />
        )}
      </motion.button>

      {/* Audio Toggle Button with Muted Pulse Indicator */}
      <motion.button
        onClick={handleToggleMute}
        disabled={isLoadingMuteState}
        className={`relative flex items-center justify-center rounded-full p-4 shadow-2xl backdrop-blur-xl transition-all border-2 ${
          isMuted
            ? "bg-slate-900/80 border-slate-700/50 hover:border-slate-600/50"
            : "bg-emerald-500/20 border-emerald-400/50 hover:border-emerald-400"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isMuted ? "Unmute Voice" : "Mute Voice"}
      >
        {/* Pulsing Red Indicator when Muted */}
        {isMuted && (
          <motion.div
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.8)",
            }}
          />
        )}
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-slate-400" />
        ) : (
          <Volume2 className="h-5 w-5" style={{ color: getPersonaColor() }} />
        )}
      </motion.button>

      {/* Status Indicator with "Mic HOT" indicator */}
      <AnimatePresence>
        {(isListening || isSpeaking || error || transcript) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 backdrop-blur-xl max-w-xs"
          >
            {isListening && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getPersonaColor() }}
                    animate={{ 
                      opacity: [1, 0.3, 1],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="font-semibold" style={{ color: getPersonaColor() }}>Mic HOT</span>
                </div>
                {transcript && (
                  <div className="text-xs text-slate-400 italic mt-1">
                    "{transcript}"
                  </div>
                )}
              </div>
            )}
            {isSpeaking && !isListening && (
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3" style={{ color: getPersonaColor() }} />
                <span>Speaking...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <span>⚠️ {error}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

