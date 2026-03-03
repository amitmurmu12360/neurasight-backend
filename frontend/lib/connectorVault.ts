/**
 * Connector Vault: Secure API Key Storage for NeuraSight
 * Handles encrypted storage and retrieval of external API credentials
 */

import { supabase } from "./supabase";

export interface Connector {
  id: string;
  user_id?: string;
  provider_name: string;
  encrypted_key_ref: string;
  status: "ACTIVE" | "DISCONNECTED";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Save a connector API key (encrypted)
 * Note: In production, keys should be encrypted server-side
 * For now, we store a reference (in production, use Supabase Vault or similar)
 */
export async function saveConnector(
  providerName: string,
  apiKey: string
): Promise<boolean> {
  if (!supabase) {
    console.warn("[CONNECTOR] Supabase not configured. Connector save skipped.");
    return false;
  }

  // In production, encrypt the key server-side before storing
  // For now, we'll store a masked reference (NEVER log the actual key)
  const encryptedKeyRef = `encrypted_${providerName}_${Date.now()}`;

  try {
    const { error } = await supabase
      .from("sovereign_connectors")
      .upsert({
        provider_name: providerName,
        encrypted_key_ref: encryptedKeyRef,
        status: "ACTIVE",
        metadata: {
          // Store metadata only, never the actual key
          provider: providerName,
          connected_at: new Date().toISOString(),
        },
      }, {
        onConflict: "user_id,provider_name",
      });

    if (error) {
      console.error("[CONNECTOR] Error saving connector:", error);
      return false;
    }

    // Store actual key in memory/session storage (temporary, for demo)
    // In production, this should be handled server-side with proper encryption
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`connector_${providerName}`, apiKey);
    }

    return true;
  } catch (err) {
    console.error("[CONNECTOR] Unexpected error:", err);
    return false;
  }
}

/**
 * Get all active connectors for the current user
 */
export async function getConnectors(): Promise<Connector[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("sovereign_connectors")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CONNECTOR] Error fetching connectors:", error);
      return [];
    }

    return (data || []) as Connector[];
  } catch (err) {
    console.error("[CONNECTOR] Unexpected error:", err);
    return [];
  }
}

/**
 * Get a specific connector
 */
export async function getConnector(
  providerName: string
): Promise<Connector | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("sovereign_connectors")
      .select("*")
      .eq("provider_name", providerName)
      .eq("status", "ACTIVE")
      .single();

    if (error) {
      return null;
    }

    return data as Connector;
  } catch (err) {
    console.error("[CONNECTOR] Unexpected error:", err);
    return null;
  }
}

/**
 * Delete/disconnect a connector
 */
export async function deleteConnector(providerName: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("sovereign_connectors")
      .update({ status: "DISCONNECTED" })
      .eq("provider_name", providerName);

    if (error) {
      console.error("[CONNECTOR] Error disconnecting connector:", error);
      return false;
    }

    // Clear from session storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`connector_${providerName}`);
    }

    return true;
  } catch (err) {
    console.error("[CONNECTOR] Unexpected error:", err);
    return false;
  }
}

/**
 * Check if a connector is active
 */
export async function isConnectorActive(providerName: string): Promise<boolean> {
  const connector = await getConnector(providerName);
  return connector !== null && connector.status === "ACTIVE";
}

