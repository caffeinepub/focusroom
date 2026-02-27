import { useState, useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS = 15_000;

interface UseConnectionTimeoutOptions {
  isConnecting: boolean;
}

interface UseConnectionTimeoutReturn {
  hasTimedOut: boolean;
  clearConnectionTimeout: () => void;
}

export function useConnectionTimeout({ isConnecting }: UseConnectionTimeoutOptions): UseConnectionTimeoutReturn {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearConnectionTimeout = useCallback(() => {
    setHasTimedOut(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isConnecting) {
      // Start timeout when connecting begins
      timerRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, TIMEOUT_MS);
    } else {
      // Clear timeout when connecting ends (success or not)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Reset timed-out state when no longer connecting
      setHasTimedOut(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isConnecting]);

  return { hasTimedOut, clearConnectionTimeout };
}
