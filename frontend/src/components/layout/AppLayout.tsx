import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, LogIn, Loader2 } from 'lucide-react';
import ProfileSetupModal from '../auth/ProfileSetupModal';
import { useGetCallerUserProfile } from '../../hooks/useGetCallerUserProfile';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { identity, clear, login, isLoggingIn, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-room-bg text-room-text flex flex-col">
      <header className="border-b border-room-border px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-room-bg/95 backdrop-blur-sm">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate({ to: '/lobby' })}
        >
          <BookOpen className="w-5 h-5 text-focus-accent" />
          <span className="font-mono text-sm font-semibold tracking-widest text-room-text uppercase">
            FocusRoom
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile && (
            <span className="text-xs text-room-muted font-mono hidden sm:block">
              {userProfile.username}
            </span>
          )}
          {isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin text-room-muted" />
          ) : isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-room-muted hover:text-room-text hover:bg-room-surface font-mono text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="text-focus-accent hover:text-focus-accent hover:bg-room-surface font-mono text-xs gap-1.5"
            >
              {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {isLoggingIn ? 'Connecting...' : 'Login'}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-room-border px-6 py-3 text-center">
        <p className="text-xs text-room-muted font-mono">
          Built with{' '}
          <span className="text-focus-accent">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'focusroom')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-focus-accent hover:underline"
          >
            caffeine.ai
          </a>{' '}
          · © {new Date().getFullYear()} FocusRoom
        </p>
      </footer>

      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
