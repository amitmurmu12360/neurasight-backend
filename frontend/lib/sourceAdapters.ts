/**
 * Universal Source Adapters - Hybrid Mapping Engine
 * ===================================================
 * Source-agnostic data ingestion layer with full-stream CSV scanning
 * and hybrid confidence scoring for intelligent column mapping.
 */

export type DataSourceType = "GOOGLE_SHEETS" | "CSV" | "SQL" | "API" | "UNKNOWN";

export interface ColumnMapping {
  column: string;
  metric: "ARR" | "NRR" | "CAC" | "LTV" | "MQL" | "BURN" | "UNKNOWN";
  confidence: number; // 0-100
  reasoning: string;
}

export interface SchemaDetection {
  hasARR: boolean;
  hasNRR: boolean;
  hasCAC: boolean;
  hasLTV?: boolean;
  arrColumn?: string;
  nrrColumn?: string;
  cacColumn?: string;
  ltvColumn?: string;
  detectedIndustry?: "SAAS" | "RETAIL" | "ECOMMERCE" | "UNKNOWN";
  mappings: ColumnMapping[];
  overallConfidence: number; // 0-100
  anomalies: Array<{
    type: "missing_column" | "data_type_mismatch" | "pattern_anomaly";
    column?: string;
    message: string;
  }>;
}

export interface ParsedData {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  schema: SchemaDetection;
}

/**
 * Universal Parser Class - Hybrid Mapping Engine
 * ===============================================
 * Handles parsing and schema detection for multiple data sources
 * with full-stream scanning and intelligent confidence scoring.
 */
export class UniversalParser {
  /**
   * Parse CSV file with full-stream scanning
   * Uses FileReader API for complete file analysis (not just top rows)
   */
  async parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          
          if (!text || text.trim().length === 0) {
            reject(new Error("CSV file is empty"));
            return;
          }
          
          // Full-stream parsing: Process entire file
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error("CSV file contains no data"));
            return;
          }
          
          // Parse headers (first line)
          const headers = this.parseCSVLine(lines[0]);
          const cleanHeaders = headers.map(h => h.trim());
          
          if (cleanHeaders.length === 0) {
            reject(new Error("CSV file has no headers"));
            return;
          }
          
          // Parse ALL rows (full-stream)
          const rows: Array<Record<string, unknown>> = [];
          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > 0) {
              const row: Record<string, unknown> = {};
              cleanHeaders.forEach((header, idx) => {
                const value = values[idx]?.trim() || '';
                row[header] = this.parseValue(value);
              });
              rows.push(row);
            }
          }
          
          // Hybrid schema detection with confidence scoring
          const schema = this.detectSchemaHybrid(cleanHeaders, rows);
          
          resolve({
            headers: cleanHeaders,
            rows,
            rowCount: rows.length,
            schema,
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Failed to parse CSV"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read CSV file"));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse a CSV line (handles quoted values, escaped quotes)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Push last field
    result.push(current);
    return result;
  }
  
  /**
   * Parse value (try number, boolean, or keep string)
   */
  private parseValue(value: string): string | number | boolean {
    if (!value || value.trim() === '') return '';
    
    // Try boolean
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    
    // Try number (handle currency symbols and percentages)
    const cleaned = value.replace(/[$,\s%]/g, '');
    const num = Number(cleaned);
    if (!isNaN(num) && cleaned !== '') {
      return num;
    }
    
    // Return as string
    return value;
  }
  
  /**
   * Hybrid Schema Detection with Confidence Scoring
   * Combines semantic, structural, and pattern matching
   */
  detectSchemaHybrid(headers: string[], rows: Array<Record<string, unknown>>): SchemaDetection {
    const headerLower = headers.map(h => h.toLowerCase());
    const mappings: ColumnMapping[] = [];
    const anomalies: SchemaDetection['anomalies'] = [];
    
    // Target metrics and their semantic keywords
    const metricKeywords: Record<string, string[]> = {
      ARR: ['arr', 'annual recurring revenue', 'recurring revenue', 'mrr', 'monthly recurring revenue'],
      NRR: ['nrr', 'net revenue retention', 'revenue retention', 'retention rate'],
      CAC: ['cac', 'customer acquisition cost', 'acquisition cost', 'cac payback'],
      LTV: ['ltv', 'lifetime value', 'customer lifetime value', 'ltv/cac'],
      MQL: ['mql', 'marketing qualified leads', 'qualified leads', 'leads'],
      BURN: ['burn', 'burn rate', 'monthly burn', 'cash burn'],
    };
    
    // Analyze each header for metric matching
    headers.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      let bestMatch: { metric: string; confidence: number; reasoning: string } | null = null;
      
      // 1. SEMANTIC MATCH (40% weight)
      for (const [metric, keywords] of Object.entries(metricKeywords)) {
        for (const keyword of keywords) {
          if (headerLower.includes(keyword)) {
            const semanticScore = keyword.length / Math.max(headerLower.length, keyword.length) * 40;
            if (!bestMatch || semanticScore > bestMatch.confidence) {
              bestMatch = {
                metric,
                confidence: semanticScore,
                reasoning: `Semantic match: "${keyword}" found in column name`,
              };
            }
          }
        }
      }
      
      // 2. STRUCTURAL MATCH (35% weight) - Validate data type
      if (rows.length > 0) {
        const sampleValues = rows.slice(0, Math.min(100, rows.length)).map(row => row[header]);
        const numericCount = sampleValues.filter(v => typeof v === 'number').length;
        const numericRatio = numericCount / sampleValues.length;
        
        // ARR, CAC, LTV should be numeric
        if (bestMatch && ['ARR', 'CAC', 'LTV', 'BURN'].includes(bestMatch.metric)) {
          const structuralScore = numericRatio * 35;
          if (bestMatch) {
            bestMatch.confidence += structuralScore;
            bestMatch.reasoning += `. Structural validation: ${(numericRatio * 100).toFixed(1)}% numeric values`;
          }
        }
        
        // NRR should be percentage-like (0-200 range typically)
        if (bestMatch && bestMatch.metric === 'NRR') {
          const numericValues = sampleValues.filter(v => typeof v === 'number') as number[];
          const inRange = numericValues.filter(v => v >= 0 && v <= 200).length;
          const rangeScore = numericValues.length > 0 ? (inRange / numericValues.length) * 35 : 0;
          if (bestMatch) {
            bestMatch.confidence += rangeScore;
            bestMatch.reasoning += `. Range validation: ${(rangeScore / 35 * 100).toFixed(1)}% values in expected range`;
          }
        }
      }
      
      // 3. PATTERN MATCH (25% weight) - Detect currency/percentage patterns
      if (rows.length > 0) {
        const sampleValues = rows.slice(0, Math.min(50, rows.length)).map(row => String(row[header] || ''));
        const hasCurrency = sampleValues.some(v => /[$€£¥]/.test(v));
        const hasPercentage = sampleValues.some(v => /%/.test(v));
        
        let patternScore = 0;
        if (bestMatch) {
          if (['ARR', 'CAC', 'LTV'].includes(bestMatch.metric) && hasCurrency) {
            patternScore = 25;
            bestMatch.reasoning += `. Pattern: Currency symbols detected`;
          } else if (bestMatch.metric === 'NRR' && hasPercentage) {
            patternScore = 25;
            bestMatch.reasoning += `. Pattern: Percentage symbols detected`;
          }
          bestMatch.confidence += patternScore;
        }
      }
      
      // Record mapping if confidence > 50%
      if (bestMatch && bestMatch.confidence > 50) {
        mappings.push({
          column: header,
          metric: bestMatch.metric as ColumnMapping['metric'],
          confidence: Math.min(100, Math.round(bestMatch.confidence)),
          reasoning: bestMatch.reasoning,
        });
      }
    });
    
    // Build schema detection result
    const schema: SchemaDetection = {
      hasARR: mappings.some(m => m.metric === 'ARR'),
      hasNRR: mappings.some(m => m.metric === 'NRR'),
      hasCAC: mappings.some(m => m.metric === 'CAC'),
      hasLTV: mappings.some(m => m.metric === 'LTV'),
      mappings,
      overallConfidence: mappings.length > 0 
        ? Math.round(mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length)
        : 0,
      anomalies: [],
    };
    
    // Set column names from mappings
    const arrMapping = mappings.find(m => m.metric === 'ARR');
    if (arrMapping) schema.arrColumn = arrMapping.column;
    
    const nrrMapping = mappings.find(m => m.metric === 'NRR');
    if (nrrMapping) schema.nrrColumn = nrrMapping.column;
    
    const cacMapping = mappings.find(m => m.metric === 'CAC');
    if (cacMapping) schema.cacColumn = cacMapping.column;
    
    const ltvMapping = mappings.find(m => m.metric === 'LTV');
    if (ltvMapping) schema.ltvColumn = ltvMapping.column;
    
    // Detect anomalies
    if (!schema.hasARR) {
      anomalies.push({
        type: "missing_column",
        message: "ARR column not detected. Expected columns: 'ARR', 'Annual Recurring Revenue', or 'Revenue'",
      });
    }
    
    if (rows.length > 0 && schema.hasARR && arrMapping) {
      const arrValues = rows.map(r => r[arrMapping.column]).filter(v => typeof v === 'number') as number[];
      if (arrValues.length === 0) {
        anomalies.push({
          type: "data_type_mismatch",
          column: arrMapping.column,
          message: `ARR column "${arrMapping.column}" contains no numeric values`,
        });
      }
    }
    
    // Detect industry based on headers and data patterns
    const hasSales = headerLower.some(h => h.includes('sales'));
    const hasProfit = headerLower.some(h => h.includes('profit'));
    const hasInventory = headerLower.some(h => h.includes('inventory') || h.includes('stock'));
    
    if ((hasSales && hasProfit) || hasInventory) {
      schema.detectedIndustry = "RETAIL";
    } else if (schema.hasARR && schema.hasNRR) {
      schema.detectedIndustry = "SAAS";
    } else {
      schema.detectedIndustry = "UNKNOWN";
    }
    
    schema.anomalies = anomalies;
    
    return schema;
  }
  
  /**
   * Legacy detectSchema method (backward compatibility)
   */
  detectSchema(headers: string[], rows: Array<Record<string, unknown>>): SchemaDetection {
    return this.detectSchemaHybrid(headers, rows);
  }
}

/**
 * Singleton instance
 */
export const universalParser = new UniversalParser();
