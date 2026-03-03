/**
 * useDashboardData Hook
 * ======================
 * Custom hook to fetch dashboard data from the NeuraSight Backend API.
 *
 * Features:
 * - Type-safe data fetching
 * - Loading and error states
 * - Manual refetch capability
 */

import { useCallback, useEffect, useState } from "react";
import type { DashboardState, UseDashboardDataReturn } from "@/types/dashboard";

// Backend API base URL
const API_BASE_URL = "http://localhost:8000";

/**
 * Fetches the dashboard state from the backend API.
 *
 * @returns Hook state containing data, loading status, error, and refetch function.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardData();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * if (data) return <Dashboard data={data} />;
 * ```
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch dashboard data: ${response.status} ${response.statusText}`
        );
      }

      const json: DashboardState = await response.json();
      setData(json);
      console.log("✅ Dashboard data fetched successfully:", json);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching dashboard data";

      setError(errorMessage);
      console.error("❌ Dashboard fetch error:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useDashboardData;

