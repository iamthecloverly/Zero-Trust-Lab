import { Shield, Play } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Connection, AnalyticsResponse } from "@shared/schema";

interface TopNavProps {
  onRunSimulation: () => void;
}

const NAV_LINKS = [
  { label: "Dashboard",  href: "/" },
  { label: "Scenarios",  href: "/scenarios" },
  { label: "Analytics",  href: "/analytics" },
  { label: "Policies",   href: "/policies" },
];

export function TopNav({ onRunSimulation }: TopNavProps) {
  const [location] = useLocation();
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });
  const { data: analytics } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics"],
  });

  const isLive = connections.length > 0;
  const totalViolations = analytics
    ? analytics.policyViolations.filter((v) => v.violationCount > 0).length
    : 0;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold tracking-tight">ZeroTrustLab</span>
        <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline-flex">
          v2.0.0
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 ml-4">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive =
            href === "/" ? location === "/" : location.startsWith(href);
          const isPolicies = href === "/policies";
          return (
            <Link key={href} href={href}>
              <span
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
                {isPolicies && totalViolations > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-deny px-1 text-[9px] font-bold text-white leading-none">
                    {totalViolations > 99 ? "99+" : totalViolations}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Live status pill */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            isLive
              ? "bg-status-allow/15 text-status-allow"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span className="relative flex h-2 w-2">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-allow opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isLive ? "bg-status-allow" : "bg-muted-foreground"
              )}
            />
          </span>
          {isLive ? "Live" : "Idle"}
        </div>

        <ThemeToggle />

        <Button
          size="sm"
          className="gap-1.5"
          onClick={onRunSimulation}
          data-testid="button-run-simulation"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Run Simulation</span>
          <span className="sm:hidden">Run</span>
        </Button>
      </div>
    </header>
  );
}
