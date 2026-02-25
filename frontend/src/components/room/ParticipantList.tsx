import { Users } from 'lucide-react';

interface ParticipantListProps {
  roomCode: string;
  currentUsername: string;
}

export default function ParticipantList({ roomCode: _roomCode, currentUsername }: ParticipantListProps) {
  // Since the backend doesn't expose a getParticipants endpoint,
  // we show the current user as the only known participant locally.
  const participants = currentUsername
    ? [{ username: currentUsername, isYou: true }]
    : [];

  return (
    <div className="bg-room-surface border border-room-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-room-muted" />
        <span className="text-xs font-mono tracking-wider uppercase text-room-muted">
          Participants
        </span>
      </div>
      <div className="space-y-1">
        {participants.map((p) => (
          <div key={p.username} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-focus-accent/60 flex-shrink-0" />
            <span className="text-xs font-mono text-room-text truncate">
              {p.username}
              {p.isYou && <span className="text-room-muted/50 ml-1">(you)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
