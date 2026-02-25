import { useEffect, useRef, useState } from 'react';
import { Phase } from '../../backend';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

interface TimerDisplayProps {
  phase: Phase | null;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isLoading: boolean;
  onStart: () => void;
  isStarting: boolean;
}

const FOCUS_TOTAL = 25 * 60;
const BREAK_TOTAL = 5 * 60;

// SVG ring constants
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({
  phase,
  minutes,
  seconds,
  totalSeconds,
  isLoading,
  onStart,
  isStarting,
}: TimerDisplayProps) {
  const isFocus = phase === Phase.focus;
  const isBreak = phase === Phase.pause;
  const isIdle = phase === null;

  const pad = (n: number) => String(n).padStart(2, '0');

  // Glow animation on focus start
  const [glowing, setGlowing] = useState(false);
  const prevPhaseRef = useRef<Phase | null>(null);

  useEffect(() => {
    if (isFocus && prevPhaseRef.current !== Phase.focus) {
      setGlowing(true);
      const t = setTimeout(() => setGlowing(false), 1600);
      return () => clearTimeout(t);
    }
    prevPhaseRef.current = phase;
  }, [phase, isFocus]);

  // Progress ring calculation
  const phaseDuration = isFocus ? FOCUS_TOTAL : isBreak ? BREAK_TOTAL : FOCUS_TOTAL;
  const progress = isIdle ? 1 : Math.min(1, Math.max(0, totalSeconds / phaseDuration));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ringColor = isFocus ? 'oklch(0.78 0.14 85)' : isBreak ? 'oklch(0.72 0.10 160)' : 'oklch(0.30 0 0)';

  return (
    <div className="bg-room-surface border border-room-border rounded-lg p-4 text-center space-y-3">
      {/* Phase Label */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isFocus ? 'bg-focus-accent' : isBreak ? 'bg-break-accent' : 'bg-room-muted/40'
          }`}
        />
        <span className="text-xs font-mono tracking-widest uppercase text-room-muted">
          {isFocus ? 'Focus' : isBreak ? 'Break' : 'Idle'}
        </span>
      </div>

      {/* Timer ring + countdown */}
      <div className="relative flex items-center justify-center">
        {/* SVG Progress Ring */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 120 120"
          className="absolute"
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="oklch(0.22 0 0)"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={isIdle ? 0 : dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease',
              opacity: isIdle ? 0.15 : 0.85,
            }}
          />
        </svg>

        {/* Glow overlay */}
        {glowing && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none timer-glow"
            style={{ width: 140, height: 140, margin: 'auto' }}
          />
        )}

        {/* Countdown */}
        <div className="relative z-10 w-[140px] h-[140px] flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-room-muted" />
          ) : (
            <div
              className={`font-mono text-4xl font-bold tabular-nums tracking-tight ${
                isFocus ? 'text-focus-accent' : isBreak ? 'text-break-accent' : 'text-room-muted/40'
              }`}
            >
              {pad(minutes)}:{pad(seconds)}
            </div>
          )}
        </div>
      </div>

      {/* Phase description */}
      <p className="text-xs font-mono text-room-muted/60">
        {isFocus
          ? 'Stay focused · Chat is blurred'
          : isBreak
          ? 'Take a breath · Chat is open'
          : '25 min focus · 5 min break'}
      </p>

      {/* Start button (shown when idle) */}
      {isIdle && (
        <Button
          onClick={onStart}
          disabled={isStarting}
          size="sm"
          className="w-full bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-wider uppercase mt-1"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-2" />
              Start Session
            </>
          )}
        </Button>
      )}
    </div>
  );
}
