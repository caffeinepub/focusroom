import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function TimerDisplay() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const formatted = h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: 'oklch(0.18 0.022 260)',
        border: '1px solid oklch(0.26 0.025 260)',
      }}
    >
      <Clock className="w-3.5 h-3.5" style={{ color: 'oklch(0.72 0.18 195)' }} />
      <span
        className="text-sm font-bold font-mono tabular-nums"
        style={{ color: 'oklch(0.82 0.01 260)' }}
      >
        {formatted}
      </span>
    </div>
  );
}
