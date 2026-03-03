/**
 * PDF Generator - Executive Report Export
 * =======================================
 * High-end PDF export using jsPDF and html2canvas.
 * Pure OLED Black (#000000) background with Emerald/Cyan accents.
 * Captures Strategic Insight and Metric Cards grid.
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { DashboardState } from "@/types/dashboard";

// =============================================================================
// TYPES
// =============================================================================
export interface PDFExportOptions {
  title?: string;
  persona?: string;
  analysis?: string;
  metrics?: DashboardState;
  dataSource?: "CSV" | "GOOGLE_SHEETS" | "DEMO";
  strategicInsight?: string;
  metricCards?: Array<{
    title: string;
    value: string;
    subValue?: string;
    status?: string;
  }>;
}

// =============================================================================
// COLORS (OLED Black Theme)
// =============================================================================
const COLORS = {
  BLACK: "#000000",
  EMERALD: "#10b981",
  CYAN: "#06b6d4",
  WHITE: "#ffffff",
  SLATE_400: "#94a3b8",
  SLATE_500: "#64748b",
};

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generate Executive PDF Report
 */
export async function generateExecutivePDFReport(
  options: PDFExportOptions
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
    // HEADER SECTION
    // =========================================================================
    doc.setFillColor(0, 0, 0); // Pure Black
    doc.rect(0, 0, pageWidth, 40, "F");

    // Title
    doc.setTextColor(16, 185, 129); // Emerald
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(options.title || "NeuraSight Executive Report", margin, yPosition + 10);

    // Persona & Data Source
    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFont("helvetica", "normal");
    
    const personaText = options.persona ? `${options.persona} Lens` : "";
    const sourceText = options.dataSource === "CSV" 
      ? "Imported via CSV" 
      : options.dataSource === "GOOGLE_SHEETS"
      ? "Live from Google Sheets"
      : "Demo Data";
    
    doc.text(`${personaText} · ${sourceText}`, margin, yPosition);
    
    // Data Source Badge (colored)
    const sourceColor = options.dataSource === "CSV" 
      ? [6, 182, 212] // Cyan
      : [16, 185, 129]; // Emerald
    
    doc.setFillColor(sourceColor[0], sourceColor[1], sourceColor[2]);
    doc.circle(pageWidth - margin - 3, yPosition - 3, 1.5, "F");
    
    yPosition += 15;

    // =========================================================================
    // STRATEGIC INSIGHT SECTION
    // =========================================================================
    if (options.strategicInsight || options.analysis) {
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      
      // Section Header
      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Strategic Insight", margin, yPosition + 5);
      
      yPosition += 10;
      
      // Content
      const insightText = options.strategicInsight || options.analysis || "";
      doc.setTextColor(255, 255, 255); // White
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(insightText, contentWidth);
      doc.text(lines, margin, yPosition);
      
      yPosition += lines.length * 5 + 10;
    }

    // =========================================================================
    // METRIC CARDS GRID
    // =========================================================================
    if (options.metricCards && options.metricCards.length > 0) {
      // Section Header
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      
      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Key Metrics", margin, yPosition + 5);
      
      yPosition += 12;
      
      // Grid Layout: 2 columns
      const cardWidth = (contentWidth - 5) / 2;
      const cardHeight = 35;
      let cardIndex = 0;
      
      for (const card of options.metricCards.slice(0, 6)) { // Max 6 cards (3 rows x 2 cols)
        const col = cardIndex % 2;
        const row = Math.floor(cardIndex / 2);
        const xPos = margin + col * (cardWidth + 5);
        const yPos = yPosition + row * (cardHeight + 5);
        
        // Check if we need a new page
        if (yPos + cardHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          continue;
        }
        
        // Card Background (Black with subtle border)
        doc.setFillColor(0, 0, 0);
        doc.setDrawColor(16, 185, 129); // Emerald border
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPos, cardWidth, cardHeight, "FD");
        
        // Card Title
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(card.title.toUpperCase(), xPos + 3, yPos + 5);
        
        // Card Value (Emerald)
        doc.setTextColor(16, 185, 129); // Emerald
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, xPos + 3, yPos + 12);
        
        // Sub Value
        if (card.subValue) {
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(card.subValue, xPos + 3, yPos + 16);
        }
        
        // Status
        if (card.status) {
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.setFontSize(7);
          doc.setFont("helvetica", "italic");
          const statusLines = doc.splitTextToSize(card.status, cardWidth - 6);
          doc.text(statusLines, xPos + 3, yPos + 22);
        }
        
        cardIndex++;
      }
      
      yPosition += Math.ceil(options.metricCards.length / 2) * (cardHeight + 5) + 10;
    }

    // =========================================================================
    // FOOTER
    // =========================================================================
    const footerY = pageHeight - 10;
    doc.setFillColor(0, 0, 0);
    doc.rect(0, footerY - 5, pageWidth, 5, "F");
    
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated by NeuraSight AI · ${new Date().toLocaleDateString()}`,
      margin,
      footerY
    );

    // =========================================================================
    // SAVE PDF
    // =========================================================================
    const filename = `NeuraSight-Executive-Report-${Date.now()}.pdf`;
    doc.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    console.error("[PDF Generator] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
}

/**
 * Generate PDF from HTML Element (Alternative Method)
 */
export async function generatePDFFromElement(
  elementId: string,
  options: { title?: string; filename?: string }
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      return {
        success: false,
        error: `Element with id "${elementId}" not found`,
      };
    }

    // Capture element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: "#000000", // Pure Black
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: imgHeight > imgWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    const filename = options.filename || `NeuraSight-Report-${Date.now()}.pdf`;
    doc.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    console.error("[PDF Generator] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF from element",
    };
  }
}

