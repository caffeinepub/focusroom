import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Target, Loader2 } from 'lucide-react';

interface GoalEntryModalProps {
  onSubmit: (goal: string) => void;
  onSkip: () => void;
}

export default function GoalEntryModal({ onSubmit, onSkip }: GoalEntryModalProps) {
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    onSubmit(trimmed);
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
            <Target className="w-4 h-4 text-focus-accent" />
            <DialogTitle className="font-mono text-sm tracking-wider uppercase text-room-text">
              Set Your Focus Goal
            </DialogTitle>
          </div>
          <DialogDescription className="text-room-muted text-xs font-mono">
            What will you accomplish in the next 25 minutes?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Finish chapter 3 of calculus textbook"
            maxLength={200}
            rows={3}
            className="bg-room-input border-room-border text-room-text font-mono text-sm placeholder:text-room-muted/40 focus-visible:ring-focus-accent/50 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="flex-1 text-room-muted hover:text-room-text hover:bg-room-input font-mono text-xs"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || goal.trim().length === 0}
              size="sm"
              className="flex-1 bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs tracking-wider uppercase"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Set Goal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
