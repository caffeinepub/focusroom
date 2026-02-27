import React, { useEffect, useRef } from 'react';
import { User } from 'lucide-react';

interface RemoteStream {
  peerId: string;
  stream: MediaStream;
}

interface VideoTileProps {
  stream: MediaStream;
  label: string;
  isLocal?: boolean;
  muted?: boolean;
}

function VideoTile({ stream, label, isLocal = false, muted = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="video-tile group relative w-full" style={{ aspectRatio: '16/9' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="w-full h-full object-cover"
        style={{ filter: 'blur(4px)' }}
      />

      {/* Gradient overlay at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, oklch(0.08 0.01 260 / 0.9), transparent)',
        }}
      />

      {/* Name label */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-md"
          style={{
            background: 'oklch(0.10 0.01 260 / 0.75)',
            color: 'oklch(0.92 0.01 260)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {label}
          {isLocal && (
            <span style={{ color: 'oklch(0.72 0.18 195)' }}> (you)</span>
          )}
        </span>
      </div>

      {/* Live indicator for local */}
      {isLocal && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{
              background: 'oklch(0.10 0.01 260 / 0.75)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="status-dot-active" style={{ width: '6px', height: '6px' }} />
            <span className="text-xs font-medium" style={{ color: 'oklch(0.65 0.18 145)' }}>LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTile({ label }: { label: string }) {
  return (
    <div
      className="video-tile relative w-full flex flex-col items-center justify-center gap-3"
      style={{ aspectRatio: '16/9', background: 'oklch(0.10 0.012 260)' }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'oklch(0.18 0.022 260)' }}
      >
        <User className="w-7 h-7" style={{ color: 'oklch(0.45 0.02 260)' }} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'oklch(0.45 0.02 260)' }}>
        {label}
      </span>
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  localUsername: string;
  participants: Array<{ principal: string; username: string }>;
}

export default function VideoGrid({ localStream, remoteStreams, localUsername, participants }: VideoGridProps) {
  // Deduplicate remote streams by peerId — keep only the last entry per peer
  const deduplicatedRemoteStreams = React.useMemo(() => {
    const seen = new Map<string, RemoteStream>();
    for (const rs of remoteStreams) {
      seen.set(rs.peerId, rs);
    }
    return Array.from(seen.values());
  }, [remoteStreams]);

  // Build the list of tiles to show:
  // 1. Local stream tile (only if local stream is active)
  // 2. Remote stream tiles (deduplicated, excluding local user's principal)
  // 3. Empty tiles for participants without streams (excluding local user)
  const localPrincipal = participants.find(p => p.username === localUsername)?.principal;

  const remoteParticipants = participants.filter(p => p.principal !== localPrincipal);

  const remoteStreamPeerIds = new Set(deduplicatedRemoteStreams.map(rs => rs.peerId));

  // Participants without a stream (show empty tile)
  const participantsWithoutStream = remoteParticipants.filter(
    p => !remoteStreamPeerIds.has(p.principal)
  );

  const totalTiles =
    (localStream ? 1 : 0) +
    deduplicatedRemoteStreams.length +
    participantsWithoutStream.length;

  // Determine grid columns based on tile count
  const gridCols =
    totalTiles <= 1 ? 'grid-cols-1' :
    totalTiles <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
    totalTiles <= 4 ? 'grid-cols-2' :
    'grid-cols-2 lg:grid-cols-3';

  if (totalTiles === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-48 rounded-xl"
        style={{ background: 'oklch(0.10 0.012 260)', border: '1px solid oklch(0.22 0.022 260)' }}
      >
        <User className="w-10 h-10 mb-3" style={{ color: 'oklch(0.35 0.02 260)' }} />
        <p className="text-sm" style={{ color: 'oklch(0.45 0.02 260)' }}>
          No participants with cameras yet
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {/* Local stream tile — rendered exactly once */}
      {localStream && (
        <VideoTile
          key="local"
          stream={localStream}
          label={localUsername}
          isLocal={true}
          muted={true}
        />
      )}

      {/* Remote stream tiles — deduplicated by peerId */}
      {deduplicatedRemoteStreams.map((rs) => {
        const participant = participants.find(p => p.principal === rs.peerId);
        const label = participant?.username || rs.peerId.substring(0, 8) + '…';
        return (
          <VideoTile
            key={`remote-${rs.peerId}`}
            stream={rs.stream}
            label={label}
            isLocal={false}
            muted={false}
          />
        );
      })}

      {/* Empty tiles for participants without streams */}
      {participantsWithoutStream.map((p) => (
        <EmptyTile
          key={`empty-${p.principal}`}
          label={p.username || p.principal.substring(0, 8) + '…'}
        />
      ))}
    </div>
  );
}
