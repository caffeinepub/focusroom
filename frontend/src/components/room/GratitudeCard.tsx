import { useState } from 'react';
import ScratchCardOverlay from './ScratchCardOverlay';

interface GratitudeCardProps {
  message: string;
  onDismiss: () => void;
}

export default function GratitudeCard({ message, onDismiss }: GratitudeCardProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const handleIconClick = () => {
    setOverlayOpen(true);
  };

  const handleClose = () => {
    setOverlayOpen(false);
    onDismiss();
  };

  return (
    <>
      {/* Non-blocking corner icon */}
      <div
        className="fixed bottom-20 right-5 z-40 group"
        style={{ pointerEvents: 'auto' }}
      >
        <button
          onClick={handleIconClick}
          className="relative flex items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 active:scale-95"
          style={{
            width: 52,
            height: 52,
            background: 'oklch(0.18 0.04 85)',
            border: '1.5px solid oklch(0.78 0.18 85 / 0.6)',
            boxShadow: '0 0 18px oklch(0.78 0.18 85 / 0.25), 0 2px 8px oklch(0 0 0 / 0.5)',
          }}
          aria-label="Open gratitude card"
          title="A message for you ✦"
        >
          <img
            src="/assets/generated/gold-card-icon.dim_128x128.png"
            alt="Gratitude card"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 4px oklch(0.78 0.18 85 / 0.6))' }}
          />
          {/* Subtle pulse ring */}
          <span
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              animation: 'gratitude-ring-pulse 2.4s ease-in-out infinite',
              border: '1.5px solid oklch(0.78 0.18 85 / 0.4)',
            }}
          />
        </button>

        {/* Tooltip */}
        <div
          className="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            background: 'oklch(0.20 0.04 85)',
            color: 'oklch(0.78 0.18 85)',
            border: '1px solid oklch(0.78 0.18 85 / 0.3)',
          }}
        >
          A message for you ✦
        </div>
      </div>

      {/* Scratch overlay */}
      {overlayOpen && (
        <ScratchCardOverlay message={message} onClose={handleClose} />
      )}
    </>
  );
}
