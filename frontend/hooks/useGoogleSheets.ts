/**
 * useGoogleSheets Hook
 * ====================
 * Manages Google Sheets connection state and data fetching.
 */

import { useState, useCallback, useEffect } from "react";
import type { DashboardState } from "@/types/dashboard";
import {
  fetchDashboardFromSheets,
  DEFAULT_DASHBOARD_DATA,
  extractSheetId,
  createSheetUrl,
  type SheetMetadata,
} from "@/lib/googleSheets";
import { supabase, getProfile, updateProfile } from "@/lib/supabase";

// =============================================================================
// TYPES
// =============================================================================
export interface ConnectionState {
  isConnected: boolean;
  sheetId: string | null;
  sheetUrl: string | null;
  metadata: SheetMetadata | null;
}

export interface UseGoogleSheetsReturn {
  /** Dashboard data (from sheets or default) */
  data: DashboardState | null;
  /** Whether data is being fetched */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Connection state info */
  connection: ConnectionState;
  /** Whether using demo data */
  isDemoMode: boolean;
  /** Connect to a Google Sheet */
  connect: (sheetIdOrUrl: string) => Promise<boolean>;
  /** Disconnect and use demo data */
  disconnect: () => void;
  /** Refresh data from connected sheet */
  refresh: () => Promise<void>;
}

// Local storage key for persisting connection
const STORAGE_KEY = "neurasight_sheet_connection";

// =============================================================================
// HOOK
// =============================================================================
export function useGoogleSheets(): UseGoogleSheetsReturn {
  const [data, setData] = useState<DashboardState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: false,
    sheetId: null,
    sheetUrl: null,
    metadata: null,
  });

  // Initialize from Supabase on mount (auto-fetch saved sheet)
  useEffect(() => {
    const initializeConnection = async () => {
      // Try Supabase first (for persistence)
      if (supabase) {
        try {
          // Use a default user ID (can be enhanced with auth later)
          const userId = "neurasight-user-1"; // Default user for now
          const profile = await getProfile(userId);
          
          if (profile?.last_connected_sheet_id) {
            console.log("[Supabase] Found saved sheet ID, auto-connecting...");
            await connect(profile.last_connected_sheet_id);
            return;
          }
        } catch (err) {
          console.warn("[Supabase] Failed to load profile, falling back to localStorage:", err);
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.sheetId) {
            await connect(parsed.sheetId);
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }
      
      // Use demo data if no saved connection
      setData(DEFAULT_DASHBOARD_DATA);
    };

    initializeConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Connect to a Google Sheet via backend API
   */
  const connect = useCallback(async (sheetIdOrUrl: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract sheet ID
      const sheetId = extractSheetId(sheetIdOrUrl);

      // Call backend endpoint for intelligent mapping
      const response = await fetch("http://127.0.0.1:8000/api/connect/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spreadsheet_id: sheetId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || "Failed to connect to sheet");
        setIsLoading(false);
        return false;
      }

      const result = await response.json();

      if (!result.success) {
        setError(result.error || result.message || "Connection failed");
        setIsLoading(false);
        return false;
      }

      // Backend has updated GLOBAL_DASHBOARD_STATE, now fetch it
      const dashboardResponse = await fetch("http://127.0.0.1:8000/api/dashboard");
      if (!dashboardResponse.ok) {
        setError("Failed to fetch updated dashboard data");
        setIsLoading(false);
        return false;
      }

      const dashboardData = await dashboardResponse.json();

      // Save to Supabase (primary) and localStorage (fallback)
      const userId = "neurasight-user-1"; // Default user for now
      if (supabase) {
        try {
          await updateProfile(userId, { last_connected_sheet_id: sheetId });
          console.log("[Supabase] Saved sheet ID to profile");
        } catch (err) {
          console.warn("[Supabase] Failed to save to Supabase, using localStorage:", err);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ sheetId }));
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ sheetId }));
      }

      // Update state with mapped data
      setData(dashboardData);
      setConnection({
        isConnected: true,
        sheetId,
        sheetUrl: sheetId ? createSheetUrl(sheetId) : null,
        metadata: {
          sheetName: `Sheet: ${sheetId ? sheetId.substring(0, 20) : "Unknown"}...`,
          lastUpdated: new Date(),
          rowCount: result.sample_data?.length || 0,
        },
      });
      setIsLoading(false);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Disconnect and revert to demo data
   */
  const disconnect = useCallback(async () => {
    // Clear from Supabase and localStorage
    const userId = "neurasight-user-1";
    if (supabase) {
      try {
        await updateProfile(userId, { last_connected_sheet_id: null });
      } catch (err) {
        console.warn("[Supabase] Failed to clear from Supabase:", err);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setData(DEFAULT_DASHBOARD_DATA);
    setConnection({
      isConnected: false,
      sheetId: null,
      sheetUrl: null,
      metadata: null,
    });
    setError(null);
  }, []);

  /**
   * Refresh data from connected sheet via backend
   */
  const refresh = useCallback(async () => {
    if (!connection.sheetId) {
      setData(DEFAULT_DASHBOARD_DATA);
      return;
    }

    // Reconnect to refresh data
    await connect(connection.sheetId);
  }, [connection.sheetId, connect]);

  return {
    data,
    isLoading,
    error,
    connection,
    isDemoMode: !connection.isConnected,
    connect,
    disconnect,
    refresh,
  };
}

export default useGoogleSheets;

