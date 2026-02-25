import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';
import { useSaveCallerUserProfile } from '../../hooks/useSaveCallerUserProfile';

export default function ProfileSetupModal() {
  const [username, setUsername] = useState('');
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) return;
    saveProfile({ username: trimmed });
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-room-surface border-room-border text-room-text max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-focus-accent" />
            <DialogTitle className="font-mono text-sm tracking-wider uppercase text-room-text">
              Set Your Name
            </DialogTitle>
          </div>
          <DialogDescription className="text-room-muted text-xs font-mono">
            Choose a username visible to your study room members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-mono text-room-muted uppercase tracking-wider">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_studies"
              maxLength={24}
              className="bg-room-input border-room-border text-room-text font-mono text-sm placeholder:text-room-muted/50 focus-visible:ring-focus-accent/50"
              autoFocus
            />
            {username.trim().length > 0 && username.trim().length < 2 && (
              <p className="text-xs text-destructive font-mono">At least 2 characters required</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending || username.trim().length < 2}
            className="w-full bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-wider uppercase"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Enter FocusRoom'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
