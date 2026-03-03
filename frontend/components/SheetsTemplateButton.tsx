"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, Download, ExternalLink, Copy } from "lucide-react";

// =============================================================================
// CONSTANTS
// =============================================================================
// Replace with your actual template sheet ID
const TEMPLATE_SHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
const TEMPLATE_COPY_URL = `https://docs.google.com/spreadsheets/d/${TEMPLATE_SHEET_ID}/copy`;
const TEMPLATE_VIEW_URL = `https://docs.google.com/spreadsheets/d/${TEMPLATE_SHEET_ID}/edit`;

// =============================================================================
// TYPES
// =============================================================================
interface SheetsTemplateButtonProps {
  variant?: "full" | "compact" | "inline";
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function SheetsTemplateButton({
  variant = "full",
  className = "",
}: SheetsTemplateButtonProps) {
  if (variant === "inline") {
    return (
      <a
        href={TEMPLATE_COPY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 transition hover:text-emerald-300 hover:underline ${className}`}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Use Standard Template
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <motion.a
        href={TEMPLATE_COPY_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20 ${className}`}
      >
        <Copy className="h-4 w-4" />
        Copy Template
      </motion.a>
    );
  }

  // Full variant
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur ${className}`}
    >
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              NeuraSight Data Template
            </h3>
            <p className="text-xs text-slate-500">
              Pre-formatted Google Sheet for instant setup
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        {/* Features List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Pre-configured metrics schema (ARR, NRR, MQLs, CAC)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Example data for quick validation
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Works immediately with NeuraSight connector
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.a
            href={TEMPLATE_COPY_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            <Download className="h-4 w-4" />
            Make a Copy
          </motion.a>
          <motion.a
            href={TEMPLATE_VIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </motion.a>
        </div>

        {/* Instructions */}
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-400">Quick Start:</span>{" "}
            Click &quot;Make a Copy&quot; → Add your data → Publish to web → Connect in
            NeuraSight
          </p>
        </div>
      </div>
    </div>
  );
}

