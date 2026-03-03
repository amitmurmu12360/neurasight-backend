/**
 * Source Memory - Mapping Memory System
 * ======================================
 * Stores and retrieves CSV column mappings using localStorage.
 * Generates hash from CSV headers and remembers successful mappings.
 */

// =============================================================================
// TYPES
// =============================================================================
export interface ColumnMapping {
  arr_column?: string | null;
  mql_column?: string | null;
  cac_column?: string | null;
  nrr_column?: string | null;
  company_name_column?: string | null;
}

export interface MappingMemory {
  hash: string;
  mapping: ColumnMapping;
  headers: string[];
  timestamp: number;
  fileName?: string;
}

// =============================================================================
// STORAGE KEYS
// =============================================================================
const STORAGE_KEY = "neurasight_mapping_memory";
const MAX_MEMORIES = 50; // Limit stored mappings to prevent localStorage bloat

// =============================================================================
// HASH GENERATION
// =============================================================================

/**
 * Generate hash from CSV headers
 * Creates a deterministic hash based on header names (case-insensitive, sorted)
 */
export function generateHeaderHash(headers: string[]): string {
  // Normalize headers: lowercase, sort, remove duplicates
  const normalized = headers
    .map((h) => h.toLowerCase().trim())
    .filter((h) => h.length > 0)
    .sort();
  
  // Create hash string
  const hashString = normalized.join("|");
  
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// MEMORY OPERATIONS
// =============================================================================

/**
 * Store mapping in memory
 */
export function rememberMapping(
  headers: string[],
  mapping: ColumnMapping,
  fileName?: string
): void {
  try {
    const hash = generateHeaderHash(headers);
    
    const memory: MappingMemory = {
      hash,
      mapping,
      headers,
      timestamp: Date.now(),
      fileName,
    };
    
    // Get existing memories
    const existingMemories = getStoredMemories();
    
    // Remove duplicate hash if exists
    const filtered = existingMemories.filter((m) => m.hash !== hash);
    
    // Add new memory at the beginning
    const updatedMemories = [memory, ...filtered].slice(0, MAX_MEMORIES);
    
    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMemories));
    
    console.log(`[Source Memory] Mapping stored for hash: ${hash}`);
  } catch (error) {
    console.warn("[Source Memory] Failed to store mapping:", error);
    // Don't throw - localStorage might be disabled
  }
}

/**
 * Retrieve remembered mapping for headers
 */
export function getRememberedMapping(
  headers: string[]
): ColumnMapping | null {
  try {
    const hash = generateHeaderHash(headers);
    const memories = getStoredMemories();
    
    // Find matching memory
    const memory = memories.find((m) => m.hash === hash);
    
    if (memory) {
      console.log(`[Source Memory] Found remembered mapping for hash: ${hash}`);
      return memory.mapping;
    }
    
    return null;
  } catch (error) {
    console.warn("[Source Memory] Failed to retrieve mapping:", error);
    return null;
  }
}

/**
 * Get all stored memories (for debugging/admin)
 */
export function getAllMemories(): MappingMemory[] {
  return getStoredMemories();
}

/**
 * Clear all stored memories
 */
export function clearAllMemories(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[Source Memory] All memories cleared");
  } catch (error) {
    console.warn("[Source Memory] Failed to clear memories:", error);
  }
}

/**
 * Get stored memories from localStorage
 */
function getStoredMemories(): MappingMemory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored) as MappingMemory[];
    
    // Validate and filter out invalid entries
    return parsed.filter((m) => {
      return (
        m &&
        typeof m === "object" &&
        typeof m.hash === "string" &&
        typeof m.mapping === "object" &&
        Array.isArray(m.headers)
      );
    });
  } catch (error) {
    console.warn("[Source Memory] Failed to parse stored memories:", error);
    return [];
  }
}

/**
 * Check if headers match a stored structure (fuzzy match)
 */
export function hasSimilarStructure(headers: string[]): boolean {
  const hash = generateHeaderHash(headers);
  const memories = getStoredMemories();
  
  // Exact match
  if (memories.some((m) => m.hash === hash)) {
    return true;
  }
  
  // Fuzzy match: Check if at least 70% of headers match
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  
  for (const memory of memories) {
    const normalizedMemoryHeaders = memory.headers.map((h) => h.toLowerCase().trim());
    const matchingHeaders = normalizedHeaders.filter((h) =>
      normalizedMemoryHeaders.includes(h)
    );
    
    const similarity = matchingHeaders.length / Math.max(normalizedHeaders.length, normalizedMemoryHeaders.length);
    
    if (similarity >= 0.7) {
      return true;
    }
  }
  
  return false;
}

