import React from 'react';
import { useGetRoomParticipants } from '../../hooks/useQueries';
import { Users, Video } from 'lucide-react';

interface RemoteStream {
  peerId: string;
  stream: MediaStream;
}

interface ParticipantListProps {
  roomId: string;
  currentUserPrincipal: string;
  remoteStreams: RemoteStream[];
  localStream: MediaStream | null;
}

export default function ParticipantList({
  roomId,
  currentUserPrincipal,
  remoteStreams,
  localStream,
}: ParticipantListProps) {
  const { data: participants = [], isLoading } = useGetRoomParticipants(roomId);

  const remoteStreamPeerIds = new Set(remoteStreams.map(rs => rs.peerId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'oklch(0.72 0.18 195)' }} />
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: 'oklch(0.50 0.02 260)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.45 0.02 260)' }}>
          Participants ({participants.length})
        </span>
      </div>

      <div className="space-y-1.5">
        {participants.map(([principal, username]) => {
          const principalStr = principal.toString();
          const isCurrentUser = principalStr === currentUserPrincipal;
          const hasStream = isCurrentUser ? !!localStream : remoteStreamPeerIds.has(principalStr);

          return (
            <div
              key={principalStr}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: isCurrentUser
                  ? 'oklch(0.72 0.18 195 / 0.08)'
                  : 'oklch(0.17 0.020 260)',
                border: isCurrentUser
                  ? '1px solid oklch(0.72 0.18 195 / 0.2)'
                  : '1px solid oklch(0.24 0.022 260)',
              }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: isCurrentUser
                    ? 'oklch(0.72 0.18 195 / 0.2)'
                    : 'oklch(0.22 0.025 260)',
                  color: isCurrentUser
                    ? 'oklch(0.72 0.18 195)'
                    : 'oklch(0.60 0.02 260)',
                  border: isCurrentUser
                    ? '1px solid oklch(0.72 0.18 195 / 0.3)'
                    : '1px solid oklch(0.28 0.025 260)',
                }}
              >
                {(username || '?')[0].toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: isCurrentUser ? 'oklch(0.82 0.01 260)' : 'oklch(0.75 0.01 260)' }}
                >
                  {username || principalStr.substring(0, 8) + '…'}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs font-normal" style={{ color: 'oklch(0.55 0.02 260)' }}>
                      (you)
                    </span>
                  )}
                </p>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasStream && (
                  <span aria-label="Camera active">
                    <Video className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.18 145)' }} />
                  </span>
                )}
                <div className="status-dot-active" style={{ width: '6px', height: '6px' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
