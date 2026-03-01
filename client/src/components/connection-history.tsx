import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Connection } from "@shared/schema";

interface ConnectionHistoryProps {
  connections: Connection[];
  scrollHeight?: string;
  selectedId?: string | null;
  onSelect?: (conn: Connection) => void;
}

export function ConnectionHistory({
  connections,
  scrollHeight = "h-[400px]",
  selectedId,
  onSelect,
}: ConnectionHistoryProps) {
  const verdictConfig = {
    ALLOW: {
      icon: CheckCircle2,
      variant: "default" as const,
      color: "text-status-allow",
    },
    CHALLENGE_MFA: {
      icon: AlertTriangle,
      variant: "secondary" as const,
      color: "text-status-challenge",
    },
    DENY: {
      icon: XCircle,
      variant: "destructive" as const,
      color: "text-status-deny",
    },
  };

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader className="gap-1 space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Connection History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent access attempts will appear here
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No connections yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-1 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Connection History</CardTitle>
        <p className="text-sm text-muted-foreground">
          {connections.length} connection{connections.length !== 1 ? "s" : ""} logged
          {onSelect && (
            <span className="ml-1 text-muted-foreground/70">· click a row to inspect</span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`${scrollHeight} pr-4`}>
          <div className="space-y-3">
            {connections
              .slice()
              .reverse()
              .map((conn) => {
                const config = verdictConfig[conn.verdict as keyof typeof verdictConfig] ?? verdictConfig["DENY"];
                const VerdictIcon = config.icon;
                const isSelected = selectedId === conn.id;

                return (
                  <div
                    key={conn.id}
                    className={cn(
                      "rounded-md border border-border bg-card p-4 space-y-2 transition-colors",
                      onSelect && "cursor-pointer hover:bg-muted/60",
                      isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30"
                    )}
                    data-testid={`connection-${conn.id}`}
                    onClick={() => onSelect?.(conn)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <span className="font-semibold">{conn.sourceId}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">{conn.targetId}</span>
                      </div>
                      <Badge variant={config.variant} className="gap-1.5">
                        <VerdictIcon className="h-3 w-3" />
                        {conn.verdict}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{conn.action}</span>
                      <span className="font-mono">Score: {conn.trustScore}/100</span>
                    </div>

                    {conn.mfaChallenged && (
                      <div className="flex items-center gap-2 pt-1">
                        {conn.mfaVerified === true ? (
                          <Badge variant="default" className="gap-1.5 text-xs">
                            <ShieldCheck className="h-3 w-3" />
                            MFA Verified
                          </Badge>
                        ) : conn.mfaVerified === false ? (
                          <Badge variant="destructive" className="gap-1.5 text-xs">
                            <ShieldX className="h-3 w-3" />
                            MFA Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <ShieldAlert className="h-3 w-3" />
                            MFA Pending
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {new Date(conn.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
