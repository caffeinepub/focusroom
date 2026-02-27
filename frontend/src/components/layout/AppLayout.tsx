import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useGetCallerUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { useConnectionTimeout } from '../../hooks/useConnectionTimeout';
import ProfileSetupModal from '../auth/ProfileSetupModal';
import ConnectionErrorModal from '../auth/ConnectionErrorModal';
import { BookOpen, LogOut, Heart, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function AppLayout() {
  const { identity, clear, loginStatus, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!identity;
  // True while the auth client is initializing on page load
  const isAuthInitializing = isInitializing || loginStatus === 'initializing';
  // True while actively logging in (user clicked sign in, popup open)
  const isLoggingIn = loginStatus === 'logging-in';
  // Overall connecting state: initializing OR actor is being set up after login
  const isConnecting = isAuthInitializing || (isAuthenticated && actorFetching);

  const { hasTimedOut, clearConnectionTimeout } = useConnectionTimeout({ isConnecting });

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Redirect unauthenticated users to /login once initialization is complete
  useEffect(() => {
    if (!isAuthInitializing && !isAuthenticated) {
      const currentPath = location.pathname;
      if (currentPath !== '/login') {
        navigate({ to: '/login' });
      }
    }
  }, [isAuthInitializing, isAuthenticated, location.pathname, navigate]);

  // Redirect authenticated users away from /login once ready
  useEffect(() => {
    if (!isAuthInitializing && isAuthenticated && !actorFetching) {
      const currentPath = location.pathname;
      if (currentPath === '/login' || currentPath === '/') {
        navigate({ to: '/lobby' });
      }
    }
  }, [isAuthInitializing, isAuthenticated, actorFetching, location.pathname, navigate]);

  const handleLogout = async () => {
    clearConnectionTimeout();
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleRetry = () => {
    clearConnectionTimeout();
    // Force a page reload to re-initialize the actor
    window.location.reload();
  };

  const handleReturnToLogin = async () => {
    clearConnectionTimeout();
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const username = userProfile?.username;
  const xp = userProfile ? Number(userProfile.xp) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--gradient-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b"
        style={{
          background: 'oklch(0.13 0.018 260 / 0.92)',
          borderColor: 'oklch(0.22 0.022 260)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 1px 0 oklch(0.28 0.025 260 / 0.5), 0 4px 16px oklch(0 0 0 / 0.3)',
        }}
      >
        {/* Brand */}
        <button
          onClick={() => navigate({ to: isAuthenticated ? '/lobby' : '/login' })}
          className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.72 0.18 195 / 0.2) 0%, oklch(0.68 0.16 55 / 0.1) 100%)',
              border: '1px solid oklch(0.72 0.18 195 / 0.3)',
            }}
          >
            <BookOpen className="w-4 h-4" style={{ color: 'oklch(0.72 0.18 195)' }} />
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, oklch(0.90 0.01 260) 0%, oklch(0.72 0.18 195) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Studyroom
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {(isLoggingIn || (isAuthenticated && actorFetching && !isAuthInitializing)) && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
              <span className="text-xs" style={{ color: 'oklch(0.55 0.02 260)' }}>Connecting…</span>
            </div>
          )}

          {isAuthenticated && username && (
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'oklch(0.18 0.022 260)',
                  border: '1px solid oklch(0.26 0.025 260)',
                }}
              >
                <div className="status-dot-active" />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.78 0.01 260)' }}>
                  {username}
                </span>
                {xp > 0 && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'oklch(0.68 0.16 55 / 0.15)',
                      color: 'oklch(0.72 0.18 55)',
                    }}
                  >
                    {xp.toLocaleString()} XP
                  </span>
                )}
              </div>
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: 'oklch(0.18 0.03 25)',
                color: 'oklch(0.68 0.16 25)',
                border: '1px solid oklch(0.26 0.05 25)',
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </header>

      {/* Profile setup modal */}
      {showProfileSetup && <ProfileSetupModal />}

      {/* Connection timeout modal */}
      {hasTimedOut && (
        <ConnectionErrorModal
          onRetry={handleRetry}
          onReturnToLogin={handleReturnToLogin}
        />
      )}

      {/* Main content */}
      <main className="flex-1">
        {/* Show a full-screen loading state while auth is initializing on page load */}
        {isAuthInitializing ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
            <p className="text-sm font-mono" style={{ color: 'oklch(0.50 0.02 260)' }}>
              Initializing…
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-4 px-5 border-t text-center"
        style={{
          background: 'oklch(0.12 0.015 260 / 0.8)',
          borderColor: 'oklch(0.20 0.020 260)',
        }}
      >
        <p className="text-xs" style={{ color: 'oklch(0.35 0.02 260)' }}>
          © {new Date().getFullYear()} Studyroom · Built with{' '}
          <Heart className="inline w-3 h-3 mx-0.5" style={{ color: 'oklch(0.65 0.22 25)' }} />
          {' '}using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors duration-200 hover:opacity-80"
            style={{ color: 'oklch(0.48 0.02 260)' }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
