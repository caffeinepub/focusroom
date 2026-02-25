import { Trophy } from 'lucide-react';

interface LeaderboardPanelProps {
  xpMap: Record<string, number>;
  currentUsername: string;
}

export default function LeaderboardPanel({ xpMap, currentUsername }: LeaderboardPanelProps) {
  const entries = Object.entries(xpMap)
    .map(([username, xp]) => ({ username, xp }))
    .sort((a, b) => b.xp - a.xp);

  // Ensure current user is always shown even with 0 XP
  const hasCurrentUser = entries.some((e) => e.username === currentUsername);
  if (currentUsername && !hasCurrentUser) {
    entries.push({ username: currentUsername, xp: 0 });
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5 text-room-muted" />
        <span className="text-xs font-mono tracking-wider uppercase text-room-muted">
          Leaderboard
        </span>
      </div>

      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs font-mono text-room-muted/40 text-center py-2">
            No XP yet
          </p>
        ) : (
          entries.map((entry, idx) => {
            const isCurrentUser = entry.username === currentUsername;
            return (
              <div
                key={entry.username}
                className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                  isCurrentUser ? 'bg-focus-accent/10 border border-focus-accent/20' : 'bg-room-surface border border-room-border'
                }`}
              >
                <span className="text-xs w-4 flex-shrink-0">
                  {medals[idx] ?? `${idx + 1}.`}
                </span>
                <span className={`text-xs font-mono flex-1 truncate ${isCurrentUser ? 'text-focus-accent' : 'text-room-text'}`}>
                  {entry.username}
                </span>
                <span className="text-xs font-mono text-room-muted tabular-nums">
                  {entry.xp}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs font-mono text-room-muted/40 text-center pt-1">
        Session XP
      </p>
    </div>
  );
}
