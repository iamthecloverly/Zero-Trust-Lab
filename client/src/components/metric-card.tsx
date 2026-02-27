import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  sub?: string;
  accent?: "allow" | "challenge" | "deny" | "neutral";
}

const accentClasses: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  allow: "text-status-allow",
  challenge: "text-status-challenge",
  deny: "text-status-deny",
  neutral: "text-primary",
};

export function MetricCard({ label, value, icon, sub, accent = "neutral" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`shrink-0 rounded-md bg-muted p-2.5 ${accentClasses[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold tabular-nums ${accentClasses[accent]}`}>
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
