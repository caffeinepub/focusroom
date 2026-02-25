import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { useCreateRoom, useJoinRoom } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, ArrowRight, Loader2, BookOpen, AlertCircle } from 'lucide-react';

const LAST_ROOM_KEY = 'focusroom_last_room';

export default function LobbyPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isAutoJoining, setIsAutoJoining] = useState(false);

  const { mutate: createRoom, isPending: isCreating } = useCreateRoom();
  const { mutate: joinRoom, isPending: isJoining } = useJoinRoom();

  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/login' });
    }
  }, [identity, navigate]);

  // Instant rejoin: attempt to re-enter last room on mount
  useEffect(() => {
    if (!identity || profileLoading || autoJoinAttempted.current) return;

    const lastRoom = localStorage.getItem(LAST_ROOM_KEY);
    if (!lastRoom) return;

    autoJoinAttempted.current = true;
    setIsAutoJoining(true);

    joinRoom(lastRoom, {
      onSuccess: () => {
        setIsAutoJoining(false);
        navigate({ to: '/room/$code', params: { code: lastRoom } });
      },
      onError: () => {
        // Room no longer exists or is invalid — clear and show lobby normally
        localStorage.removeItem(LAST_ROOM_KEY);
        setIsAutoJoining(false);
      },
    });
  }, [identity, profileLoading, joinRoom, navigate]);

  if (!identity || profileLoading || isAutoJoining) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-room-muted" />
        {isAutoJoining && (
          <p className="text-xs font-mono text-room-muted/60">Rejoining your last room…</p>
        )}
      </div>
    );
  }

  const handleCreateRoom = () => {
    setCreateError('');
    createRoom(undefined, {
      onSuccess: (code) => {
        // Navigate directly — room is already joined inside the mutation
        navigate({ to: '/room/$code', params: { code } });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('Unauthorized')) {
          setCreateError('You must be logged in to create a room.');
        } else if (msg.includes('Actor not available')) {
          setCreateError('Still connecting to the network. Please wait a moment and try again.');
        } else {
          setCreateError('Failed to create room. Please try again.');
        }
      },
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Code must be exactly 6 characters');
      return;
    }
    setJoinError('');
    joinRoom(code, {
      onSuccess: () => {
        navigate({ to: '/room/$code', params: { code } });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('not found') || msg.includes('Room not found')) {
          setJoinError('Room not found. Check the code and try again.');
        } else {
          setJoinError('Failed to join room. Please try again.');
        }
      },
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-focus-accent" />
            <h2 className="font-mono text-base font-semibold tracking-widest uppercase text-room-text">
              Study Lobby
            </h2>
          </div>
          {userProfile && (
            <p className="text-xs text-room-muted font-mono">
              Welcome back, <span className="text-room-text">{userProfile.username}</span>
            </p>
          )}
        </div>

        {/* Create Room */}
        <Card className="bg-room-surface border-room-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs tracking-wider uppercase text-room-muted">
              Create a Room
            </CardTitle>
            <CardDescription className="text-xs font-mono text-room-muted/70">
              Start a private session and invite friends with a code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {createError && (
              <div className="flex items-start gap-2 p-2.5 rounded bg-destructive/10 border border-destructive/30">
                <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs font-mono text-destructive">{createError}</p>
              </div>
            )}
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-wider uppercase"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Create Room
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-room-border" />
          <span className="text-xs font-mono text-room-muted/50 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-room-border" />
        </div>

        {/* Join Room */}
        <Card className="bg-room-surface border-room-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs tracking-wider uppercase text-room-muted">
              Join a Room
            </CardTitle>
            <CardDescription className="text-xs font-mono text-room-muted/70">
              Enter the 6-character code shared by your host.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                  setJoinError('');
                }}
                placeholder="XXXXXX"
                maxLength={6}
                className="bg-room-input border-room-border text-room-text font-mono text-center text-lg tracking-[0.3em] placeholder:text-room-muted/40 focus-visible:ring-focus-accent/50 uppercase"
              />
              {joinError && (
                <div className="flex items-start gap-2 p-2.5 rounded bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs font-mono text-destructive">{joinError}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isJoining || joinCode.trim().length !== 6}
                variant="outline"
                className="w-full border-room-border text-room-text hover:bg-room-input hover:text-room-text font-mono text-xs tracking-wider uppercase"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 mr-2" />
                    Join Room
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
