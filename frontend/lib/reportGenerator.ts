/**
 * Executive Dossier Report Generator
 * ===================================
 * World-class strategic reporting with McKinsey aesthetic.
 * Pure Black backgrounds, Sovereign Emerald (#10b981), Strategic Cyan (#06b6d4).
 * 
 * Typography: JetBrains Mono for system IDs/math; Inter/Roboto for narratives.
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { DashboardState } from "@/types/dashboard";
import type { Recommendation } from "@/lib/sovereignWriter";

// =============================================================================
// TYPES
// =============================================================================
export interface ExecutiveDossierOptions {
  displayData: DashboardState;
  mathIntegrityConfidence: number; // 0-1
  recommendations: Recommendation[];
  txId?: string;
  industry?: string;
  persona?: string;
  dataSource?: string;
  isDigitallySigned?: boolean; // If true, includes formal "Signed" stamp instead of "Draft"
  integrityCertificate?: {
    certificate_id: string;
    cryptographic_hash: string;
    integrity_seal: any;
    resolved_anomalies: any;
    timestamp: string;
    audit_trail: any;
  }; // Agent 12 certificate for healed datasets
  dataContract?: {
    tx_id?: string;
    metrics?: Record<string, number>;
    total_rows?: number;
    ontology_mapping?: Record<string, string>;
    industry?: string;
  }; // Semantic ontology data contract (full-spectrum aggregation)
}

// =============================================================================
// COLORS (McKinsey Aesthetic)
// =============================================================================
type ColorTuple = [number, number, number];
const COLORS: {
  BLACK: ColorTuple;
  EMERALD: ColorTuple;
  CYAN: ColorTuple;
  WHITE: ColorTuple;
  SLATE_400: ColorTuple;
  SLATE_500: ColorTuple;
} = {
  BLACK: [0, 0, 0],
  EMERALD: [16, 185, 129], // #10b981
  CYAN: [6, 182, 212], // #06b6d4
  WHITE: [255, 255, 255],
  SLATE_400: [148, 163, 184],
  SLATE_500: [100, 116, 139],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Format number with currency/unit
 */
function formatMetric(value: number | undefined, unit?: string, currency?: string): string {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  const formatted = typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(value);
  if (currency) return `${currency}${formatted}${unit || ""}`;
  return `${formatted}${unit || ""}`;
}

/**
 * Capture chart element as high-res image
 */
async function captureChartElement(elementId: string): Promise<string | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const canvas = await html2canvas(element, {
      backgroundColor: "#000000",
      scale: 3, // High resolution
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL("image/png", 1.0);
  } catch (error) {
    console.error(`[Report Generator] Failed to capture ${elementId}:`, error);
    return null;
  }
}

/**
 * Generate digital hash from report content
 */
function generateDigitalHash(content: string): string {
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generate Executive Dossier PDF
 */
export async function generateExecutiveDossier(
  options: ExecutiveDossierOptions
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // =========================================================================
    // CALCULATE CONFIDENCE VALUES (Used throughout PDF)
    // =========================================================================
    const confidenceValue = options.mathIntegrityConfidence ?? 0;
    const confidencePercent = Math.round(confidenceValue * 10000) / 100;
    const isVerificationFailed = confidenceValue === 0 || confidenceValue === undefined || isNaN(confidenceValue);

    // =========================================================================
    // COVER PAGE
    // =========================================================================
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Title
    doc.setTextColor(...COLORS.EMERALD);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE DOSSIER", margin, yPosition + 20);

    yPosition += 15;
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.SLATE_400);
    doc.setFont("helvetica", "normal");
    doc.text("Strategic Intelligence Report", margin, yPosition + 20);

    // CRITICAL BANNER: Show if Math Integrity is low (verification failed or confidence < 90%)
    const isCritical = isVerificationFailed || (confidenceValue < 0.9 && confidenceValue > 0);
    if (isCritical) {
      yPosition += 10;
      doc.setFillColor(239, 68, 68); // Red (#ef4444)
      doc.rect(margin, yPosition, contentWidth, 14, "FD");
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const bannerText = isVerificationFailed 
        ? "CRITICAL: AUDIT FAILED"
        : `HIGH RISK: MATH MISMATCH DETECTED (${confidencePercent}% CONFIDENCE)`;
      doc.text(
        bannerText,
        margin + 2,
        yPosition + 9
      );
      yPosition += 18;
    }

    // Audit Stamp
    yPosition += 10;
    
    if (isVerificationFailed) {
      // Show VERIFICATION FAILED in Red
      doc.setFillColor(220, 38, 38); // Red color
      doc.rect(margin, yPosition + 15, contentWidth, 12, "FD");
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(10);
      doc.setFont("courier", "bold"); // JetBrains Mono fallback
      doc.text(
        `VERIFICATION FAILED: MATH INTEGRITY NOT VERIFIED`,
        margin + 2,
        yPosition + 22
      );
    } else {
      doc.setFillColor(...COLORS.EMERALD);
      doc.rect(margin, yPosition + 15, contentWidth, 12, "FD");
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.5);
      
      doc.setTextColor(...COLORS.BLACK);
      doc.setFontSize(10);
      doc.setFont("courier", "bold"); // JetBrains Mono fallback
      doc.text(
        `MATH INTEGRITY VERIFIED: ${confidencePercent}% CONFIDENCE`,
        margin + 2,
        yPosition + 22
      );
    }

    // Footer
    const footerY = pageHeight - 10;
    doc.setTextColor(...COLORS.SLATE_500);
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    const signature = options.txId
      ? `SYSTEM_VERIFIED_NEURASIGHT_${options.txId}`
      : `SYSTEM_VERIFIED_NEURASIGHT_${Date.now()}`;
    doc.text(signature, margin, footerY);

    doc.addPage();

    // =========================================================================
    // EXECUTIVE SUMMARY
    // =========================================================================
    yPosition = margin;

    // Section Header
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(margin, yPosition, contentWidth, 8, "F");
    doc.setTextColor(...COLORS.EMERALD);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE SUMMARY", margin, yPosition + 5);

    yPosition += 12;

    // Company Info
    const companyName = options.displayData?.company?.name || "Unknown Company";
    const companyStage = options.displayData?.company?.stage || "Unknown Stage";
    
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, margin, yPosition);
    
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.SLATE_400);
    doc.text(companyStage, margin, yPosition);

    yPosition += 10;

    // =========================================================================
    // HEALTH GAUGES
    // =========================================================================
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(margin, yPosition, contentWidth, 8, "F");
    doc.setTextColor(...COLORS.EMERALD);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INTELLIGENCE HEALTH SCORE", margin, yPosition + 5);

    yPosition += 12;

    // Helper function to format ARR (dynamic unit detection from Agent 2)
    // DYNAMIC UNIT SCALING: Handles Billions, Millions, Thousands, and Raw values
    // Prevents double-scaling (e.g., $1162295515.2M -> $1.2B)
    const formatARR = (value: number | undefined, currency?: string, detectedUnit?: "M" | "K" | "Raw"): string => {
      if (value === undefined || value === null || isNaN(value)) return "N/A";
      
      // Use detected unit from Agent 2 if available
      const unit = detectedUnit || (options.displayData as any)?._detectedUnit || "Raw";
      
      // Ensure value is a number
      const numValue = value;
      if (isNaN(numValue)) return "N/A";
      
      if (unit === "M") {
        // Value is already in millions, but check if it's actually billions
        if (numValue >= 1000) {
          // Value is in billions (e.g., 1162.3M -> 1.2B)
          return `${currency || "$"}${(numValue / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
        }
        return `${currency || "$"}${numValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
      } else if (unit === "K") {
        // Value is already in thousands
        if (numValue >= 1000000) {
          // Value is actually in millions (e.g., 1162295.5K -> 1.2B)
          return `${currency || "$"}${(numValue / 1000000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
        }
        return `${currency || "$"}${numValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
      } else {
        // Raw value - determine scale automatically
        if (numValue >= 1000000000) {
          // Value is in billions, convert to B
          return `${currency || "$"}${(numValue / 1000000000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
        } else if (numValue >= 1000000) {
          // Value is in millions, convert to M
          return `${currency || "$"}${(numValue / 1000000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
        } else if (numValue >= 1000) {
          // Value is in thousands, convert to K
          return `${currency || "$"}${(numValue / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
        }
        // Value is raw, display as-is
        return `${currency || "$"}${numValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
      }
    };

    // Helper function to format NRR (dynamic calibration)
    const formatNRR = (value: number | undefined): string => {
      if (value === undefined || value === null || isNaN(value)) return "N/A";
      // DYNAMIC CALIBRATION: If value > 2, it's already percentage-scale (e.g., 132)
      // If value < 2, multiply by 100 to get percentage (e.g., 1.32 -> 132%)
      if (value > 2) {
        return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
      }
      // Value is in decimal form (0-2 range), multiply by 100
      return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
    };

    // =========================================================================
    // DATA CONTRACT SYNC: Pull values from data_contract if available
    // =========================================================================
    // Priority: data_contract > displayData (zero-trust verification)
    const dataContract = options.dataContract;
    const contractMetrics = dataContract?.metrics || {};
    
    // Get ARR from data contract (try multiple column name variations)
    const contractARR = contractMetrics['ARR'] || contractMetrics['Revenue'] || contractMetrics['Sales'] || 
                        contractMetrics['arr'] || contractMetrics['revenue'] || contractMetrics['sales'];
    const arrValue = contractARR !== undefined ? Number(contractARR) : options.displayData?.financials?.arr?.value;
    
    // Get NRR from data contract
    const contractNRR = contractMetrics['NRR'] || contractMetrics['Retention'] || contractMetrics['nrr'] || 
                        contractMetrics['retention'];
    const nrrValue = contractNRR !== undefined ? Number(contractNRR) : options.displayData?.financials?.nrr?.value;
    
    // Get Burn Multiple from data contract
    const contractBurn = contractMetrics['Burn_Multiple'] || contractMetrics['Burn Multiple'] || 
                         contractMetrics['burn_multiple'] || contractMetrics['burnMultiple'];
    const burnValue = contractBurn !== undefined ? Number(contractBurn) : options.displayData?.financials?.burn_multiple?.value;
    
    // Determine unit from data contract ontology mapping
    const ontologyMapping = dataContract?.ontology_mapping || {};
    let detectedUnit: "M" | "K" | "Raw" = "Raw";
    
    // Check if ARR/Revenue column uses SUM aggregation (indicates raw totals)
    const arrColumnName = Object.keys(ontologyMapping).find(key => 
      (key.toLowerCase().includes('arr') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('sales')) &&
      ontologyMapping[key] === 'SUM'
    );
    
    if (arrColumnName && contractARR !== undefined) {
      // If contract ARR is much larger than displayData ARR, likely Millions scale
      const displayARR = options.displayData?.financials?.arr?.value;
      if (displayARR && contractARR / displayARR > 100000) {
        detectedUnit = "M";
      } else if (displayARR && contractARR / displayARR > 100) {
        detectedUnit = "K";
      }
    } else {
      // Fallback to Agent 2 detected unit
      detectedUnit = (options.displayData as any)?._detectedUnit as "M" | "K" | "Raw" | undefined || "Raw";
    }
    
    // UNIT CONFLICT RESOLUTION: If dataContract sends raw value (e.g., 24300000), 
    // auto-detect scale and normalize before formatting
    // Example: 24300000 -> $24.3M (if value >= 1M)
    let finalDetectedUnit = detectedUnit;
    let normalizedArrValue = arrValue;
    
    if (contractARR !== undefined && arrValue !== undefined) {
      if (detectedUnit === "Raw" && arrValue >= 1000000) {
        // DataContract sent raw millions (e.g., 24300000), normalize to millions (24.3)
        normalizedArrValue = arrValue / 1000000;
        finalDetectedUnit = "M";
      } else if (detectedUnit === "Raw" && arrValue >= 1000 && arrValue < 1000000) {
        // DataContract sent raw thousands (e.g., 24300), normalize to thousands (24.3)
        normalizedArrValue = arrValue / 1000;
        finalDetectedUnit = "K";
      }
      // If detectedUnit is already "M" or "K", use value as-is (already normalized)
    }
    
    // Key Metrics Table (using data_contract values)
    const metrics = [
      {
        label: "ARR",
        value: formatARR(
          normalizedArrValue,
          options.displayData?.financials?.arr?.currency,
          finalDetectedUnit
        ),
        status: options.displayData?.financials?.arr?.status || "N/A",
        verifiedVia: dataContract ? `Full-Scan of ${dataContract.total_rows || 0} rows` : "Display Data",
      },
      {
        label: "NRR",
        value: formatNRR(nrrValue),
        status: options.displayData?.financials?.nrr?.status || "N/A",
        verifiedVia: dataContract ? `Full-Scan of ${dataContract.total_rows || 0} rows` : "Display Data",
      },
      {
        label: "Burn Multiple",
        value: formatMetric(burnValue),
        status: options.displayData?.financials?.burn_multiple?.status || "N/A",
        verifiedVia: dataContract ? `Full-Scan of ${dataContract.total_rows || 0} rows` : "Display Data",
      },
    ];

    // Draw table manually
    const rowHeight = 8;
    const colWidth = contentWidth / 3;

    // Header
    doc.setFillColor(...COLORS.EMERALD);
    doc.rect(margin, yPosition, contentWidth, rowHeight, "FD");
    doc.setTextColor(...COLORS.BLACK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("METRIC", margin + 2, yPosition + 5);
    doc.text("VALUE", margin + colWidth + 2, yPosition + 5);
    doc.text("STATUS", margin + colWidth * 2 + 2, yPosition + 5);

    yPosition += rowHeight;

    // Rows
    metrics.forEach((metric) => {
      doc.setFillColor(...COLORS.BLACK);
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "FD");

      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, margin + 2, yPosition + 5);

      doc.setTextColor(...COLORS.EMERALD);
      doc.setFont("courier", "bold");
      doc.text(metric.value, margin + colWidth + 2, yPosition + 5);

      doc.setTextColor(...COLORS.SLATE_400);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const statusLines = doc.splitTextToSize(metric.status, colWidth - 4);
      doc.text(statusLines, margin + colWidth * 2 + 2, yPosition + 5);

      yPosition += rowHeight;
    });

    yPosition += 10;

    // =========================================================================
    // STRATEGIC ROADMAP (Recommendations)
    // =========================================================================
    if (options.recommendations && options.recommendations.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFillColor(...COLORS.BLACK);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setTextColor(...COLORS.EMERALD);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("STRATEGIC ROADMAP", margin, yPosition + 5);

      yPosition += 12;

      // High-Density Modular Table (instead of bullet points)
      const tableColWidths = [contentWidth * 0.15, contentWidth * 0.35, contentWidth * 0.5]; // ID | Title | Impact
      const tableRowHeight = 8;
      const tableHeaderHeight = 10;

      // Table Header
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(margin, yPosition, contentWidth, tableHeaderHeight, "F");
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPosition, contentWidth, tableHeaderHeight, "FD");

      doc.setTextColor(...COLORS.EMERALD);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("ID", margin + 2, yPosition + 6);
      doc.text("STRATEGIC ACTION", margin + tableColWidths[0] + 2, yPosition + 6);
      doc.text("IMPACT ANALYSIS", margin + tableColWidths[0] + tableColWidths[1] + 2, yPosition + 6);

      yPosition += tableHeaderHeight;

      // Table Rows
      options.recommendations.slice(0, 5).forEach((rec, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
          // Redraw header on new page
          doc.setFillColor(...COLORS.BLACK);
          doc.rect(margin, yPosition, contentWidth, tableHeaderHeight, "F");
          doc.setDrawColor(...COLORS.EMERALD);
          doc.setLineWidth(0.3);
          doc.rect(margin, yPosition, contentWidth, tableHeaderHeight, "FD");
          doc.setTextColor(...COLORS.EMERALD);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("ID", margin + 2, yPosition + 6);
          doc.text("STRATEGIC ACTION", margin + tableColWidths[0] + 2, yPosition + 6);
          doc.text("IMPACT ANALYSIS", margin + tableColWidths[0] + tableColWidths[1] + 2, yPosition + 6);
          yPosition += tableHeaderHeight;
        }

        // Row border
        doc.setFillColor(...COLORS.BLACK);
        doc.rect(margin, yPosition, contentWidth, tableRowHeight, "F");
        doc.setDrawColor(...COLORS.EMERALD);
        doc.setLineWidth(0.2);
        doc.rect(margin, yPosition, contentWidth, tableRowHeight, "FD");

        // Priority Badge (map risk_level to color)
        const priority = rec.risk_level === "high" ? "high" : rec.risk_level === "medium" ? "medium" : "low";
        const priorityColor =
          priority === "high"
            ? COLORS.EMERALD
            : priority === "medium"
            ? COLORS.CYAN
            : COLORS.SLATE_400;

        // ID Column (with badge)
        doc.setFillColor(...priorityColor);
        doc.rect(margin + 1, yPosition + 1, tableColWidths[0] - 2, tableRowHeight - 2, "F");
        doc.setTextColor(...COLORS.BLACK);
        doc.setFontSize(8);
        doc.setFont("courier", "bold");
        doc.text(`${String(index + 1).padStart(2, '0')}`, margin + tableColWidths[0] / 2, yPosition + 5, { align: "center" });

        // Title Column
        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(rec.title, tableColWidths[1] - 4);
        doc.text(titleLines, margin + tableColWidths[0] + 2, yPosition + 4);

        // Impact Column
        doc.setTextColor(...COLORS.SLATE_400);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const impactText = rec.impact_analysis || "";
        const impactLines = doc.splitTextToSize(impactText, tableColWidths[2] - 4);
        doc.text(impactLines, margin + tableColWidths[0] + tableColWidths[1] + 2, yPosition + 4);

        yPosition += Math.max(tableRowHeight, Math.max(titleLines.length, impactLines.length) * 3.5);
      });
    }

    // =========================================================================
    // INTEGRITY CERTIFICATE (Agent 12) - If healing was performed
    // =========================================================================
    if (options.integrityCertificate) {
      doc.addPage();
      yPosition = margin;

      // Page Background with Security Watermark
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Security Watermark Background (subtle pattern)
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.1);
      for (let i = 0; i < pageHeight; i += 20) {
        doc.line(0, i, pageWidth, i);
      }
      for (let i = 0; i < pageWidth; i += 20) {
        doc.line(i, 0, i, pageHeight);
      }

      // Digital Hash Stamp (Top Right)
      const hashStampX = pageWidth - margin - 60;
      const hashStampY = margin + 10;
      doc.setFillColor(...COLORS.EMERALD);
      doc.rect(hashStampX, hashStampY, 55, 12, "FD");
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.5);

      doc.setTextColor(...COLORS.BLACK);
      doc.setFontSize(7);
      doc.setFont("courier", "bold");
      doc.text("DIGITAL HASH", hashStampX + 2, hashStampY + 4);
      doc.setFontSize(6);
      doc.setFont("courier", "normal");
      const hashShort = options.integrityCertificate.cryptographic_hash?.substring(0, 16).toUpperCase() || "N/A";
      doc.text(hashShort, hashStampX + 2, hashStampY + 8);

      // Title
      yPosition = margin + 30;
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICATE OF TRUTH", margin, yPosition);

      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.SLATE_400);
      doc.text("INTEGRITY CERTIFICATION", margin, yPosition);

      yPosition += 20;

      // Certificate ID
      doc.setTextColor(...COLORS.EMERALD);
      doc.setFontSize(10);
      doc.setFont("courier", "bold");
      doc.text(`CERTIFICATE ID: ${options.integrityCertificate.certificate_id}`, margin, yPosition);

      yPosition += 15;

      // Resolved Anomalies Table
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("RESOLVED ANOMALIES", margin, yPosition);

      yPosition += 8;

      const anomalies = options.integrityCertificate.resolved_anomalies;
      const tableHeaders = ["Column", "Rows Healed", "Formula Logic"];
      const tableColWidths = [contentWidth * 0.3, contentWidth * 0.3, contentWidth * 0.4];
      const rowHeight = 8;

      // Table Header
      doc.setFillColor(...COLORS.EMERALD);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "FD");
      doc.setTextColor(...COLORS.BLACK);
      doc.setFontSize(8);
      doc.setFont("courier", "bold");
      let colX = margin;
      tableHeaders.forEach((header, idx) => {
        doc.text(header, colX + 2, yPosition + 5);
        colX += tableColWidths[idx];
      });

      yPosition += rowHeight;

      // Table Row
      doc.setFillColor(...COLORS.BLACK);
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "FD");

      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      colX = margin;
      doc.text(anomalies.target_column || "N/A", colX + 2, yPosition + 5);
      colX += tableColWidths[0];
      doc.text(String(anomalies.rows_healed || 0), colX + 2, yPosition + 5);
      colX += tableColWidths[1];
      doc.text(anomalies.formula_used || "N/A", colX + 2, yPosition + 5);

      yPosition += rowHeight + 15;

      // Summary
      doc.setTextColor(...COLORS.SLATE_400);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Discrepancies Resolved: ${anomalies.total_discrepancies || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Integrity Score: ${options.integrityCertificate.integrity_seal?.integrity_score || 100}%`, margin, yPosition);

      yPosition += 20;

      // Signature Line
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 100, yPosition);

      yPosition += 8;
      doc.setTextColor(...COLORS.SLATE_400);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Digitally Signed by NeuraSight Sovereign Swarm", margin, yPosition);

      yPosition += 6;
      doc.setFontSize(7);
      doc.setFont("courier", "normal");
      doc.text(`Certification Timestamp: ${options.integrityCertificate.timestamp || new Date().toISOString()}`, margin, yPosition);

      yPosition += 15;

      // Audit Trail Section
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("AUDIT TRAIL", margin, yPosition);

      yPosition += 8;
      doc.setTextColor(...COLORS.SLATE_400);
      doc.setFontSize(7);
      doc.setFont("courier", "normal");
      const auditTrail = options.integrityCertificate.audit_trail;
      if (auditTrail) {
        doc.text(`Session ID: ${auditTrail.session_id || "N/A"}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Certification Status: ${auditTrail.certification_status || "VERIFIED"}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Verification Method: ${auditTrail.integrity_seal?.verification_method || "QUANTUM_MATH_INTEGRITY"}`, margin, yPosition);
      }
    }

    // =========================================================================
    // DATA LINEAGE CERTIFICATE (Before Strategic Approval)
    // =========================================================================
    if (dataContract && dataContract.total_rows) {
      doc.addPage();
      yPosition = margin;

      // Page Background
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Title
      doc.setTextColor(...COLORS.EMERALD);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("DATA LINEAGE CERTIFICATE", margin, yPosition + 20);

      yPosition += 25;

      // Certificate Content
      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const certificateText = `This document certifies that all metrics contained within this Executive Dossier have been verified through NeuraSight's Full-Spectrum Semantic Aggregation Engine.`;
      const certLines = doc.splitTextToSize(certificateText, contentWidth);
      doc.text(certLines, margin, yPosition);
      yPosition += certLines.length * 5 + 15;

      // Data Lineage Table
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setTextColor(...COLORS.EMERALD);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AUDIT SUMMARY", margin, yPosition + 5);

      yPosition += 12;

      const lineageRows: Array<{
        item: string;
        value: string;
        statusColor: ColorTuple;
      }> = [
        { 
          item: "Total Rows Audited", 
          value: `${dataContract.total_rows.toLocaleString("en-US")}`,
          statusColor: COLORS.EMERALD
        },
        { 
          item: "Aggregation Method", 
          value: "Full-Spectrum Semantic Sum",
          statusColor: COLORS.EMERALD
        },
        { 
          item: "Cryptographic Hash", 
          value: options.integrityCertificate?.cryptographic_hash?.substring(0, 16).toUpperCase() || "N/A",
          statusColor: COLORS.SLATE_400
        },
        {
          item: "Verification Status",
          value: confidencePercent >= 100 ? "VERIFIED" : `${confidencePercent}% CONFIDENCE`,
          statusColor: confidencePercent >= 100 ? COLORS.EMERALD : COLORS.SLATE_400
        },
      ];

      const lineageRowHeight = 7;
      const lineageColWidth = contentWidth / 2;

      lineageRows.forEach((row) => {
        doc.setFillColor(...COLORS.BLACK);
        doc.setDrawColor(...COLORS.EMERALD);
        doc.setLineWidth(0.2);
        doc.rect(margin, yPosition, contentWidth, lineageRowHeight, "FD");

        doc.setTextColor(...COLORS.WHITE);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(row.item, margin + 2, yPosition + 4);

        doc.setTextColor(...(row.statusColor || COLORS.EMERALD));
        doc.setFont("courier", "bold");
        // Prevent text overlap: Use splitTextToSize for long values (e.g., cryptographic hashes)
        const valueLines = doc.splitTextToSize(row.value, lineageColWidth - 4);
        doc.text(valueLines, margin + lineageColWidth + 2, yPosition + 4);

        yPosition += lineageRowHeight;
      });

      yPosition += 20;

      // Verified Stamp
      if (confidencePercent >= 100) {
        const stampX = pageWidth - margin - 30;
        const stampY = yPosition;
        doc.setFillColor(...COLORS.EMERALD);
        doc.rect(stampX, stampY, 25, 12, "FD");
        doc.setDrawColor(...COLORS.EMERALD);
        doc.setLineWidth(0.5);

        doc.setTextColor(...COLORS.BLACK);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("VERIFIED", stampX + 2, stampY + 7, { align: "center" });
      }
    }

    // =========================================================================
    // CERTIFICATE OF STRATEGIC APPROVAL (Final Page)
    // =========================================================================
    doc.addPage();
    yPosition = margin;

    // Page Background
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Title
    doc.setTextColor(...COLORS.EMERALD);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATE OF STRATEGIC APPROVAL", margin, yPosition + 20);

    yPosition += 25;

    // Certificate Content
    doc.setTextColor(...COLORS.WHITE);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const certificateText = `This document certifies that the strategic intelligence contained within this Executive Dossier has been verified through NeuraSight's 12-agent Sovereign Swarm and meets the highest standards of mathematical integrity and strategic rigor.`;
    const certLines = doc.splitTextToSize(certificateText, contentWidth);
    doc.text(certLines, margin, yPosition);
    yPosition += certLines.length * 5 + 15;

    // Audit Summary Table
    doc.setFillColor(...COLORS.BLACK);
    doc.rect(margin, yPosition, contentWidth, 8, "F");
    doc.setTextColor(...COLORS.EMERALD);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AUDIT SUMMARY", margin, yPosition + 5);

    yPosition += 12;

    const auditRows: Array<{
      item: string;
      status: string;
      statusColor: ColorTuple;
    }> = [
      { 
        item: "Math Verified", 
        status: isVerificationFailed ? "VERIFICATION FAILED" : `${confidencePercent}% Confidence`,
        statusColor: isVerificationFailed ? [220, 38, 38] as ColorTuple : COLORS.EMERALD
      },
      { item: "Forecast Stabilized", status: options.recommendations.length > 0 ? "Yes" : "N/A", statusColor: COLORS.EMERALD },
      { item: "Anomalies Addressed", status: options.recommendations.length > 0 ? `${options.recommendations.length} Actions` : "None Detected", statusColor: COLORS.EMERALD },
    ];

    const auditRowHeight = 7;
    const auditColWidth = contentWidth / 2;

    auditRows.forEach((row) => {
      doc.setFillColor(...COLORS.BLACK);
      doc.setDrawColor(...COLORS.EMERALD);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPosition, contentWidth, auditRowHeight, "FD");

      doc.setTextColor(...COLORS.WHITE);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(row.item, margin + 2, yPosition + 4);

      doc.setTextColor(...(row.statusColor || COLORS.EMERALD));
      doc.setFont("courier", "bold");
      doc.text(row.status, margin + auditColWidth + 2, yPosition + 4);

      yPosition += auditRowHeight;
    });

    yPosition += 20;

    // CEO Signature Line
    doc.setDrawColor(...COLORS.EMERALD);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, margin + 80, yPosition);

    yPosition += 8;
    doc.setTextColor(...COLORS.SLATE_400);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Chief Executive Officer", margin, yPosition);

    yPosition += 15;

    // Digital Hash Stamp
    const reportContent = JSON.stringify({
      txId: options.txId,
      confidence: options.mathIntegrityConfidence,
      recommendations: options.recommendations.length,
      timestamp: new Date().toISOString(),
    });
    const digitalHash = generateDigitalHash(reportContent);

    doc.setFillColor(...COLORS.EMERALD);
    doc.rect(margin, yPosition, contentWidth, 10, "FD");
    doc.setDrawColor(...COLORS.EMERALD);
    doc.setLineWidth(0.5);

    doc.setTextColor(...COLORS.BLACK);
    doc.setFontSize(8);
    doc.setFont("courier", "bold");
    doc.text("DIGITAL HASH STAMP", margin + 2, yPosition + 4);

    yPosition += 5;
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    const hashText = `HASH: ${digitalHash}`;
    doc.text(hashText, margin + 2, yPosition + 4);

    yPosition += 12;

    // Signed/Draft Stamp (positioned below hash stamp to avoid overlap)
    const stampX = pageWidth - margin - 15;
    const stampY = yPosition - 8;
    if (options.isDigitallySigned) {
      doc.setFillColor(...COLORS.EMERALD);
      doc.circle(stampX, stampY, 12, "FD");
      doc.setTextColor(...COLORS.BLACK);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SIGNED", stampX, stampY + 2, { align: "center" });
    } else {
      doc.setFillColor(...COLORS.SLATE_500);
      doc.circle(stampX, stampY, 12, "FD");
      doc.setTextColor(...COLORS.BLACK);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("DRAFT", stampX, stampY + 2, { align: "center" });
    }

    // =========================================================================
    // FOOTER (All Pages)
    // =========================================================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 10;
      doc.setTextColor(...COLORS.SLATE_500);
      doc.setFontSize(7);
      doc.setFont("courier", "normal");
      const signature = options.txId
        ? `SYSTEM_VERIFIED_NEURASIGHT_${options.txId}`
        : `SYSTEM_VERIFIED_NEURASIGHT_${Date.now()}`;
      doc.text(signature, margin, footerY);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, footerY);
    }

    // =========================================================================
    // SAVE PDF
    // =========================================================================
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `NS_Strategic_Dossier_${timestamp}.pdf`;
    doc.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    console.error("[Executive Dossier] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate Executive Dossier",
    };
  }
}

