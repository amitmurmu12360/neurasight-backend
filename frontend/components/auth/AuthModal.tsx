"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase, getProfile, updateUserProfile } from "@/lib/supabase";

// =============================================================================
// TYPES
// =============================================================================
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; email: string; spreadsheetId?: string | null; persona?: string; industry?: string }) => void;
  initialMode?: "login" | "signup";
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!supabase) {
      setError("Authentication service is not configured. Please check your environment variables.");
      return;
    }

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Fetch user profile to check for existing spreadsheetId
          try {
            const profile = await getProfile(data.user.id);
            onSuccess({
              id: data.user.id,
              email: data.user.email || email,
              spreadsheetId: profile?.last_connected_sheet_id || null,
              persona: profile?.persona_preference,
              industry: (profile?.ghost_state as { industry?: string })?.industry,
            });
          } catch (err) {
            // If profile fetch fails, still call onSuccess with basic user info
            onSuccess({
              id: data.user.id,
              email: data.user.email || email,
            });
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Fetch user profile to check for existing spreadsheetId
          try {
            const profile = await getProfile(data.user.id);
            onSuccess({
              id: data.user.id,
              email: data.user.email || email,
              spreadsheetId: profile?.last_connected_sheet_id || null,
              persona: profile?.persona_preference,
              industry: (profile?.ghost_state as { industry?: string })?.industry,
            });
          } catch (err) {
            // If profile fetch fails, still call onSuccess with basic user info
            onSuccess({
              id: data.user.id,
              email: data.user.email || email,
            });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl p-8 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-8 space-y-2 text-center">
                <h2 className="font-mono text-2xl font-bold uppercase tracking-wider text-white">
                  {mode === "login" ? "Sovereign Access" : "Create Account"}
                </h2>
                <p className="font-mono text-xs text-slate-400">
                  {mode === "login"
                    ? "Authenticate to connect your business data"
                    : "Join the NeuraSight Swarm"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="commander@business.com"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 p-3"
                  >
                    <p className="font-mono text-xs text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-black transition hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : mode === "login" ? "Authenticate" : "Create Account"}
                </motion.button>

                {/* Toggle Mode */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError(null);
                    }}
                    className="font-mono text-xs text-slate-400 transition hover:text-emerald-400"
                    disabled={isLoading}
                  >
                    {mode === "login"
                      ? "Need an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

