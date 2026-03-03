/**
 * useInsightLock Hook
 * ====================
 * Implements "Narrative Fatigue Prevention" by locking urgent insights
 * for a minimum duration before allowing new ones.
 *
 * Rules:
 * - Critical/Warning insights are locked for LOCK_DURATION_MS
 * - Stable insights can be updated immediately
 * - Lock can be manually released via unlockInsight()
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompositeInsight } from "@/lib/intelligence";

// =============================================================================
// CONFIGURATION
// =============================================================================
const LOCK_DURATION_MS = 12000; // 12 seconds lock for urgent insights

// =============================================================================
// TYPES
// =============================================================================
export interface InsightLockState {
  /** The currently displayed insight */
  displayedInsight: CompositeInsight | null;
  /** Whether the insight is currently locked */
  isLocked: boolean;
  /** Remaining lock time in seconds */
  lockTimeRemaining: number;
  /** Timestamp when lock expires */
  lockExpiresAt: number | null;
}

export interface UseInsightLockReturn extends InsightLockState {
  /** Update the insight (respects lock) */
  updateInsight: (newInsight: CompositeInsight) => void;
  /** Force unlock the current insight */
  unlockInsight: () => void;
}

// =============================================================================
// HOOK
// =============================================================================
export function useInsightLock(
  initialInsight: CompositeInsight | null
): UseInsightLockReturn {
  const [displayedInsight, setDisplayedInsight] =
    useState<CompositeInsight | null>(initialInsight);
  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  const lockTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  // Countdown timer for UI display
  useEffect(() => {
    if (!isLocked || !lockExpiresAt) {
      setLockTimeRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, lockExpiresAt - Date.now());
      setLockTimeRemaining(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        if (countdownRef.current) window.clearInterval(countdownRef.current);
      }
    };

    updateCountdown();
    countdownRef.current = window.setInterval(updateCountdown, 100);

    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [isLocked, lockExpiresAt]);

  /**
   * Locks the insight for LOCK_DURATION_MS
   */
  const lockInsight = useCallback(() => {
    // Clear any existing timer
    if (lockTimerRef.current) {
      window.clearTimeout(lockTimerRef.current);
    }

    const expiresAt = Date.now() + LOCK_DURATION_MS;
    setIsLocked(true);
    setLockExpiresAt(expiresAt);

    // Auto-unlock after duration
    lockTimerRef.current = window.setTimeout(() => {
      setIsLocked(false);
      setLockExpiresAt(null);
      lockTimerRef.current = null;
    }, LOCK_DURATION_MS);
  }, []);

  /**
   * Update the insight (respects lock rules)
   */
  const updateInsight = useCallback(
    (newInsight: CompositeInsight) => {
      // If locked, only allow update if new insight is MORE severe
      if (isLocked && displayedInsight) {
        const severityRank = { stable: 0, warning: 1, critical: 2 };
        const currentRank = severityRank[displayedInsight.severity];
        const newRank = severityRank[newInsight.severity];

        // Only allow upgrade to more severe
        if (newRank <= currentRank) {
          console.log(
            `🔒 Insight locked: Ignoring ${newInsight.severity} (current: ${displayedInsight.severity})`
          );
          return;
        }

        console.log(
          `🔓 Severity escalation: ${displayedInsight.severity} → ${newInsight.severity}`
        );
      }

      // Update the displayed insight
      setDisplayedInsight(newInsight);

      // Lock if urgent (critical or warning)
      if (newInsight.severity !== "stable") {
        lockInsight();
        console.log(
          `🔒 Insight locked for ${LOCK_DURATION_MS / 1000}s:`,
          newInsight.hook.slice(0, 50)
        );
      } else {
        // Stable insights don't get locked
        setIsLocked(false);
        setLockExpiresAt(null);
        if (lockTimerRef.current) {
          window.clearTimeout(lockTimerRef.current);
          lockTimerRef.current = null;
        }
      }
    },
    [isLocked, displayedInsight, lockInsight]
  );

  /**
   * Force unlock the current insight
   */
  const unlockInsight = useCallback(() => {
    setIsLocked(false);
    setLockExpiresAt(null);
    if (lockTimerRef.current) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    console.log("🔓 Insight manually unlocked");
  }, []);

  return {
    displayedInsight,
    isLocked,
    lockTimeRemaining,
    lockExpiresAt,
    updateInsight,
    unlockInsight,
  };
}

export default useInsightLock;

