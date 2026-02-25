import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useTimerState, useStartSession } from '../hooks/useQueries';
import { Phase } from '../backend';
import TimerDisplay from '../components/room/TimerDisplay';
import CameraPreview from '../components/room/CameraPreview';
import ChatPanel from '../components/room/ChatPanel';
import GoalEntryModal from '../components/room/GoalEntryModal';
import GoalDisplay from '../components/room/GoalDisplay';
import GoalCompletionPrompt from '../components/room/GoalCompletionPrompt';
import LeaderboardPanel from '../components/room/LeaderboardPanel';
import ParticipantList from '../components/room/ParticipantList';
import AmbientSoundToggle from '../components/room/AmbientSoundToggle';
import DistractionLockIndicator from '../components/room/DistractionLockIndicator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const LAST_ROOM_KEY = 'focusroom_last_room';

// Compute derived timer state from server session
export function computeTimerState(session: { startTime: bigint; phase: string; isPause: boolean } | null) {
  if (!session) return { phase: null, remainingMs: 0, elapsedMs: 0, duration: 0 };

  const FOCUS_DURATION_MS = 25 * 60 * 1000;
  const BREAK_DURATION_MS = 5 * 60 * 1000;

  const nowMs = Date.now();
  // startTime is in nanoseconds (ICP Time)
  const startMs = Number(session.startTime) / 1_000_000;
  const elapsedMs = nowMs - startMs;

  const isBreak = session.phase === 'pause' || session.isPause;
  const duration = isBreak ? BREAK_DURATION_MS : FOCUS_DURATION_MS;
  const remainingMs = Math.max(0, duration - elapsedMs);

  return {
    phase: isBreak ? Phase.pause : Phase.focus,
    remainingMs,
    elapsedMs,
    duration,
  };
}

export default function RoomPage() {
  const { code } = useParams({ from: '/room/$code' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  const { data: timerSession, isLoading: timerLoading } = useTimerState(code);
  const { mutate: startSession, isPending: isStarting } = useStartSession();

  const [copied, setCopied] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [showGoalEntry, setShowGoalEntry] = useState(false);
  const [showGoalCompletion, setShowGoalCompletion] = useState(false);
  const [goalSubmitted, setGoalSubmitted] = useState(false);
  const [xpMap, setXpMap] = useState<Record<string, number>>({});

  // Local countdown state
  const [displayTime, setDisplayTime] = useState({ minutes: 25, seconds: 0 });
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const prevPhaseRef = useRef<Phase | null>(null);
  const prevSessionRef = useRef<bigint | null>(null);

  // Persist room code for instant rejoin
  useEffect(() => {
    if (code) {
      localStorage.setItem(LAST_ROOM_KEY, code);
    }
  }, [code]);

  // Derive phase and countdown from server session
  useEffect(() => {
    if (!timerSession) {
      setCurrentPhase(null);
      setDisplayTime({ minutes: 25, seconds: 0 });
      setTotalSeconds(25 * 60);
      return;
    }

    const { phase, remainingMs } = computeTimerState(timerSession);
    setCurrentPhase(phase);

    const totalSec = Math.ceil(remainingMs / 1000);
    setTotalSeconds(totalSec);
    setDisplayTime({
      minutes: Math.floor(totalSec / 60),
      seconds: totalSec % 60,
    });
  }, [timerSession]);

  // Smooth local countdown between polls
  useEffect(() => {
    if (!timerSession || !currentPhase) return;

    const interval = setInterval(() => {
      const { remainingMs } = computeTimerState(timerSession);
      const totalSec = Math.ceil(remainingMs / 1000);
      setTotalSeconds(totalSec);
      setDisplayTime({
        minutes: Math.floor(totalSec / 60),
        seconds: totalSec % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSession, currentPhase]);

  // Detect phase transitions
  useEffect(() => {
    if (!currentPhase) return;

    const prevPhase = prevPhaseRef.current;
    const currentStartTime = timerSession?.startTime ?? null;
    const prevStartTime = prevSessionRef.current;

    // New session started (startTime changed)
    const isNewSession = currentStartTime !== null && currentStartTime !== prevStartTime;

    if (isNewSession) {
      prevSessionRef.current = currentStartTime;

      if (currentPhase === Phase.focus) {
        // Entering focus: show goal entry if not submitted
        setGoalSubmitted(false);
        setShowGoalEntry(true);
        setShowGoalCompletion(false);
      } else if (currentPhase === Phase.pause && prevPhase === Phase.focus) {
        // Focus ended → break started: show completion prompt
        setShowGoalCompletion(true);
        setShowGoalEntry(false);
      }
    }

    prevPhaseRef.current = currentPhase;
  }, [currentPhase, timerSession?.startTime]);

  // Auto-transition: when timer hits 0, start next phase (any participant can advance)
  useEffect(() => {
    if (!timerSession || !currentPhase) return;
    const { remainingMs } = computeTimerState(timerSession);
    if (remainingMs > 0) return;

    // Timer expired - auto-advance after a short delay
    const timeout = setTimeout(() => {
      const nextPhase = currentPhase === Phase.focus ? Phase.pause : Phase.focus;
      startSession({ code, phase: nextPhase });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [displayTime, timerSession, currentPhase, code, startSession]);

  // XP helpers (local state since backend doesn't have XP endpoints)
  const awardXP = useCallback((username: string, amount: number) => {
    setXpMap((prev) => ({
      ...prev,
      [username]: Math.max(0, (prev[username] ?? 0) + amount),
    }));
  }, []);

  const handleGoalSubmit = (goal: string) => {
    setCurrentGoal(goal);
    setGoalSubmitted(true);
    setShowGoalEntry(false);
  };

  const handleGoalComplete = (completed: boolean) => {
    setShowGoalCompletion(false);
    if (userProfile) {
      if (completed) {
        awardXP(userProfile.username, 20);
        toast.success('+20 XP — Goal completed! 🎯');
      }
      // Award session XP
      awardXP(userProfile.username, 50);
      toast.success('+50 XP — Focus session complete! ⚡');
    }
    setCurrentGoal(null);
  };

  const handleStartSession = () => {
    startSession(
      { code, phase: Phase.focus },
      {
        onError: () => {
          toast.error('Failed to start session. Please try again.');
        },
      }
    );
  };

  const handleLeaveRoom = () => {
    // Deduct XP if leaving mid-focus
    if (currentPhase === Phase.focus && userProfile) {
      awardXP(userProfile.username, -30);
      toast.warning('-30 XP — Left during focus session');
    }
    // Clear last room on intentional leave
    localStorage.removeItem(LAST_ROOM_KEY);
    navigate({ to: '/lobby' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!identity) navigate({ to: '/login' });
  }, [identity, navigate]);

  if (!identity) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Distraction Lock Indicator */}
      <DistractionLockIndicator phase={currentPhase} />

      {/* Room Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-room-border bg-room-surface/50">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-1.5 text-xs font-mono text-room-muted hover:text-room-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Leave
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-room-muted">Room</span>
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-focus-accent">{code}</span>
          <button
            onClick={handleCopyCode}
            className="text-room-muted hover:text-room-text transition-colors"
            title="Copy room code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-focus-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Ambient sound toggle in header */}
        <AmbientSoundToggle phase={currentPhase} />
      </div>

      {/* Main Room Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Timer + Camera + Goal */}
        <div className="flex flex-col gap-4 p-4 lg:w-72 xl:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-room-border">
          {/* Timer */}
          <TimerDisplay
            phase={currentPhase}
            minutes={displayTime.minutes}
            seconds={displayTime.seconds}
            totalSeconds={totalSeconds}
            isLoading={timerLoading}
            onStart={handleStartSession}
            isStarting={isStarting}
          />

          {/* Goal Display */}
          {currentGoal && currentPhase === Phase.focus && (
            <GoalDisplay goal={currentGoal} />
          )}

          {/* Camera */}
          <CameraPreview username={userProfile?.username ?? 'You'} />

          {/* Participants */}
          <ParticipantList
            roomCode={code}
            currentUsername={userProfile?.username ?? ''}
          />
        </div>

        {/* Right Column: Chat + Leaderboard */}
        <div className="flex-1 flex flex-col min-h-0 lg:flex-row">
          {/* Chat */}
          <div className="flex-1 min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-room-border">
            <ChatPanel
              roomCode={code}
              phase={currentPhase}
              username={userProfile?.username ?? 'Anonymous'}
            />
          </div>

          {/* Leaderboard */}
          <div className="lg:w-56 xl:w-64 flex-shrink-0 p-4">
            <LeaderboardPanel
              xpMap={xpMap}
              currentUsername={userProfile?.username ?? ''}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showGoalEntry && !goalSubmitted && (
        <GoalEntryModal
          onSubmit={handleGoalSubmit}
          onSkip={() => {
            setGoalSubmitted(true);
            setShowGoalEntry(false);
          }}
        />
      )}

      {showGoalCompletion && currentGoal && (
        <GoalCompletionPrompt
          goal={currentGoal}
          onComplete={handleGoalComplete}
        />
      )}
    </div>
  );
}
