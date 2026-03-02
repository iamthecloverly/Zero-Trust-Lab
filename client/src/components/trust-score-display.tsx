import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  ShieldAlert,
  Lock,
  MapPin,
  UserX,
} from "lucide-react";
import type { TrustEvaluation } from "@shared/schema";

const iconMap: Record<string, typeof Shield> = {
  "check": Check,
  "shield-alert": ShieldAlert,
  "lock": Lock,
  "map-pin": MapPin,
  "user-x": UserX,
};

interface TrustScoreDisplayProps {
  evaluation: TrustEvaluation | null;
}

export function TrustScoreDisplay({ evaluation }: TrustScoreDisplayProps) {
  if (!evaluation) {
    return (
      <Card>
        <CardHeader className="gap-1 space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Trust Score</CardTitle>
          <p className="text-sm text-muted-foreground">
            Run a simulation to see trust evaluation
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Shield className="h-16 w-16 opacity-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const verdictConfig = {
    ALLOW: {
      color: "bg-status-allow",
      textColor: "text-status-allow",
      icon: CheckCircle2,
      label: "ALLOW",
    },
    CHALLENGE_MFA: {
      color: "bg-status-challenge",
      textColor: "text-status-challenge",
      icon: AlertTriangle,
      label: "CHALLENGE",
    },
    DENY: {
      color: "bg-status-deny",
      textColor: "text-status-deny",
      icon: XCircle,
      label: "DENY",
    },
  };

  const config = verdictConfig[evaluation.verdict as keyof typeof verdictConfig] ?? verdictConfig["DENY"];
  const VerdictIcon = config.icon;

  return (
    <Card>
      <CardHeader className="gap-1 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Trust Score</CardTitle>
        <p className="text-sm text-muted-foreground">Real-time evaluation</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(evaluation.trustScore / 100) * 352} 352`}
                className={config.textColor}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" data-testid="text-trust-score">
                {evaluation.trustScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Badge
            className={`${config.color} gap-2 px-4 py-2 text-white`}
            data-testid={`badge-verdict-${evaluation.verdict.toLowerCase()}`}
          >
            <VerdictIcon className="h-4 w-4" />
            <span className="font-bold">{config.label}</span>
          </Badge>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>
          <div className="space-y-2">
            {evaluation.breakdown.map((item, idx) => {
              const IconComponent = iconMap[item.icon] || Shield;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-muted p-3"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span
                    className={`text-sm font-mono font-semibold ${
                      item.points < 0 ? "text-status-deny" : "text-muted-foreground"
                    }`}
                  >
                    {item.points > 0 ? "+" : ""}
                    {item.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
