import React from 'react';
import { useGetRoomParticipants } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal } from 'lucide-react';
import type { UserProfile } from '../../backend';

interface LeaderboardEntry {
  principal: string;
  username: string;
  xp: number;
}

interface LeaderboardPanelProps {
  roomId: string;
  currentUserPrincipal: string;
}

export default function LeaderboardPanel({ roomId, currentUserPrincipal }: LeaderboardPanelProps) {
  const { data: participants = [] } = useGetRoomParticipants(roomId);
  const { actor, isFetching: actorFetching } = useActor();

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', roomId, participants.length],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await Promise.all(
        participants.map(async ([principal, username]) => {
          try {
            const profile: UserProfile | null = await actor.getUserProfile(principal);
            return {
              principal: principal.toString(),
              username,
              xp: profile ? Number(profile.xp) : 0,
            };
          } catch {
            return { principal: principal.toString(), username, xp: 0 };
          }
        })
      );
      return entries.sort((a, b) => b.xp - a.xp);
    },
    enabled: !!actor && !actorFetching && participants.length > 0,
    refetchInterval: 30000,
  });

  const rankStyles = [
    { label: '🥇', color: 'oklch(0.82 0.18 75)', glow: '0 0 12px oklch(0.82 0.18 75 / 0.4)' },
    { label: '🥈', color: 'oklch(0.78 0.02 260)', glow: '0 0 12px oklch(0.78 0.02 260 / 0.3)' },
    { label: '🥉', color: 'oklch(0.68 0.12 45)', glow: '0 0 12px oklch(0.68 0.12 45 / 0.3)' },
  ];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 55)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.45 0.02 260)' }}>
          XP Leaderboard
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Medal className="w-8 h-8" style={{ color: 'oklch(0.30 0.02 260)' }} />
          <p className="text-xs text-center" style={{ color: 'oklch(0.40 0.02 260)' }}>
            No XP data yet
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.principal === currentUserPrincipal;
            const rankStyle = rankStyles[index];

            return (
              <div
                key={entry.principal}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: isCurrentUser
                    ? 'oklch(0.72 0.18 195 / 0.08)'
                    : index < 3
                    ? 'oklch(0.17 0.022 260)'
                    : 'oklch(0.16 0.018 260)',
                  border: isCurrentUser
                    ? '1px solid oklch(0.72 0.18 195 / 0.2)'
                    : index < 3
                    ? `1px solid oklch(0.26 0.025 260)`
                    : '1px solid oklch(0.22 0.020 260)',
                  boxShadow: index < 3 && rankStyle ? rankStyle.glow : 'none',
                }}
              >
                {/* Rank */}
                <div className="w-7 text-center flex-shrink-0">
                  {index < 3 && rankStyle ? (
                    <span className="text-base">{rankStyle.label}</span>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: 'oklch(0.40 0.02 260)' }}>
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: isCurrentUser
                        ? 'oklch(0.82 0.01 260)'
                        : index < 3 && rankStyle
                        ? rankStyle.color
                        : 'oklch(0.70 0.01 260)',
                      textShadow: index < 3 && rankStyle ? rankStyle.glow : 'none',
                    }}
                  >
                    {entry.username}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs font-normal" style={{ color: 'oklch(0.50 0.02 260)' }}>
                        (you)
                      </span>
                    )}
                  </p>
                </div>

                {/* XP */}
                <div
                  className="text-xs font-bold font-mono flex-shrink-0 px-2 py-0.5 rounded-md"
                  style={{
                    background: index < 3 && rankStyle
                      ? `oklch(0.20 0.025 260)`
                      : 'oklch(0.18 0.020 260)',
                    color: index < 3 && rankStyle
                      ? rankStyle.color
                      : 'oklch(0.55 0.02 260)',
                  }}
                >
                  {entry.xp.toLocaleString()} XP
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
