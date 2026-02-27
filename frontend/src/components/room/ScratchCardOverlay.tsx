import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface ScratchCardOverlayProps {
  message: string;
  onClose: () => void;
}

const REVEAL_THRESHOLD = 0.55; // 55% scratched triggers auto-reveal

export default function ScratchCardOverlay({ message, onClose }: ScratchCardOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const revealedRef = useRef(false);

  // Draw the gold scratch surface
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Gold metallic gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'oklch(0.82 0.18 85)');
    grad.addColorStop(0.3, 'oklch(0.90 0.20 90)');
    grad.addColorStop(0.6, 'oklch(0.78 0.16 80)');
    grad.addColorStop(1, 'oklch(0.70 0.14 75)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle texture lines
    ctx.strokeStyle = 'oklch(0.65 0.12 80 / 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < h; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Hint text
    ctx.fillStyle = 'oklch(0.30 0.08 80 / 0.7)';
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ Scratch to reveal ✦', w / 2, h / 2);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();

    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = 38;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Also draw a circle at current point for tap-style scratching
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    lastPos.current = { x, y };

    // Check reveal threshold
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    const ratio = transparent / (canvas.width * canvas.height);
    if (ratio >= REVEAL_THRESHOLD) {
      revealedRef.current = true;
      setRevealed(true);
      // Clear the canvas entirely for a clean reveal
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    setIsDrawing(true);
    const pos = getPos(e, e.currentTarget);
    lastPos.current = pos;
    scratch(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || revealed) return;
    scratch(getPos(e, e.currentTarget).x, getPos(e, e.currentTarget).y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e, e.currentTarget);
    lastPos.current = pos;
    scratch(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || revealed) return;
    e.preventDefault();
    scratch(getPos(e, e.currentTarget).x, getPos(e, e.currentTarget).y);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0 0 / 0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col items-center gap-0 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: 340,
          background: 'oklch(0.16 0.02 85)',
          border: '1.5px solid oklch(0.78 0.18 85 / 0.5)',
          boxShadow: '0 0 40px oklch(0.78 0.18 85 / 0.18), 0 8px 32px oklch(0 0 0 / 0.6)',
        }}
      >
        {/* Header */}
        <div
          className="w-full flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid oklch(0.78 0.18 85 / 0.2)' }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'oklch(0.78 0.18 85)' }}
          >
            ✦ Gratitude
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors"
            style={{ color: 'oklch(0.55 0 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'oklch(0.78 0.18 85)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'oklch(0.55 0 0)')}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scratch area */}
        <div className="relative w-full" style={{ height: 200 }}>
          {/* Message underneath */}
          <div
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ background: 'oklch(0.14 0.02 85)' }}
          >
            <p
              className="text-center font-mono text-sm leading-relaxed"
              style={{ color: 'oklch(0.88 0.12 85)' }}
            >
              {message}
            </p>
          </div>

          {/* Scratch canvas overlay */}
          <canvas
            ref={canvasRef}
            width={340}
            height={200}
            className="absolute inset-0 w-full h-full"
            style={{
              cursor: revealed ? 'default' : 'crosshair',
              touchAction: 'none',
              opacity: revealed ? 0 : 1,
              transition: revealed ? 'opacity 0.5s ease' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Footer */}
        <div
          className="w-full px-5 py-3 flex items-center justify-center"
          style={{ borderTop: '1px solid oklch(0.78 0.18 85 / 0.2)' }}
        >
          {revealed ? (
            <button
              onClick={onClose}
              className="text-xs font-mono tracking-wider uppercase px-5 py-1.5 rounded-full transition-all"
              style={{
                background: 'oklch(0.78 0.18 85)',
                color: 'oklch(0.10 0 0)',
              }}
            >
              Alhamdulillah ✦
            </button>
          ) : (
            <span className="text-xs font-mono" style={{ color: 'oklch(0.45 0 0)' }}>
              Scratch the surface above
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
