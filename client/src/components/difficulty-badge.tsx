import { cn } from "@/lib/utils";
import type { ScenarioDifficulty } from "@/lib/scenarios";

interface DifficultyBadgeProps {
  difficulty: ScenarioDifficulty;
  className?: string;
}

const difficultyStyles: Record<ScenarioDifficulty, string> = {
  Beginner:     "bg-status-allow/15 text-status-allow border border-status-allow/30",
  Intermediate: "bg-status-challenge/15 text-status-challenge border border-status-challenge/30",
  Advanced:     "bg-status-deny/15 text-status-deny border border-status-deny/30",
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        difficultyStyles[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
