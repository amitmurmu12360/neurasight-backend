"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getConnectors, saveConnector, deleteConnector, type Connector } from "@/lib/sovereignVault";

interface SovereignConnectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectorActivated?: (provider: string) => void;
}

const CONNECTORS = [
  {
    id: "stripe",
    name: "STRIPE",
    description: "Revenue Intelligence & Payment Analytics",
    icon: "💳",
    color: "#635bff",
    placeholder: "sk_live_...",
  },
  {
    id: "shopify",
    name: "SHOPIFY",
    description: "Operations & Inventory Intelligence",
    icon: "🛍️",
    color: "#96bf48",
    placeholder: "shpat_...",
  },
  {
    id: "meta_ads",
    name: "META ADS",
    description: "Marketing Efficiency & ROAS Analytics",
    icon: "📊",
    color: "#0084ff",
    placeholder: "EAABsbCS1iHg...",
  },
];

export default function SovereignConnector({
  isOpen,
  onClose,
  onConnectorActivated,
}: SovereignConnectorProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConnectors();
    }
  }, [isOpen]);

  const loadConnectors = async () => {
    setIsLoading(true);
    const data = await getConnectors();
    setConnectors(data);
    setIsLoading(false);
  };

  const handleConnect = (provider: string) => {
    setEditingProvider(provider);
    setApiKey("");
    setError(null);
    
    // Pre-fill if already connected
    const existing = connectors.find(c => c.provider_name === provider);
    if (existing && existing.status === "ACTIVE") {
      // Don't show the key, just allow re-entry
      setApiKey("");
    }
  };

  const handleSave = async (provider: string) => {
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Check Supabase configuration
      if (!supabase) {
        setError("[ERROR] SUPABASE_NOT_CONFIGURED");
        setIsSaving(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Authentication required");
        setIsSaving(false);
        return;
      }

      // Save connector (encryption handled server-side)
      const success = await saveConnector(user.id, provider, apiKey);
      
      if (success) {
        await loadConnectors();
        setEditingProvider(null);
        setApiKey("");
        
        // Trigger activation callback
        if (onConnectorActivated) {
          onConnectorActivated(provider);
        }
      } else {
        setError("Failed to save connector");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      if (!supabase) {
        setError("[ERROR] SUPABASE_NOT_CONFIGURED");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await deleteConnector(user.id, provider);
      await loadConnectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const getConnectorStatus = (provider: string) => {
    const connector = connectors.find(c => c.provider_name === provider);
    return connector?.status || "DISCONNECTED";
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return "••••••••";
    return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
            style={{
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 border border-slate-800 bg-black p-8"
            style={{ borderRadius: "0px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-mono text-xl font-semibold uppercase tracking-wider text-white">
                  SOVEREIGN CONNECTOR
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  Secure API Integration Hub
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                style={{ borderRadius: "0px" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Connectors Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {CONNECTORS.map((connector) => {
                  const status = getConnectorStatus(connector.id);
                  const isActive = status === "ACTIVE";
                  const isEditing = editingProvider === connector.id;
                  const connectorData = connectors.find(c => c.provider_name === connector.id);

                  return (
                    <motion.div
                      key={connector.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border p-4 transition-all ${
                        isActive
                          ? "border-emerald-500/60 bg-emerald-500/5"
                          : "border-slate-800 bg-black"
                      }`}
                      style={{ borderRadius: "0px" }}
                    >
                      {/* Connector Header */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center border"
                            style={{
                              borderColor: isActive ? connector.color : "rgba(148, 163, 184, 0.3)",
                              borderRadius: "0px",
                            }}
                          >
                            <span className="text-lg">{connector.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-white">
                              {connector.name}
                            </h3>
                            <p className="font-mono text-[10px] text-slate-400">
                              {connector.description}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                              <span className="font-mono text-[10px] uppercase text-emerald-400">
                                ACTIVE
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-slate-500" />
                              <span className="font-mono text-[10px] uppercase text-slate-500">
                                DISCONNECTED
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* API Key Input (when editing) */}
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-cyan-400" />
                            <span className="font-mono text-[10px] uppercase text-slate-400">
                              Secure Input
                            </span>
                          </div>
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={connector.placeholder}
                            className="w-full border border-slate-700 bg-black px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                            style={{ borderRadius: "0px" }}
                            autoFocus
                          />
                          {error && editingProvider === connector.id && (
                            <p className="font-mono text-[10px] text-red-400">{error}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSave(connector.id)}
                              disabled={isSaving}
                              className="border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                              style={{ borderRadius: "0px" }}
                            >
                              {isSaving ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  SAVING...
                                </span>
                              ) : (
                                "SAVE & ACTIVATE"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProvider(null);
                                setApiKey("");
                                setError(null);
                              }}
                              className="border border-slate-700 bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 transition hover:bg-slate-800"
                              style={{ borderRadius: "0px" }}
                            >
                              CANCEL
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Actions (when not editing) */}
                      {!isEditing && (
                        <div className="mt-3 flex items-center gap-2">
                          {isActive ? (
                            <>
                              <span className="font-mono text-[10px] text-slate-500">
                                {connectorData?.encrypted_key_ref
                                  ? maskApiKey(connectorData.encrypted_key_ref)
                                  : "Key stored securely"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDisconnect(connector.id)}
                                className="ml-auto border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-red-400 transition hover:bg-red-500/20"
                                style={{ borderRadius: "0px" }}
                              >
                                DISCONNECT
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConnect(connector.id)}
                              className="ml-auto border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-500/20"
                              style={{ borderRadius: "0px" }}
                            >
                              <span className="flex items-center gap-2">
                                <Link2 className="h-3 w-3" />
                                CONNECT
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer Security Notice */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="font-mono text-[10px] uppercase text-slate-400">
                    SECURITY PROTOCOL
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    All API keys are encrypted at rest and never logged. Keys are stored in Supabase
                    Vault with Row-Level Security enabled.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
