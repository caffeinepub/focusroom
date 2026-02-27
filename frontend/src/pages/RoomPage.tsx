import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useGetRoomParticipants, useAwardXp } from '../hooks/useQueries';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/room/VideoGrid';
import CameraPreview from '../components/room/CameraPreview';
import ChatPanel from '../components/room/ChatPanel';
import ParticipantList from '../components/room/ParticipantList';
import LeaderboardPanel from '../components/room/LeaderboardPanel';
import TimerDisplay from '../components/room/TimerDisplay';
import { LogOut, Users, MessageSquare, Trophy, Video } from 'lucide-react';

type SidePanel = 'chat' | 'participants' | 'leaderboard';

export default function RoomPage() {
  // Route param is 'code' as defined in App.tsx: /room/$code
  const { code } = useParams({ from: '/room/$code' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: participants = [] } = useGetRoomParticipants(code);
  const awardXpMutation = useAwardXp();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanel>('chat');
  const xpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString() ?? '';
  const username = userProfile?.username ?? 'You';

  const { remoteStreams, initiateCallToPeer } = useWebRTC({
    roomId: code,
    localStream,
    enabled: !!localStream && !!currentUserPrincipal,
    currentUserPrincipal,
  });

  // Initiate calls to all existing participants when local stream becomes available
  useEffect(() => {
    if (!localStream || !currentUserPrincipal) return;
    participants.forEach(([principal]) => {
      const peerId = principal.toString();
      if (peerId !== currentUserPrincipal) {
        initiateCallToPeer(peerId);
      }
    });
  }, [localStream, participants, currentUserPrincipal, initiateCallToPeer]);

  // XP award every 30 minutes
  useEffect(() => {
    if (!identity || !userProfile) return;

    xpIntervalRef.current = setInterval(() => {
      const principal = identity.getPrincipal();
      awardXpMutation.mutate({ recipient: principal, amount: BigInt(50) });
    }, 30 * 60 * 1000);

    return () => {
      if (xpIntervalRef.current) clearInterval(xpIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, userProfile]);

  const handleStreamReady = useCallback((stream: MediaStream) => {
    setLocalStream(stream);
  }, []);

  const handleStreamStop = useCallback(() => {
    setLocalStream(null);
  }, []);

  const handleLeaveRoom = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    navigate({ to: '/lobby' });
  };

  // Build participants list for VideoGrid
  const participantsList = participants.map(([principal, uname]) => ({
    principal: principal.toString(),
    username: uname,
  }));

  const panelButtons: { id: SidePanel; icon: React.ReactNode; label: string }[] = [
    { id: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
    { id: 'participants', icon: <Users className="w-4 h-4" />, label: 'People' },
    { id: 'leaderboard', icon: <Trophy className="w-4 h-4" />, label: 'XP' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--gradient-bg)' }}
    >
      {/* Room header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: 'oklch(0.14 0.022 260 / 0.95)',
          borderColor: 'oklch(0.24 0.022 260)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'oklch(0.72 0.18 195 / 0.15)',
              border: '1px solid oklch(0.72 0.18 195 / 0.3)',
            }}
          >
            <Video className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 195)' }} />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.02 260)' }}>Room</p>
            <p
              className="text-sm font-bold font-mono tracking-wider"
              style={{ color: 'oklch(0.88 0.01 260)' }}
            >
              {code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TimerDisplay />
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'oklch(0.20 0.04 25)',
              color: 'oklch(0.75 0.18 25)',
              border: '1px solid oklch(0.28 0.06 25)',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video area */}
        <main className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto min-w-0">
          {/* Remote participants video grid */}
          {(remoteStreams.length > 0 ||
            participantsList.filter(p => p.principal !== currentUserPrincipal).length > 0) && (
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'oklch(0.45 0.02 260)' }}
              >
                Participants
              </h2>
              <VideoGrid
                localStream={null}
                remoteStreams={remoteStreams}
                localUsername={username}
                participants={participantsList}
              />
            </section>
          )}

          {/* Local camera preview — shown separately, never duplicated in VideoGrid */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'oklch(0.45 0.02 260)' }}
            >
              Your Camera
            </h2>
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--gradient-card)',
                border: '1px solid oklch(0.26 0.025 260)',
                boxShadow: 'var(--glow-card)',
              }}
            >
              <CameraPreview
                onStreamReady={handleStreamReady}
                onStreamStop={handleStreamStop}
              />
            </div>
          </section>
        </main>

        {/* Right: Side panel */}
        <aside
          className="w-72 flex flex-col border-l"
          style={{
            background: 'oklch(0.14 0.018 260)',
            borderColor: 'oklch(0.22 0.022 260)',
          }}
        >
          {/* Panel tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: 'oklch(0.22 0.022 260)' }}
          >
            {panelButtons.map(btn => (
              <button
                key={btn.id}
                onClick={() => setActivePanel(btn.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200"
                style={{
                  color:
                    activePanel === btn.id
                      ? 'oklch(0.72 0.18 195)'
                      : 'oklch(0.50 0.02 260)',
                  borderBottom:
                    activePanel === btn.id
                      ? '2px solid oklch(0.72 0.18 195)'
                      : '2px solid transparent',
                  background:
                    activePanel === btn.id
                      ? 'oklch(0.72 0.18 195 / 0.06)'
                      : 'transparent',
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'chat' && <ChatPanel roomId={code} />}
            {activePanel === 'participants' && (
              <ParticipantList
                roomId={code}
                currentUserPrincipal={currentUserPrincipal}
                remoteStreams={remoteStreams}
                localStream={localStream}
              />
            )}
            {activePanel === 'leaderboard' && (
              <LeaderboardPanel
                roomId={code}
                currentUserPrincipal={currentUserPrincipal}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
