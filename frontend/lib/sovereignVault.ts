/**
 * Sovereign Vault: Persistence Layer for NeuraSight
 * Handles session management, governance logs, and agentic memory storage
 * 
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase is unavailable
 */

import { supabase } from "./supabase";

// =============================================================================
// LOCAL FALLBACK: Check for Supabase availability
// =============================================================================
function isSupabaseAvailable(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}

// =============================================================================
// LOCALSTORAGE FALLBACK: Session storage
// =============================================================================
const STORAGE_PREFIX = 'neurasight_vault_';

function getLocalStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getLocalSessions(): SovereignSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getLocalStorageKey('sessions'));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalSession(session: SovereignSession): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getLocalSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id || s.tx_id === session.tx_id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(getLocalStorageKey('sessions'), JSON.stringify(sessions));
  } catch (err) {
    console.warn('[VAULT] LocalStorage save failed:', err);
  }
}

function getLocalGovernanceLogs(sessionId: string): GovernanceLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getLocalStorageKey(`governance_${sessionId}`));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalGovernanceLog(log: GovernanceLog): void {
  if (typeof window === 'undefined') return;
  try {
    const logs = getLocalGovernanceLogs(log.session_id);
    logs.push(log);
    localStorage.setItem(getLocalStorageKey(`governance_${log.session_id}`), JSON.stringify(logs));
  } catch (err) {
    console.warn('[VAULT] LocalStorage governance save failed:', err);
  }
}

function getLocalAgenticMemory(sessionId: string): AgenticMemory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getLocalStorageKey(`memory_${sessionId}`));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalAgenticMemory(memory: AgenticMemory): void {
  if (typeof window === 'undefined') return;
  try {
    const memories = getLocalAgenticMemory(memory.session_id);
    const existingIndex = memories.findIndex(m => m.id === memory.id);
    if (existingIndex >= 0) {
      memories[existingIndex] = memory;
    } else {
      memories.push(memory);
    }
    localStorage.setItem(getLocalStorageKey(`memory_${memory.session_id}`), JSON.stringify(memories));
  } catch (err) {
    console.warn('[VAULT] LocalStorage memory save failed:', err);
  }
}

export interface SovereignSession {
  id: string;
  tx_id: string;
  health_score: number;
  industry: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

export interface GovernanceLog {
  id: string;
  session_id: string;
  action_type: "READ_ONLY" | "WRITE_BACK" | "AUTO_FIX";
  granted_by: string;
  granted_at: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AgenticMemory {
  id: string;
  session_id: string;
  agent_id: number;
  agent_name: string;
  debate_payload: Record<string, unknown>;
  strategic_pivot?: string;
  created_at: string;
}

/**
 * Generate a unique Sovereign TX-ID
 * Format: NS-YYYYMMDD-HHMMSS-RANDOM
 */
export function generateSovereignTxId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `NS-${datePart}-${timePart}-${randomPart}`;
}

/**
 * Create a new Sovereign Session
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 * MOCK MODE: Returns NS-LOCAL-99 session if Supabase fails
 */
export async function createSovereignSession(
  healthScore: number,
  industry: string,
  metadata?: Record<string, unknown>
): Promise<SovereignSession | null> {
  // Check if Supabase is available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // MOCK MODE: Return NS-LOCAL-99 session if env vars missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[VAULT] Supabase environment variables missing. Using MockSession NS-LOCAL-99.");
    const mockSession: SovereignSession = {
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: healthScore,
      industry: industry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { ...metadata, offline_mode: true },
    };
    saveLocalSession(mockSession);
    return mockSession;
  }

  if (!supabase) {
    console.warn("[VAULT] Supabase client not initialized. Using MockSession NS-LOCAL-99.");
    const mockSession: SovereignSession = {
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: healthScore,
      industry: industry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { ...metadata, offline_mode: true },
    };
    saveLocalSession(mockSession);
    return mockSession;
  }

  let txId = generateSovereignTxId();

  try {
    // Try to create session with generated TX-ID
    let { data, error } = await supabase
      .from("sovereign_sessions")
      .insert({
        tx_id: txId,
        health_score: healthScore,
        industry_detected: industry,
        metadata: metadata || {},
      })
      .select()
      .single();

    // If TX-ID generation fails (e.g., SQL function not available), fallback to UUID
    if (error && (error.code === "P0001" || error.message?.includes("function") || error.message?.includes("tx_id"))) {
      console.warn("[VAULT] TX-ID generation failed, using UUID fallback:", JSON.stringify(error, null, 2));
      
      // Generate UUID fallback
      const uuidFallback = `NS-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      txId = uuidFallback;

      // Retry with UUID fallback
      const retryResult = await supabase
        .from("sovereign_sessions")
        .insert({
          tx_id: txId,
          health_score: healthScore,
          industry_detected: industry,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (retryResult.error) {
        throw retryResult.error;
      }

      data = retryResult.data;
    } else if (error) {
      throw error;
    }

    if (data) {
      return data as SovereignSession;
    }
  } catch (err) {
    // Network error or fetch failure - fallback to MockSession NS-LOCAL-99
    console.warn("[VAULT] Supabase fetch failed, using MockSession NS-LOCAL-99:", err);
    const mockSession: SovereignSession = {
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: healthScore,
      industry: industry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { ...metadata, offline_mode: true },
    };
    saveLocalSession(mockSession);
    return mockSession;
  }

  // Fallback if no data returned - return MockSession NS-LOCAL-99
  const mockSession: SovereignSession = {
    id: "NS-LOCAL-99",
    tx_id: "NS-LOCAL-99",
    health_score: healthScore,
    industry: industry,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: { ...metadata, offline_mode: true },
  };
  saveLocalSession(mockSession);
  return mockSession;
}

/**
 * Get the latest session for the current user
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 * MOCK MODE: Returns NS-LOCAL-99 if no sessions found
 */
export async function getLatestSession(): Promise<SovereignSession | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    const localSessions = getLocalSessions();
    if (localSessions.length > 0) {
      return localSessions[0];
    }
    // Return MockSession NS-LOCAL-99 if no local sessions
    return {
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: 0,
      industry: "OFFLINE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { offline_mode: true },
    };
  }

  try {
    const { data, error } = await supabase
      .from("sovereign_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return data as SovereignSession;
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    const localSessions = getLocalSessions();
    if (localSessions.length > 0) {
      return localSessions[0];
    }
    // Return MockSession NS-LOCAL-99 if no local sessions
    return {
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: 0,
      industry: "OFFLINE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { offline_mode: true },
    };
  }
}

/**
 * Get last N sessions for history
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 * MOCK MODE: Returns NS-LOCAL-99 session if no history found
 */
export async function getSessionHistory(
  limit: number = 5
): Promise<SovereignSession[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    const localSessions = getLocalSessions();
    if (localSessions.length > 0) {
      return localSessions.slice(0, limit);
    }
    // Return MockSession NS-LOCAL-99 if no local sessions
    return [{
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: 0,
      industry: "OFFLINE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { offline_mode: true },
    }];
  }

  try {
    const { data, error } = await supabase
      .from("sovereign_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []) as SovereignSession[];
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    const localSessions = getLocalSessions();
    if (localSessions.length > 0) {
      return localSessions.slice(0, limit);
    }
    // Return MockSession NS-LOCAL-99 if no local sessions
    return [{
      id: "NS-LOCAL-99",
      tx_id: "NS-LOCAL-99",
      health_score: 0,
      industry: "OFFLINE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { offline_mode: true },
    }];
  }
}

/**
 * Log a governance action
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 */
export async function logGovernanceAction(
  sessionId: string,
  actionType: "READ_ONLY" | "WRITE_BACK" | "AUTO_FIX",
  grantedBy: string,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<GovernanceLog | null> {
  const mockLog: GovernanceLog = {
    id: `local_${Date.now()}`,
    session_id: sessionId,
    action_type: actionType,
    granted_by: grantedBy,
    granted_at: new Date().toISOString(),
    reason: reason,
    metadata: metadata || {},
  };

  if (!isSupabaseAvailable() || !supabase) {
    console.warn("[VAULT] Supabase not available. Using localStorage fallback.");
    saveLocalGovernanceLog(mockLog);
    return mockLog;
  }

  try {
    const { data, error } = await supabase
      .from("governance_log")
      .insert({
        session_id: sessionId,
        action_type: actionType,
        granted_by: grantedBy,
        reason: reason,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as GovernanceLog;
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    saveLocalGovernanceLog(mockLog);
    return mockLog;
  }
}

/**
 * Store agentic memory (12-agent debate)
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 */
export async function storeAgenticMemory(
  sessionId: string,
  agentId: number,
  agentName: string,
  debatePayload: Record<string, unknown>,
  strategicPivot?: string
): Promise<AgenticMemory | null> {
  const mockMemory: AgenticMemory = {
    id: `local_${Date.now()}_${agentId}`,
    session_id: sessionId,
    agent_id: agentId,
    agent_name: agentName,
    debate_payload: debatePayload,
    strategic_pivot: strategicPivot,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseAvailable() || !supabase) {
    saveLocalAgenticMemory(mockMemory);
    return mockMemory;
  }

  try {
    const { data, error } = await supabase
      .from("agentic_memory")
      .insert({
        session_id: sessionId,
        agent_id: agentId,
        agent_name: agentName,
        thought_payload: debatePayload,
        strategic_pivot: strategicPivot,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AgenticMemory;
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    saveLocalAgenticMemory(mockMemory);
    return mockMemory;
  }
}

/**
 * Retrieve agentic memory for a session
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 */
export async function getAgenticMemory(
  sessionId: string
): Promise<AgenticMemory[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return getLocalAgenticMemory(sessionId);
  }

  try {
    const { data, error } = await supabase
      .from("agentic_memory")
      .select("*")
      .eq("session_id", sessionId)
      .order("agent_id", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as AgenticMemory[];
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    return getLocalAgenticMemory(sessionId);
  }
}

/**
 * Get governance status for a session
 * NETWORK RESILIENCY: Falls back to localStorage if Supabase unavailable
 */
export async function getGovernanceStatus(
  sessionId: string
): Promise<GovernanceLog | null> {
  if (!isSupabaseAvailable() || !supabase) {
    const localLogs = getLocalGovernanceLogs(sessionId);
    return localLogs.length > 0 ? localLogs[0] : null;
  }

  try {
    const { data, error } = await supabase
      .from("governance_log")
      .select("*")
      .eq("session_id", sessionId)
      .order("granted_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No governance log found - check localStorage
      const localLogs = getLocalGovernanceLogs(sessionId);
      return localLogs.length > 0 ? localLogs[0] : null;
    }

    return data as GovernanceLog;
  } catch (err) {
    console.warn("[VAULT] Supabase fetch failed, using localStorage fallback:", err);
    const localLogs = getLocalGovernanceLogs(sessionId);
    return localLogs.length > 0 ? localLogs[0] : null;
  }
}

/**
 * Connector Types
 */
export interface Connector {
  id: string;
  user_id: string;
  provider_name: string;
  encrypted_key_ref: string;
  status: "ACTIVE" | "DISCONNECTED";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get all connectors for the current user
 */
export async function getConnectors(): Promise<Connector[]> {
  if (!supabase) {
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("sovereign_connectors")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[VAULT] Error fetching connectors:", error);
    return [];
  }

  return (data || []) as Connector[];
}

/**
 * Save or update a connector (API key encrypted server-side)
 */
export async function saveConnector(
  userId: string,
  providerName: string,
  apiKey: string
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    // Check if connector exists
    const { data: existing } = await supabase
      .from("sovereign_connectors")
      .select("id")
      .eq("user_id", userId)
      .eq("provider_name", providerName)
      .single();

    // For now, store a reference (in production, encrypt server-side)
    // This is a placeholder - actual encryption should happen server-side
    const encryptedKeyRef = `encrypted_${Buffer.from(apiKey).toString("base64").slice(0, 20)}`;

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("sovereign_connectors")
        .update({
          encrypted_key_ref: encryptedKeyRef,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider_name", providerName);

      if (error) {
        console.error("[VAULT] Error updating connector:", error);
        return false;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("sovereign_connectors")
        .insert({
          user_id: userId,
          provider_name: providerName,
          encrypted_key_ref: encryptedKeyRef,
          status: "ACTIVE",
        });

      if (error) {
        console.error("[VAULT] Error inserting connector:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("[VAULT] Error saving connector:", err);
    return false;
  }
}

/**
 * Delete/disconnect a connector
 */
export async function deleteConnector(
  userId: string,
  providerName: string
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("sovereign_connectors")
    .update({ status: "DISCONNECTED" })
    .eq("user_id", userId)
    .eq("provider_name", providerName);

  if (error) {
    console.error("[VAULT] Error disconnecting connector:", error);
    return false;
  }

  return true;
}

/**
 * Get active connectors
 */
export async function getActiveConnectors(): Promise<Connector[]> {
  const connectors = await getConnectors();
  return connectors.filter(c => c.status === "ACTIVE");
}

/**
 * Get all connectors for a specific user
 * This is the main function used by page.tsx
 */
export async function getSovereignConnectors(userId: string): Promise<Connector[]> {
  if (!supabase) {
    console.warn("[VAULT] Supabase not configured. Cannot fetch connectors.");
    return [];
  }

  const { data, error } = await supabase
    .from("sovereign_connectors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[VAULT] Error fetching connectors:", error);
    return [];
  }

  return (data || []) as Connector[];
}

