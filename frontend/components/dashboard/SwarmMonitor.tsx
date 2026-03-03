"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Agent Activity Type (matches orchestrator output)
 */
export interface AgentActivity {
  agentId: string;
  agentName: string;
  status: "idle" | "active" | "success" | "error";
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Raw Activity from API (before formatting)
 */
interface RawActivity {
  agentId: string;
  agentName: string;
  status: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * SwarmMonitor Hook
 * 
 * Manages agent activities state and provides functions to update
 * activities from orchestrator responses.
 */
export function useSwarmMonitor() {
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);

  /**
   * Reset agent activities (clear all)
   */
  const resetActivities = useCallback(() => {
    setAgentActivities([]);
  }, []);

  /**
   * Update activities from swarm API response
   * 
   * Formats raw activities from the orchestrator and updates state
   */
  const updateActivitiesFromSwarm = useCallback((rawActivities: RawActivity[]) => {
    const formattedActivities: AgentActivity[] = rawActivities.map((a) => ({
      agentId: a.agentId,
      agentName: a.agentName,
      status: a.status as "idle" | "active" | "success" | "error",
      message: a.message,
      timestamp: new Date(a.timestamp),
      metadata: a.metadata,
    }));
    setAgentActivities(formattedActivities);
  }, []);

  /**
   * Update activities directly (for custom updates)
   */
  const updateActivities = useCallback((activities: AgentActivity[]) => {
    setAgentActivities(activities);
  }, []);

  return {
    agentActivities,
    resetActivities,
    updateActivitiesFromSwarm,
    updateActivities,
  };
}

/**
 * SwarmMonitor Component
 * 
 * This is an invisible component that manages swarm state.
 * Use the hook (useSwarmMonitor) for direct state access.
 */
export default function SwarmMonitor({
  onActivitiesChange,
}: {
  onActivitiesChange?: (activities: AgentActivity[]) => void;
}) {
  const { agentActivities } = useSwarmMonitor();

  useEffect(() => {
    if (onActivitiesChange) {
      onActivitiesChange(agentActivities);
    }
  }, [agentActivities, onActivitiesChange]);

  return null;
}

