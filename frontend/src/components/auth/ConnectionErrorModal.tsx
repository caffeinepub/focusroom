import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, LogIn } from 'lucide-react';

interface ConnectionErrorModalProps {
  onRetry: () => void;
  onReturnToLogin: () => void;
}

export default function ConnectionErrorModal({ onRetry, onReturnToLogin }: ConnectionErrorModalProps) {
  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-room-surface border-room-border text-room-text max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <WifiOff className="w-4 h-4" style={{ color: 'oklch(0.65 0.22 25)' }} />
            <DialogTitle className="font-mono text-sm tracking-wider uppercase text-room-text">
              Connection Timeout
            </DialogTitle>
          </div>
          <DialogDescription className="text-room-muted text-xs font-mono leading-relaxed">
            The connection is taking longer than expected. This may be due to a slow network or a temporary issue.
            Please try again or return to the login screen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={onRetry}
            className="w-full bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-wider uppercase flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
          <Button
            onClick={onReturnToLogin}
            variant="outline"
            className="w-full border-room-border text-room-muted hover:text-room-text font-mono text-xs tracking-wider uppercase flex items-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Return to Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
