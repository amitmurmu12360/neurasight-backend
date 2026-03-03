/**
 * Source Selector Component
 * ==========================
 * Multi-source data ingestion selector with OLED styling and persona-aware colors.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Database, FileSpreadsheet, Server, ChevronDown, Check } from "lucide-react";
import { useState } from "react";

export type SourceType = "GOOGLE_SHEETS" | "CSV" | "SQL" | "API";

interface SourceOption {
  id: SourceType;
  label: string;
  icon: React.ReactNode;
  status: "active" | "available" | "coming-soon";
  description?: string;
}

interface SourceSelectorProps {
  selectedSource: SourceType;
  onSourceChange: (source: SourceType) => void;
  personaColor?: string; // Hex color from persona (e.g., "#10b981" for CEO)
  className?: string;
}

const sourceOptions: SourceOption[] = [
  {
    id: "GOOGLE_SHEETS",
    label: "Google Sheets",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    status: "active",
    description: "Live sync enabled",
  },
  {
    id: "CSV",
    label: "CSV Upload",
    icon: <Database className="h-4 w-4" />,
    status: "available",
    description: "Upload and parse",
  },
  {
    id: "SQL",
    label: "SQL/API",
    icon: <Server className="h-4 w-4" />,
    status: "coming-soon",
    description: "Coming soon",
  },
];

export default function SourceSelector({
  selectedSource,
  onSourceChange,
  personaColor = "#10b981", // Default emerald
  className = "",
}: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = sourceOptions.find(opt => opt.id === selectedSource);
  
  // Convert hex to RGB for rgba
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 16, g: 185, b: 129 }; // Default emerald
  };
  
  const rgb = hexToRgb(personaColor);
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
  const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
  
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border bg-black/60 backdrop-blur-md px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-white/80 transition-all hover:bg-black/80"
        style={{
          borderColor: selectedOption?.status === "active" ? borderColor : "rgba(255, 255, 255, 0.1)",
          boxShadow: selectedOption?.status === "active" ? `0 0 12px ${glowColor}` : "none",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedOption?.icon}
        <span>{selectedOption?.label}</span>
        {selectedOption?.status === "active" && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: personaColor }} />
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-50 w-56 rounded-lg border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl"
              style={{
                boxShadow: `0 0 20px ${glowColor}, 0 8px 32px rgba(0, 0, 0, 0.8)`,
              }}
            >
              <div className="p-1.5">
                {sourceOptions.map((option) => {
                  const isSelected = option.id === selectedSource;
                  const isDisabled = option.status === "coming-soon";
                  
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => {
                        if (!isDisabled) {
                          onSourceChange(option.id);
                          setIsOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSelected 
                          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` 
                          : "transparent",
                        border: isSelected 
                          ? `1px solid ${borderColor}` 
                          : "1px solid transparent",
                      }}
                      whileHover={!isDisabled ? { 
                        backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
                        scale: 1.02,
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    >
                      <div className="flex-shrink-0" style={{ color: isSelected ? personaColor : "rgba(255, 255, 255, 0.6)" }}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="font-semibold uppercase tracking-wider truncate"
                            style={{ color: isSelected ? personaColor : "rgba(255, 255, 255, 0.9)" }}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: personaColor }} />
                          )}
                        </div>
                        {option.description && (
                          <span className="text-[10px] text-white/50 truncate block">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

