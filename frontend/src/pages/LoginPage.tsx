import React, { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useActor } from '../hooks/useActor';
import { useConnectionTimeout } from '../hooks/useConnectionTimeout';
import ConnectionErrorModal from '../components/auth/ConnectionErrorModal';
import { BookOpen, Users, Trophy, Clock, Heart } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, clear, isInitializing, identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const navigate = useNavigate();

  const isLoggingIn = loginStatus === 'logging-in';
  // Show connecting state while logging in or while actor is being set up post-login
  const isConnecting = isLoggingIn || (!!identity && actorFetching);

  const { hasTimedOut, clearConnectionTimeout } = useConnectionTimeout({ isConnecting });

  // Once authenticated and actor is ready, go to lobby
  useEffect(() => {
    if (identity && !actorFetching && !isInitializing) {
      navigate({ to: '/lobby' });
    }
  }, [identity, actorFetching, isInitializing, navigate]);

  const handleLogin = () => {
    clearConnectionTimeout();
    login();
  };

  const handleRetry = () => {
    clearConnectionTimeout();
    window.location.reload();
  };

  const handleReturnToLogin = async () => {
    clearConnectionTimeout();
    await clear();
    // Stay on login page
  };

  const features = [
    { icon: <Clock className="w-5 h-5" />, title: 'Continuous Timer', desc: 'Track your study time with an always-running session clock.' },
    { icon: <Users className="w-5 h-5" />, title: 'Study Together', desc: 'Join rooms with peers and stay accountable in real time.' },
    { icon: <BookOpen className="w-5 h-5" />, title: 'Always-on Chat', desc: 'Communicate freely with your study group at any time.' },
    { icon: <Trophy className="w-5 h-5" />, title: 'Earn XP', desc: 'Gain experience points for every 30 minutes of focused study.' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--gradient-bg)' }}
    >
      {/* Connection timeout modal */}
      {hasTimedOut && (
        <ConnectionErrorModal
          onRetry={handleRetry}
          onReturnToLogin={handleReturnToLogin}
        />
      )}

      {/* Background decorative orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.72 0.18 195 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.68 0.16 55 / 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate(50%, 50%)',
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, oklch(0.72 0.18 195 / 0.2) 0%, oklch(0.68 0.16 55 / 0.1) 100%)',
              border: '1px solid oklch(0.72 0.18 195 / 0.3)',
              boxShadow: '0 0 24px oklch(0.72 0.18 195 / 0.15)',
            }}
          >
            <BookOpen className="w-8 h-8" style={{ color: 'oklch(0.72 0.18 195)' }} />
          </div>
          <h1
            className="text-4xl font-bold mb-2 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, oklch(0.92 0.01 260) 0%, oklch(0.72 0.18 195) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Studyroom
          </h1>
          <p className="text-base" style={{ color: 'oklch(0.55 0.02 260)' }}>
            Focus together. Grow together.
          </p>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: 'var(--gradient-card)',
            border: '1px solid oklch(0.26 0.025 260)',
            boxShadow: 'var(--glow-card)',
          }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.88 0.01 260)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-6" style={{ color: 'oklch(0.50 0.02 260)' }}>
            Sign in to join or create a study room.
          </p>

          <button
            onClick={handleLogin}
            disabled={isConnecting}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: isConnecting
                ? 'oklch(0.45 0.10 195)'
                : 'linear-gradient(135deg, oklch(0.72 0.18 195) 0%, oklch(0.65 0.20 210) 100%)',
              color: 'oklch(0.10 0.01 260)',
              boxShadow: isConnecting ? 'none' : '0 0 20px oklch(0.72 0.18 195 / 0.3)',
            }}
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isLoggingIn ? 'Signing in…' : 'Connecting…'}
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {loginStatus === 'loginError' && (
            <p className="mt-3 text-xs text-center" style={{ color: 'oklch(0.65 0.22 25)' }}>
              Sign-in failed. Please try again.
            </p>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'oklch(0.16 0.018 260)',
                border: '1px solid oklch(0.24 0.022 260)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'oklch(0.72 0.18 195 / 0.12)',
                  border: '1px solid oklch(0.72 0.18 195 / 0.2)',
                }}
              >
                <span style={{ color: 'oklch(0.72 0.18 195)' }}>{f.icon}</span>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.80 0.01 260)' }}>
                {f.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.48 0.02 260)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center relative z-10">
        <p className="text-xs" style={{ color: 'oklch(0.38 0.02 260)' }}>
          Built with <Heart className="inline w-3 h-3 mx-0.5" style={{ color: 'oklch(0.65 0.22 25)' }} /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors duration-200"
            style={{ color: 'oklch(0.55 0.02 260)' }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
