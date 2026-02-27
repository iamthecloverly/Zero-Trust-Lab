import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PolicyDetailCard } from "@/components/policy-detail-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Policy } from "@shared/schema";

export default function PoliciesPage() {
  const { toast } = useToast();

  const { data: policies = [], isLoading } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const policyMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/policies/${id}`, { enabled });
      return await res.json() as Policy;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({
        title: "Policy Updated",
        description: `${updated.name} is now ${updated.enabled ? "active" : "inactive"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update the policy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activePolicies = policies.filter((p) => p.enabled).length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Policy Management"
        description={`${activePolicies} of ${policies.length} policies active`}
        right={
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Shield className="h-3.5 w-3.5" />
            Zero Trust Engine
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading policies…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {policies.map((policy) => (
              <PolicyDetailCard
                key={policy.id}
                policy={policy}
                onToggle={(id, enabled) => policyMutation.mutate({ id, enabled })}
                isPending={policyMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
