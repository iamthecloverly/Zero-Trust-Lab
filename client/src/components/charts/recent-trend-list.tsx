import type { RecentSimulation } from "@shared/schema";
import { cn } from "@/lib/utils";
import { VERDICT_CONFIG } from "@/lib/verdict-config";

interface RecentTrendListProps {
  data: RecentSimulation[];
}

export function RecentTrendList({ data }: RecentTrendListProps) {
  if (!data || data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">No simulations yet</p>
    );
  }

  const reversed = [...data].reverse();

  return (
    <ol className="space-y-3">
      {reversed.map((sim, idx) => {
        const config = VERDICT_CONFIG[sim.verdict] ?? VERDICT_CONFIG["DENY"];
        const Icon = config.icon;
        return (
          <li key={sim.id} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <Icon className={cn("h-5 w-5 shrink-0", config.textColor)} />
              {idx < reversed.length - 1 && (
                <div className="mt-1 h-full w-px bg-border" style={{ minHeight: "1.5rem" }} />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold">{sim.sourceId}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono font-semibold">{sim.targetId}</span>
                <span className={cn("ml-auto font-semibold", config.textColor)}>{config.label}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{sim.action}</span>
                <span>·</span>
                <span className="font-mono">Score: {sim.trustScore}</span>
                <span>·</span>
                <span>{(() => { const d = sim.timestamp ? new Date(sim.timestamp) : null; return d && !isNaN(d.getTime()) ? d.toLocaleTimeString() : "—"; })()}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
