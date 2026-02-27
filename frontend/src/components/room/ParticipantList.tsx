import { Users, Camera } from 'lucide-react';
import { useGetRoomParticipants } from '../../hooks/useQueries';
import type { RemoteStream } from '../../hooks/useWebRTC';

interface ParticipantListProps {
  roomCode: string;
  currentUsername: string;
  localPrincipal: string;
  localCameraActive: boolean;
  remoteStreams: RemoteStream[];
}

export default function ParticipantList({
  roomCode,
  currentUsername,
  localPrincipal,
  localCameraActive,
  remoteStreams,
}: ParticipantListProps) {
  const { data: participants = [], isLoading } = useGetRoomParticipants(roomCode);

  // Build a set of peer IDs with active remote streams
  const activeCameraPeerIds = new Set(remoteStreams.map((rs) => rs.peerId));

  return (
    <div className="bg-room-surface border border-room-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-room-muted" />
        <span className="text-xs font-mono tracking-wider uppercase text-room-muted">
          Participants
        </span>
        {!isLoading && (
          <span className="text-xs font-mono text-room-muted/50 ml-auto">
            {participants.length}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {isLoading && (
          <div className="text-xs font-mono text-room-muted/40 py-1">Loading…</div>
        )}

        {!isLoading && participants.length === 0 && (
          <div className="text-xs font-mono text-room-muted/40 py-1">No participants yet</div>
        )}

        {participants.map(([principal, username]) => {
          const peerId = principal.toString();
          const isYou = peerId === localPrincipal;
          const displayName = isYou ? currentUsername || username : username || peerId.slice(0, 8);
          const hasCameraActive = isYou ? localCameraActive : activeCameraPeerIds.has(peerId);

          return (
            <div key={peerId} className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isYou ? 'bg-focus-accent' : 'bg-focus-accent/60'
                }`}
              />
              <span className="text-xs font-mono text-room-text truncate flex-1">
                {displayName}
                {isYou && (
                  <span className="text-room-muted/50 ml-1">(you)</span>
                )}
              </span>
              {hasCameraActive && (
                <span aria-label="Camera on">
                  <Camera className="w-3 h-3 text-focus-accent flex-shrink-0" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
