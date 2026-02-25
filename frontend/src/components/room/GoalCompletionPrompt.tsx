import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Target } from 'lucide-react';

interface GoalCompletionPromptProps {
  goal: string;
  onComplete: (completed: boolean) => void;
}

export default function GoalCompletionPrompt({ goal, onComplete }: GoalCompletionPromptProps) {
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
              Session Complete
            </DialogTitle>
          </div>
          <DialogDescription className="text-room-muted text-xs font-mono">
            Did you accomplish your goal?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Goal recap */}
          <div className="p-3 bg-room-input rounded border border-room-border">
            <p className="text-xs font-mono text-room-muted/70 mb-1 uppercase tracking-wider">Your goal was:</p>
            <p className="text-sm font-mono text-room-text">{goal}</p>
          </div>

          {/* XP info */}
          <div className="text-xs font-mono text-room-muted/60 text-center space-y-0.5">
            <p>+50 XP for completing the session</p>
            <p>+20 XP bonus for completing your goal</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onComplete(false)}
              variant="outline"
              className="flex-1 border-room-border text-room-muted hover:text-room-text hover:bg-room-input font-mono text-xs gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Not Yet
            </Button>
            <Button
              onClick={() => onComplete(true)}
              className="flex-1 bg-focus-accent hover:bg-focus-accent/90 text-room-bg font-mono text-xs gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Completed!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
