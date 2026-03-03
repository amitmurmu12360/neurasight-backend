"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Link2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  Download,
  Upload,
  FileText,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface ConnectSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (sheetIdOrUrl: string) => Promise<boolean>;
  onUploadFile?: (file: File) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// EXPECTED SCHEMA TABLE
// =============================================================================
const EXPECTED_SCHEMA = [
  { metric: "company_name", example: "Acme Corp", description: "Company name" },
  { metric: "arr", example: "24.3", description: "ARR in millions" },
  { metric: "arr_growth_yoy", example: "18", description: "YoY growth %" },
  { metric: "burn_multiple", example: "0.9", description: "Burn multiple" },
  { metric: "nrr", example: "132", description: "Net Revenue Retention %" },
  { metric: "mqls", example: "1470", description: "Marketing Qualified Leads" },
  { metric: "mqls_growth", example: "24", description: "MoM growth %" },
  { metric: "cac", example: "246", description: "CAC in dollars" },
  { metric: "deals_closed", example: "142", description: "Deals closed" },
];

// =============================================================================
// COMPONENT
// =============================================================================
export default function ConnectSourceModal({
  isOpen,
  onClose,
  onConnect,
  onUploadFile,
  isLoading,
  error,
}: ConnectSourceModalProps) {
  const [sheetInput, setSheetInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<"sheets" | "file">("sheets");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = async () => {
    if (!sheetInput.trim()) {
      setLocalError("Please enter a Google Sheet ID or URL");
      return;
    }
    setLocalError(null);
    const success = await onConnect(sheetInput.trim());
    if (success) {
      setSheetInput("");
      onClose();
    }
  };

  const handleFileUpload = async (file?: File) => {
    const fileToUpload = file || fileInputRef.current?.files?.[0];
    if (!fileToUpload) return;

    // Validate file type
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = fileToUpload.name.toLowerCase().slice(fileToUpload.name.lastIndexOf("."));
    
    if (!validExtensions.includes(fileExtension)) {
      setLocalError(`Invalid file type. Please upload a CSV or XLSX file.`);
      return;
    }

    // Validate file size (max 10MB)
    if (fileToUpload.size > 10 * 1024 * 1024) {
      setLocalError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setLocalError(null);

    if (onUploadFile) {
      const success = await onUploadFile(fileToUpload);
      if (success) {
        setUploadedFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onClose();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    
    if (!validExtensions.includes(fileExtension)) {
      setLocalError(`Invalid file type. Please upload a CSV or XLSX file.`);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setLocalError(null);
    setUploadedFileName(file.name);
  };

  const displayError = localError || error;

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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      Connect Data Source
                    </h2>
                    <p className="text-xs text-slate-500">
                      Import live data from Google Sheets or upload CSV/XLSX
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("sheets")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition ${
                    activeTab === "sheets"
                      ? "border-b-2 border-emerald-500 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Google Sheets
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition ${
                    activeTab === "file"
                      ? "border-b-2 border-emerald-500 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload CSV or XLSX File
                  </div>
                </button>
              </div>

              {/* Body */}
              <div className="space-y-5 p-6">
                {/* File Upload Tab */}
                {activeTab === "file" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                          <Upload className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-100">
                            Upload CSV or XLSX File
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Supported formats: .csv, .xlsx, .xls (max 10MB)
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="file-upload"
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isLoading ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          {uploadedFileName ? `Selected: ${uploadedFileName}` : "Choose File"}
                        </label>
                        {uploadedFileName && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
                          >
                            <p className="text-xs font-medium text-emerald-400">
                              ✓ Selected: <span className="font-semibold">{uploadedFileName}</span> ready for analysis
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Sheets Tab */}
                {activeTab === "sheets" && (
                  <>
                    {/* OAuth Simulation Button */}
                <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Connect with Google
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Authenticate with your Google account for secure access
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Simulate OAuth flow
                        const simulatedSheetId = prompt(
                          "OAuth Simulation: Enter a Google Sheet ID or URL to connect:"
                        );
                        if (simulatedSheetId) {
                          setSheetInput(simulatedSheetId);
                        }
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Connect with Google
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">
                      Or enter manually
                    </span>
                  </div>
                </div>

                {/* Input */}
                <div>
                  <label
                    htmlFor="sheet-input"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Google Sheet ID or URL
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Link2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="sheet-input"
                      type="text"
                      value={sheetInput}
                      onChange={(e) => setSheetInput(e.target.value)}
                      placeholder="Paste Sheet URL or ID here..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Example: https://docs.google.com/spreadsheets/d/
                    <span className="text-emerald-400">1ABC123...</span>/edit
                  </p>
                </div>

                {/* Error */}
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">
                        Connection Failed
                      </p>
                      <p className="mt-1 text-xs text-red-300/80">
                        {displayError}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Requirements */}
                <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Requirements
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSchema(!showSchema)}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      {showSchema ? "Hide Schema" : "View Schema"}
                    </button>
                  </div>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Sheet must be &quot;Published to the web&quot;
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Data should be in Sheet1 (first tab)
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Follow the expected column structure
                    </li>
                  </ul>

                  {/* Schema Table */}
                  <AnimatePresence>
                    {showSchema && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-700 bg-slate-800/50">
                                <th className="px-3 py-2 text-left font-medium text-slate-400">
                                  Metric
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-slate-400">
                                  Example
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {EXPECTED_SCHEMA.map((row) => (
                                <tr
                                  key={row.metric}
                                  className="border-b border-slate-800 last:border-0"
                                >
                                  <td className="px-3 py-2 font-mono text-emerald-400">
                                    {row.metric}
                                  </td>
                                  <td className="px-3 py-2 text-slate-300">
                                    {row.example}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Template Section */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">
                        Need a template?
                      </span>
                    </div>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Use Standard Template
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Pre-configured with all required metrics. Just add your data.
                  </p>
                </div>

                {/* Help Link */}
                <a
                  href="https://support.google.com/docs/answer/183965"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  How to publish a Google Sheet to the web
                </a>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-800/30 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                {activeTab === "sheets" ? (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isLoading || !sheetInput.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Connect Sheet
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFileUpload()}
                    disabled={isLoading || !uploadedFileName}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload & Analyze
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

