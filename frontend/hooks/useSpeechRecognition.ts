/**
 * useSpeechRecognition Hook
 * ==========================
 * Vocal Input Engine using Web Speech API (SpeechRecognition).
 * Captures natural business commands and converts them to actionable queries.
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceTimeout?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition not supported. Please use Chrome or Edge browser."
      );
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // CLICK-TO-TALK: Disable continuous listening
    recognition.interimResults = true; // Show real-time transcription to confirm mic is "Hot"
    recognition.lang = "en-US"; // Primary: Business English (US) for better Indian accent detection
    recognition.maxAlternatives = 3; // Increased to 3 for better accuracy and sensitivity

    // CLICK-TO-TALK: No auto-start timeout needed - user controls when to start/stop

    // Track audio capture state
    let audioStarted = false;
    let noSpeechTimeout: NodeJS.Timeout | null = null;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      audioStarted = false;
      console.log("[Speech Recognition] ✅ Mic is HOT - Listening started (Click-to-Talk)");
      
      // CLICK-TO-TALK: No timeout needed - user controls when to stop
    };

    // Verify mic is actually capturing audio
    recognition.onaudiostart = () => {
      audioStarted = true;
      if (noSpeechTimeout) {
        clearTimeout(noSpeechTimeout);
        noSpeechTimeout = null;
      }
      console.log("[Speech Recognition] 🎤 Audio capture confirmed - Mic is active");
    };

    recognition.onaudioend = () => {
      console.log("[Speech Recognition] 🎤 Audio capture ended");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      
      // Process all results (including interim)
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update transcript (show interim results in real-time)
      if (interimTranscript) {
        setTranscript(interimTranscript);
        console.log("[Speech Recognition] 📝 Interim:", interimTranscript);
      }
      
      // Final result
      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        console.log("[Speech Recognition] ✅ Final:", finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Clear timeout if error occurs
      if (noSpeechTimeout) {
        clearTimeout(noSpeechTimeout);
        noSpeechTimeout = null;
      }

      console.error("[Speech Recognition] ❌ Error:", event.error, {
        code: event.error,
        message: event.message || "Unknown error",
        timestamp: new Date().toISOString(),
        audioStarted,
      });
      setIsListening(false);
      
      // CLICK-TO-TALK: Silent error handling for "no-speech" - user knows why it stopped
      switch (event.error) {
        case "no-speech":
          // CLICK-TO-TALK: Silently stop and reset - no error toast needed
          // User released the button, so they know why it stopped
          console.log("[Speech Recognition] No speech detected (Click-to-Talk mode - user released button)");
          setIsListening(false);
          setError(null); // Don't show error - this is expected behavior
          // Reset transcript silently
          setTranscript("");
          break;
        case "audio-capture":
          console.error("[Speech Recognition] Audio capture failed. Check microphone permissions.");
          setError("Microphone not accessible. Please check permissions.");
          break;
        case "not-allowed":
          console.error("[Speech Recognition] Microphone permission denied.");
          setError("Microphone permission denied. Please enable in browser settings.");
          break;
        case "network":
          console.error("[Speech Recognition] Network error. Check internet connection.");
          setError("Network error. Please check your connection and try again.");
          break;
        case "aborted":
          console.warn("[Speech Recognition] Recognition was aborted (likely stopped manually).");
          // Don't set error for manual aborts
          break;
        default:
          console.error("[Speech Recognition] Unknown error:", event.error);
          setError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      audioStarted = false;
      console.log("[Speech Recognition] 🛑 Listening ended (Click-to-Talk)");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not initialized");
      return;
    }

    setTranscript("");
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already listening or other error
      console.warn("[Speech Recognition] Start error:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // CLICK-TO-TALK: Kill mic stream immediately when user releases button
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort(); // Force immediate stop
      } catch (err) {
        // Already stopped or other error - ignore
        console.log("[Speech Recognition] Stop/abort called (may already be stopped)");
      }
      setIsListening(false);
      setError(null); // Clear any errors on manual stop
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    stopListening();
  }, [stopListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    reset,
  };
}

