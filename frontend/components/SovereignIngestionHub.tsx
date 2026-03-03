"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Link2, CreditCard, ShoppingBag, Megaphone, X, Loader2, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getConnectors, saveConnector, deleteConnector, type Connector } from "@/lib/sovereignVault";

interface SovereignIngestionHubProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSheets: (sheetIdOrUrl: string) => Promise<boolean>;
  onUploadCSV: (file: File) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onConnectorActivated?: (provider: string) => void;
}

const API_CONNECTORS = [
  { id: "stripe", name: "STRIPE", icon: CreditCard, color: "#635bff", placeholder: "sk_live_..." },
  { id: "shopify", name: "SHOPIFY", icon: ShoppingBag, color: "#96bf48", placeholder: "shpat_..." },
  { id: "meta_ads", name: "META ADS", icon: Megaphone, color: "#0084ff", placeholder: "EAABsbCS1iHg..." },
];

export default function SovereignIngestionHub({
  isOpen,
  onClose,
  onConnectSheets,
  onUploadCSV,
  isLoading,
  error,
  onConnectorActivated,
}: SovereignIngestionHubProps) {
  const [activeTab, setActiveTab] = useState<"csv" | "sheets" | "api">("csv");
  const [sheetInput, setSheetInput] = useState("");
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(false);
  const [isSavingConnector, setIsSavingConnector] = useState(false);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load connectors when API tab is opened
  useEffect(() => {
    if (isOpen && activeTab === "api") {
      loadConnectors();
    }
  }, [isOpen, activeTab]);

  const loadConnectors = async () => {
    setIsLoadingConnectors(true);
    const data = await getConnectors();
    setConnectors(data);
    setIsLoadingConnectors(false);
  };

  const handleConnectSheets = async () => {
    if (!sheetInput.trim()) {
      setConnectorError("Please enter a Google Sheet ID or URL");
      return;
    }
    setConnectorError(null);
    const success = await onConnectSheets(sheetInput.trim());
    if (success) {
      setSheetInput("");
      onClose();
    }
  };

  const handleFileUpload = async (file?: File) => {
    const fileToUpload = file || fileInputRef.current?.files?.[0];
    if (!fileToUpload) return;

    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = fileToUpload.name.toLowerCase().slice(fileToUpload.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      setConnectorError("Invalid file type. Please upload a CSV or XLSX file.");
      return;
    }

    if (fileToUpload.size > 10 * 1024 * 1024) {
      setConnectorError("File size exceeds 10MB limit.");
      return;
    }

    setConnectorError(null);
    const success = await onUploadCSV(fileToUpload);
    if (success) {
      onClose();
    }
  };

  const handleSaveConnector = async (provider: string) => {
    if (!apiKey.trim()) {
      setConnectorError("API key is required");
      return;
    }

    setIsSavingConnector(true);
    setConnectorError(null);

    try {
      if (!supabase) {
        setConnectorError("[ERROR] SUPABASE_NOT_CONFIGURED");
        setIsSavingConnector(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConnectorError("Authentication required");
        setIsSavingConnector(false);
        return;
      }

      const success = await saveConnector(user.id, provider, apiKey);

      if (success) {
        await loadConnectors();
        setEditingProvider(null);
        setApiKey("");
        onConnectorActivated?.(provider);
      } else {
        setConnectorError("Failed to save connector");
      }
    } catch (err) {
      setConnectorError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSavingConnector(false);
    }
  };

  const handleDisconnectConnector = async (provider: string) => {
    try {
      if (!supabase) {
        setConnectorError("[ERROR] SUPABASE_NOT_CONFIGURED");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await deleteConnector(user.id, provider);
      await loadConnectors();
    } catch (err) {
      setConnectorError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const getConnectorStatus = (provider: string) => {
    return connectors.find((c) => c.provider_name === provider)?.status || "DISCONNECTED";
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
            style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 border border-slate-800 bg-black p-8"
            style={{ borderRadius: "0px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-mono text-xl font-semibold uppercase tracking-wider text-white">
                  SOVEREIGN INGESTION GATE
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  Select data source for strategic analysis
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

            {/* Tab Navigation */}
            <div className="mb-6 flex gap-2 border-b border-slate-800">
              {[
                { id: "csv", label: "UPLOAD CSV" },
                { id: "sheets", label: "LINK SHEETS" },
                { id: "api", label: "CONNECT API" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                  style={{ borderRadius: "0px" }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {/* CSV Upload */}
              {activeTab === "csv" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center justify-center gap-4 border border-cyan-500/40 bg-black p-8">
                    <FileText className="h-16 w-16 text-cyan-400" />
                    <div className="text-center">
                      <p className="font-mono text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        FORENSIC DATA INGESTION
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">
                        Upload CSV or XLSX file
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="border border-cyan-500/60 bg-cyan-500/10 px-6 py-3 font-mono text-xs uppercase tracking-wider text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
                      style={{ borderRadius: "0px" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          PROCESSING...
                        </span>
                      ) : (
                        "SELECT FILE"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Google Sheets */}
              {activeTab === "sheets" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center justify-center gap-4 border border-emerald-500/40 bg-black p-8">
                    <Link2 className="h-16 w-16 text-emerald-400" />
                    <div className="text-center">
                      <p className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
                        SYNC LIVE WORKSPACE
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">
                        Google Sheets ID or URL
                      </p>
                    </div>
                    <input
                      type="text"
                      value={sheetInput}
                      onChange={(e) => setSheetInput(e.target.value)}
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="w-full border border-slate-700 bg-black px-4 py-3 font-mono text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                      style={{ borderRadius: "0px" }}
                    />
                    <motion.button
                      type="button"
                      onClick={handleConnectSheets}
                      disabled={isLoading || !sheetInput.trim()}
                      className="border border-emerald-500/60 bg-emerald-500/10 px-6 py-3 font-mono text-xs uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      style={{ borderRadius: "0px" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          CONNECTING...
                        </span>
                      ) : (
                        "CONNECT"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* API Connectors */}
              {activeTab === "api" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {isLoadingConnectors ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    </div>
                  ) : (
                    API_CONNECTORS.map((connector) => {
                      const Icon = connector.icon;
                      const status = getConnectorStatus(connector.id);
                      const isActive = status === "ACTIVE";
                      const isEditing = editingProvider === connector.id;

                      return (
                        <div
                          key={connector.id}
                          className={`border p-4 transition-all ${
                            isActive
                              ? "border-emerald-500/60 bg-emerald-500/5"
                              : "border-slate-800 bg-black"
                          }`}
                          style={{ borderRadius: "0px" }}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-8 w-8" style={{ color: connector.color }} />
                              <div>
                                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-white">
                                  {connector.name}
                                </h3>
                                <p className="font-mono text-[10px] text-slate-400">
                                  {isActive ? "ACTIVE" : "DISCONNECTED"}
                                </p>
                              </div>
                            </div>
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    handleDisconnectConnector(connector.id);
                                  } else {
                                    setEditingProvider(connector.id);
                                    setApiKey("");
                                  }
                                }}
                                className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                                  isActive
                                    ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                    : "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                }`}
                                style={{ borderRadius: "0px" }}
                              >
                                {isActive ? "DISCONNECT" : "CONNECT"}
                              </button>
                            )}
                          </div>

                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
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
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveConnector(connector.id)}
                                  disabled={isSavingConnector}
                                  className="border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                  style={{ borderRadius: "0px" }}
                                >
                                  {isSavingConnector ? "SAVING..." : "SAVE & ACTIVATE"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProvider(null);
                                    setApiKey("");
                                    setConnectorError(null);
                                  }}
                                  className="border border-slate-700 bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 transition hover:bg-slate-800"
                                  style={{ borderRadius: "0px" }}
                                >
                                  CANCEL
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </div>

            {/* Error Display */}
            {(error || connectorError) && (
              <div className="mt-4 border border-red-500/40 bg-red-500/10 p-3">
                <p className="font-mono text-xs text-red-400">{error || connectorError}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

