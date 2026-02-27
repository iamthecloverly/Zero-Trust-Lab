import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, MapPin, UserCheck } from "lucide-react";
import type { Policy } from "@shared/schema";

interface PolicyDetailCardProps {
  policy: Policy;
  onToggle: (id: string, enabled: boolean) => void;
  isPending?: boolean;
}

const POLICY_META: Record<
  string,
  {
    icon: typeof Shield;
    description: string;
    impact: string;
    affected: string;
    typeBadgeClass: string;
  }
> = {
  mfa: {
    icon: Shield,
    description:
      "Requires users to have multi-factor authentication enabled. Users without MFA are considered lower-trust and receive a score penalty, triggering additional verification steps.",
    impact: "-30 pts when violated",
    affected: "All users without MFA enabled",
    typeBadgeClass: "bg-primary/10 text-primary border-primary/20 border",
  },
  device: {
    icon: Smartphone,
    description:
      "Verifies that the connecting device has been enrolled and confirmed by the security team. Unverified devices represent an unknown endpoint risk — the highest single penalty in the engine.",
    impact: "-40 pts when violated",
    affected: "Any unverified device",
    typeBadgeClass: "bg-status-challenge/10 text-status-challenge border-status-challenge/20 border",
  },
  geo: {
    icon: MapPin,
    description:
      "Restricts access to connections originating from allowed regions (US and CA). Geographic location is not inherently trustworthy — access from outside approved regions triggers scrutiny.",
    impact: "-20 pts when violated",
    affected: "Devices located outside US / CA",
    typeBadgeClass: "bg-accent text-accent-foreground border-accent-foreground/10 border",
  },
  role: {
    icon: UserCheck,
    description:
      "Enforces least-privilege by requiring the Admin role for Server access. Interns, Contractors, and Engineers attempting server-level operations violate this policy.",
    impact: "-10 pts when violated",
    affected: "Non-admin users accessing Server devices",
    typeBadgeClass: "bg-status-deny/10 text-status-deny border-status-deny/20 border",
  },
};

export function PolicyDetailCard({ policy, onToggle, isPending }: PolicyDetailCardProps) {
  const meta = POLICY_META[policy.type] ?? {
    icon: Shield,
    description: "Custom policy.",
    impact: "Unknown",
    affected: "Varies",
    typeBadgeClass: "bg-muted text-muted-foreground",
  };
  const Icon = meta.icon;

  return (
    <Card className={policy.enabled ? "" : "opacity-60"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{policy.name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.typeBadgeClass}`}
                >
                  {policy.type.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {policy.enabled ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <Switch
            checked={policy.enabled}
            onCheckedChange={(checked) => onToggle(policy.id, checked)}
            disabled={isPending}
            aria-label={`Toggle ${policy.name}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-md bg-status-deny/10 px-3 py-1.5 text-xs font-semibold text-status-deny">
            {meta.impact}
          </div>
          <div className="rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            Affects: {meta.affected}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
