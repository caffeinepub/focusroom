import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useCreateRoom, useJoinRoom } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { BookOpen, Plus, LogIn, Loader2, Users, Trophy, Clock } from 'lucide-react';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { actor, isFetching: actorFetching } = useActor();
  const createRoomMutation = useCreateRoom();
  const joinRoomMutation = useJoinRoom();

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const isActorReady = !!actor && !actorFetching;

  const handleCreateRoom = async () => {
    if (!isActorReady) return;
    try {
      const code = await createRoomMutation.mutateAsync();
      navigate({ to: '/room/$code', params: { code } });
    } catch {
      // Error handled by mutation
    }
  };

  const handleJoinRoom = async () => {
    if (!isActorReady) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code.');
      return;
    }
    setJoinError('');
    try {
      await joinRoomMutation.mutateAsync(code);
      navigate({ to: '/room/$code', params: { code } });
    } catch {
      setJoinError('Room not found. Check the code and try again.');
    }
  };

  const username = userProfile?.username ?? identity?.getPrincipal().toString().substring(0, 8) ?? '';
  const xp = userProfile ? Number(userProfile.xp) : 0;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--gradient-bg)' }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.72 0.18 195 / 0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.68 0.16 55 / 0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Header */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, oklch(0.72 0.18 195 / 0.2) 0%, oklch(0.68 0.16 55 / 0.1) 100%)',
                border: '1px solid oklch(0.72 0.18 195 / 0.3)',
                boxShadow: '0 0 20px oklch(0.72 0.18 195 / 0.12)',
              }}
            >
              <BookOpen className="w-7 h-7" style={{ color: 'oklch(0.72 0.18 195)' }} />
            </div>
            <h1
              className="text-3xl font-bold mb-1 tracking-tight"
              style={{
                background: 'linear-gradient(135deg, oklch(0.92 0.01 260) 0%, oklch(0.72 0.18 195) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Studyroom
            </h1>
            {username && (
              <p className="text-sm" style={{ color: 'oklch(0.55 0.02 260)' }}>
                Welcome back,{' '}
                <span style={{ color: 'oklch(0.78 0.01 260)', fontWeight: 600 }}>{username}</span>
              </p>
            )}
          </div>

          {/* XP badge */}
          {xp > 0 && (
            <div
              className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-full mx-auto w-fit"
              style={{
                background: 'oklch(0.68 0.16 55 / 0.12)',
                border: '1px solid oklch(0.68 0.16 55 / 0.25)',
              }}
            >
              <Trophy className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 55)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.78 0.14 55)' }}>
                {xp.toLocaleString()} XP
              </span>
            </div>
          )}

          {/* Actor still initializing after auth */}
          {actorFetching && (
            <div
              className="flex items-center justify-center gap-3 py-4 mb-6 rounded-xl"
              style={{
                background: 'oklch(0.16 0.018 260)',
                border: '1px solid oklch(0.24 0.022 260)',
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
              <span className="text-sm" style={{ color: 'oklch(0.55 0.02 260)' }}>Setting up your session…</span>
            </div>
          )}

          {/* Main card */}
          <div
            className="rounded-2xl p-6 mb-4"
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid oklch(0.26 0.025 260)',
              boxShadow: 'var(--glow-card)',
            }}
          >
            {/* Create room */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-1" style={{ color: 'oklch(0.80 0.01 260)' }}>
                Start a new room
              </h2>
              <p className="text-xs mb-4" style={{ color: 'oklch(0.48 0.02 260)' }}>
                Create a private study room and invite others with a code.
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={!isActorReady || createRoomMutation.isPending}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.72 0.18 195) 0%, oklch(0.65 0.20 210) 100%)',
                  color: 'oklch(0.10 0.01 260)',
                  boxShadow: '0 0 20px oklch(0.72 0.18 195 / 0.25)',
                }}
              >
                {createRoomMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {createRoomMutation.isPending ? 'Creating…' : 'Create Room'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 separator-glow" />
              <span className="text-xs font-medium" style={{ color: 'oklch(0.40 0.02 260)' }}>or</span>
              <div className="flex-1 separator-glow" />
            </div>

            {/* Join room */}
            <div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: 'oklch(0.80 0.01 260)' }}>
                Join a room
              </h2>
              <p className="text-xs mb-4" style={{ color: 'oklch(0.48 0.02 260)' }}>
                Enter the 6-character code shared by the room creator.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => {
                    setJoinCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-mono font-semibold tracking-widest uppercase transition-all duration-200 outline-none"
                  style={{
                    background: 'oklch(0.12 0.015 260)',
                    border: '1px solid oklch(0.26 0.025 260)',
                    color: 'oklch(0.88 0.01 260)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'oklch(0.72 0.18 195 / 0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px oklch(0.72 0.18 195 / 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'oklch(0.26 0.025 260)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!isActorReady || joinRoomMutation.isPending || !joinCode.trim()}
                  className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02]"
                  style={{
                    background: 'oklch(0.22 0.025 260)',
                    color: 'oklch(0.80 0.01 260)',
                    border: '1px solid oklch(0.30 0.025 260)',
                  }}
                >
                  {joinRoomMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Join
                </button>
              </div>
              {joinError && (
                <p className="mt-2 text-xs" style={{ color: 'oklch(0.65 0.22 25)' }}>
                  {joinError}
                </p>
              )}
            </div>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Clock className="w-4 h-4" />, label: 'Track time' },
              { icon: <Users className="w-4 h-4" />, label: 'Study together' },
              { icon: <Trophy className="w-4 h-4" />, label: 'Earn XP' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 py-3 rounded-xl"
                style={{
                  background: 'oklch(0.15 0.016 260)',
                  border: '1px solid oklch(0.22 0.020 260)',
                }}
              >
                <span style={{ color: 'oklch(0.55 0.02 260)' }}>{item.icon}</span>
                <span className="text-xs" style={{ color: 'oklch(0.45 0.02 260)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
