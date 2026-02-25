import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const { identity, login, isLoggingIn, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/lobby' });
    }
  }, [identity, navigate]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Logo */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-7 h-7 text-focus-accent" />
            <h1 className="font-mono text-xl font-bold tracking-widest uppercase text-room-text">
              FocusRoom
            </h1>
          </div>
          <p className="text-room-muted text-xs font-mono leading-relaxed max-w-xs mx-auto">
            A private space to study with friends.
            <br />
            Timed sessions. Blurred distractions. Real focus.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2 text-left">
          {[
            '25 min focus · 5 min break cycles',
            'Blurred camera for soft presence',
            'Chat unlocks only during breaks',
            'Set goals · earn XP · stay accountable',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full bg-focus-accent flex-shrink-0" />
              <span className="text-xs font-mono text-room-muted">{feat}</span>
            </div>
          ))}
        </div>

        {/* Login */}
        <div className="space-y-3">
          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-widest uppercase h-10"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 mr-2" />
                Login with Internet Identity
              </>
            )}
          </Button>
          <p className="text-xs text-room-muted/60 font-mono">
            Secure · Decentralized · No passwords
          </p>
        </div>
      </div>
    </div>
  );
}
