import { useEffect, useRef, useState } from 'react';
import { Phase } from '../../backend';

interface DistractionLockIndicatorProps {
  phase: Phase | null;
}

const AWAY_THRESHOLD_MS = 10_000; // 10 seconds

export default function DistractionLockIndicator({ phase }: DistractionLockIndicatorProps) {
  const [showWarning, setShowWarning] = useState(false);
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awayStartRef = useRef<number | null>(null);

  const isFocus = phase === Phase.focus;

  useEffect(() => {
    if (!isFocus) {
      // Clear everything when not in focus
      setShowWarning(false);
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
      awayStartRef.current = null;
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User left the tab
        awayStartRef.current = Date.now();
        awayTimerRef.current = setTimeout(() => {
          setShowWarning(true);
        }, AWAY_THRESHOLD_MS);
      } else {
        // User returned
        if (awayTimerRef.current) {
          clearTimeout(awayTimerRef.current);
          awayTimerRef.current = null;
        }
        awayStartRef.current = null;
        setShowWarning(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
    };
  }, [isFocus]);

  if (!showWarning) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-room-surface border border-yellow-500/40 rounded-full px-3 py-1.5 shadow-lg"
      title="You've been away from the tab during focus time"
    >
      <span className="distraction-dot w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
      <span className="text-xs font-mono text-yellow-400/90 hidden sm:inline">
        Stay focused!
      </span>
    </div>
  );
}
