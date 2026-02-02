import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Policy } from "@shared/schema";

interface PolicyControlsProps {
  policies: Policy[];
  onPolicyToggle: (policyId: string, enabled: boolean) => void;
}

export function PolicyControls({ policies, onPolicyToggle }: PolicyControlsProps) {
  const policyGroups = {
    "MFA Requirements": policies.filter((p) => p.type === "mfa"),
    "Geographic Access": policies.filter((p) => p.type === "geo"),
    "Role Permissions": policies.filter((p) => p.type === "role"),
    "Device Trust": policies.filter((p) => p.type === "device"),
  };

  return (
    <Card>
      <CardHeader className="gap-1 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Policy Controls</CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle security policies in real-time
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(policyGroups).map(([groupName, groupPolicies]) => (
          <div key={groupName} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{groupName}</h4>
            <div className="space-y-3">
              {groupPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between rounded-md bg-muted p-3"
                >
                  <div className="flex-1">
                    <Label
                      htmlFor={`policy-${policy.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {policy.name}
                    </Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <span>Status:</span>
                      <Badge
                        variant={policy.enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {policy.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    id={`policy-${policy.id}`}
                    checked={policy.enabled}
                    onCheckedChange={(checked) => onPolicyToggle(policy.id, checked)}
                    data-testid={`switch-policy-${policy.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
