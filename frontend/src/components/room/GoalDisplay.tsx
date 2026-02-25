import { Target } from 'lucide-react';

interface GoalDisplayProps {
  goal: string;
}

export default function GoalDisplay({ goal }: GoalDisplayProps) {
  return (
    <div className="bg-room-surface border border-focus-accent/20 rounded-lg p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-focus-accent flex-shrink-0" />
        <span className="text-xs font-mono tracking-wider uppercase text-focus-accent/80">
          Current Goal
        </span>
      </div>
      <p className="text-xs font-mono text-room-text leading-relaxed pl-5">
        {goal}
      </p>
    </div>
  );
}
