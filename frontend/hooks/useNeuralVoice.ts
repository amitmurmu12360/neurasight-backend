/**
 * useNeuralVoice Hook
 * ===================
 * Neural Voice Engine for Text-to-Speech using Web Speech Synthesis API.
 * Provides executive-grade voice synthesis with professional voice selection.
 * Supports persona-aware vocal profiling for role-specific voice characteristics.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type PersonaType = "CEO" | "CMO" | "VP Sales";

export interface PersonaVoiceConfig {
  pitch: number;
  rate: number;
  label: string;
  color: string; // For visual feedback (hex color)
}

export const PERSONA_VOICE_CONFIG: Record<PersonaType, PersonaVoiceConfig> = {
  CEO: {
    pitch: 0.85,
    rate: 0.9,
    label: "Executive Authority",
    color: "#06b6d4", // Cyan
  },
  CMO: {
    pitch: 1.15,
    rate: 1.1,
    label: "Growth Energetic",
    color: "#a855f7", // Purple
  },
  "VP Sales": {
    pitch: 1.0,
    rate: 1.05,
    label: "Direct Closer",
    color: "#3b82f6", // Blue
  },
};

interface UseNeuralVoiceReturn {
  isSpeaking: boolean;
  isMuted: boolean;
  speak: (text: string, userName?: string, context?: { isReturning?: boolean; persona?: PersonaType; industry?: string }) => void;
  stop: () => void;
  toggleMute: () => void;
  currentPersona?: PersonaType;
  getPersonaColor: () => string;
}

/**
 * Get the best available executive voice
 */
function getExecutiveVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  
  // Priority order for executive voices
  const preferredVoices = [
    "Google UK English Male",
    "Microsoft Zira - English (United States)",
    "Microsoft David - English (United States)",
    "Alex", // macOS
    "Daniel", // macOS UK
  ];

  // Try to find preferred voice
  for (const preferred of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(preferred));
    if (voice) return voice;
  }

  // Fallback: Find any male English voice
  const maleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("zira"))
  );

  if (maleVoice) return maleVoice;

  // Final fallback: Any English voice
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

export function useNeuralVoice(
  initialMuted: boolean = true,
  persona: PersonaType = "CEO"
): UseNeuralVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [currentPersona, setCurrentPersona] = useState<PersonaType>(persona);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  // Update persona when it changes
  useEffect(() => {
    if (persona !== currentPersona) {
      // Cancel any ongoing speech when persona changes
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setCurrentPersona(persona);
    }
  }, [persona, currentPersona]);

  const getPersonaColor = useCallback(() => {
    return PERSONA_VOICE_CONFIG[currentPersona]?.color || "#10b981"; // Default to emerald
  }, [currentPersona]);

  // Load voices when available
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const loadVoices = () => {
      voicesLoadedRef.current = true;
    };

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Some browsers load voices immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    }
  }, []);

  const speak = useCallback(
    (text: string, userName?: string, context?: { isReturning?: boolean; persona?: PersonaType; industry?: string }) => {
      // Safety check: Ensure speech synthesis is available
      if (isMuted || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }

      // Stop any ongoing speech
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Ignore errors when canceling (e.g., if nothing is speaking)
        if (err && typeof err === 'object' && Object.keys(err).length > 0) {
          console.warn("[Neural Voice] Error canceling speech:", err);
        }
      }

      // Determine active persona (prioritize context persona, then hook persona)
      const activePersona = (context?.persona || currentPersona) as PersonaType;
      const voiceConfig = PERSONA_VOICE_CONFIG[activePersona] || PERSONA_VOICE_CONFIG.CEO;

      // Context-aware greeting (Agent 8: Vocal Executive)
      let greeting = "";
      const industry = context?.industry || "SAAS";
      if (context && context.isReturning) {
        greeting = `Welcome back, ${context.persona || userName || "Executive"}. Sovereign Brain is online. `;
      } else if (context) {
        greeting = `Briefing initiated. Sovereign Brain is online, ${context.persona || userName || "Executive"}. Analyzing ${industry} data. `;
      } else {
        greeting = `Briefing initiated. Sovereign Brain is online. `;
      }

      // Add "Wake Up" phrase for grounded vocal response
      const wakeUpPhrase = userName ? `${userName}, here is your simulation: ` : "";
      const fullText = greeting + wakeUpPhrase + text;

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(fullText);
      utteranceRef.current = utterance;

      // Configure for executive voice
      const voice = getExecutiveVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Persona-aware voice settings
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = 0.9; // High volume for clarity

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (error) => {
        // Filter empty error objects {} - stop cluttering console
        if (!error || typeof error !== 'object' || Object.keys(error).length === 0) {
          return;
        }
        console.error("[Neural Voice] Speech synthesis error:", error);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      // Speak with error handling
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Ignore empty error objects {} that some browsers throw
        if (err && typeof err === 'object' && Object.keys(err).length > 0) {
          console.error("[Neural Voice] Error speaking:", err);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      }
    },
    [isMuted, currentPersona]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      // Stop speaking if muting
      if (newMuted) {
        stop();
      }
      return newMuted;
    });
  }, [stop]);

  return {
    isSpeaking,
    isMuted,
    speak,
    stop,
    toggleMute,
    currentPersona,
    getPersonaColor,
  };
}

