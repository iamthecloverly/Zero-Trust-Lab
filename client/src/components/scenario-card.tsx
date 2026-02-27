import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import type { Scenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

interface ScenarioCardProps {
  scenario: Scenario;
  onRun?: (scenario: Scenario) => void;
}

const verdictStyles = {
  ALLOW:         { label: "ALLOW",     className: "bg-status-allow/15 text-status-allow border-status-allow/30 border" },
  CHALLENGE_MFA: { label: "CHALLENGE", className: "bg-status-challenge/15 text-status-challenge border-status-challenge/30 border" },
  DENY:          { label: "DENY",      className: "bg-status-deny/15 text-status-deny border-status-deny/30 border" },
};

const categoryColors: Record<string, string> = {
  "Identity & Access": "bg-primary/10 text-primary",
  "Device Trust":      "bg-accent text-accent-foreground",
  "Geographic Risk":   "bg-status-challenge/10 text-status-challenge",
  "Least Privilege":   "bg-status-deny/10 text-status-deny",
};

export function ScenarioCard({ scenario, onRun }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  const verdict = verdictStyles[scenario.expectedVerdict];

  const handleRun = () => {
    if (onRun) {
      onRun(scenario);
    } else {
      navigate("/");
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                categoryColors[scenario.category] ?? "bg-muted text-muted-foreground"
              )}
            >
              {scenario.category}
            </span>
            <DifficultyBadge difficulty={scenario.difficulty} />
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              verdict.className
            )}
          >
            {verdict.label}
          </span>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug">{scenario.title}</h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Learning objective
        </button>
        {expanded && (
          <p className="rounded-md bg-accent/50 px-3 py-2 text-xs italic text-accent-foreground">
            {scenario.learningObjective}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {scenario.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <Button size="sm" className="mt-2 w-full gap-2" onClick={handleRun}>
          <Play className="h-3.5 w-3.5" />
          Run This Scenario
        </Button>
      </CardContent>
    </Card>
  );
}
