import { useEffect, useRef } from 'react';
import { CameraOff } from 'lucide-react';
import type { RemoteStream } from '../../hooks/useWebRTC';

interface VideoTileProps {
  stream: MediaStream;
  username: string;
  isYou?: boolean;
}

function VideoTile({ stream, username, isYou }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {
      // Non-fatal: autoplay may be blocked
    });
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative bg-room-surface border border-room-border rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isYou}
          style={{
            filter: 'blur(12px) brightness(0.8) contrast(1.2)',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
        {/* Username badge */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="text-xs font-mono text-room-muted/70 bg-room-bg/60 px-1.5 py-0.5 rounded">
            {username}
            {isYou && <span className="text-focus-accent ml-1">(you)</span>}
          </span>
        </div>
        {/* Active badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-focus-accent/20 text-focus-accent border border-focus-accent/30">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localUsername: string;
  remoteStreams: RemoteStream[];
}

export default function VideoGrid({ localStream, localUsername, remoteStreams }: VideoGridProps) {
  const hasAnyStream = localStream || remoteStreams.length > 0;

  if (!hasAnyStream) return null;

  const totalTiles = (localStream ? 1 : 0) + remoteStreams.length;

  const gridClass =
    totalTiles === 1
      ? 'grid-cols-1'
      : totalTiles === 2
      ? 'grid-cols-2'
      : totalTiles <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className="bg-room-surface border border-room-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-focus-accent animate-pulse" />
        <span className="text-xs font-mono tracking-wider uppercase text-room-muted">
          Live Cameras
        </span>
        <span className="text-xs font-mono text-room-muted/50 ml-auto">{totalTiles} active</span>
      </div>

      <div className={`grid ${gridClass} gap-2`}>
        {localStream && (
          <VideoTile
            stream={localStream}
            username={localUsername}
            isYou
          />
        )}
        {remoteStreams.map((rs) => (
          <VideoTile
            key={rs.peerId}
            stream={rs.stream}
            username={rs.username}
          />
        ))}
      </div>

      {remoteStreams.length === 0 && localStream && (
        <p className="text-xs font-mono text-room-muted/40 text-center py-1">
          Waiting for others to turn on their cameras…
        </p>
      )}
    </div>
  );
}

interface EmptyVideoGridProps {
  show: boolean;
}

export function EmptyVideoGridPlaceholder({ show }: EmptyVideoGridProps) {
  if (!show) return null;
  return (
    <div className="bg-room-surface border border-room-border rounded-lg p-4 flex flex-col items-center gap-2 text-center">
      <CameraOff className="w-6 h-6 text-room-muted/30" />
      <span className="text-xs font-mono text-room-muted/40">
        No cameras active
      </span>
    </div>
  );
}
