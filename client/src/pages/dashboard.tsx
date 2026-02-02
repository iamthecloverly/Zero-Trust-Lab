import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, RefreshCw } from "lucide-react";
import { NetworkGraphVisualization } from "@/components/network-graph";
import { TrustScoreDisplay } from "@/components/trust-score-display";
import { PolicyControls } from "@/components/policy-controls";
import { ConnectionHistory } from "@/components/connection-history";
import { SimulationForm } from "@/components/simulation-form";
import { MFAChallengeDialog } from "@/components/mfa-challenge-dialog";
import { ProductTour } from "@/components/product-tour";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  User,
  Device,
  Connection,
  Policy,
  SimulationResponse,
  TrustEvaluation,
  NetworkGraph,
} from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<TrustEvaluation | null>(null);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph>({ nodes: [], edges: [] });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const { data: graph } = useQuery<NetworkGraph>({
    queryKey: ["/api/network/graph"],
    enabled: connections.length > 0,
  });

  const simulateMutation = useMutation({
    mutationFn: async (data: { userId: string; deviceId: string; action: string }) => {
      const res = await apiRequest("POST", "/api/simulate", data);
      return await res.json() as SimulationResponse;
    },
    onSuccess: (data) => {
      setCurrentEvaluation(data.evaluation);
      setNetworkGraph(data.graph);
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      
      if (data.evaluation.verdict === "CHALLENGE_MFA") {
        setCurrentConnectionId(data.connection.id);
        setMfaDialogOpen(true);
        setSimulationOpen(false);
        toast({
          title: "MFA Challenge Required",
          description: "Please complete multi-factor authentication",
        });
      } else {
        toast({
          title: "Simulation Complete",
          description: `Verdict: ${data.evaluation.verdict} (Score: ${data.evaluation.trustScore}/100)`,
        });
        setSimulationOpen(false);
      }
    },
    onError: () => {
      toast({
        title: "Simulation Failed",
        description: "An error occurred during the simulation",
        variant: "destructive",
      });
    },
  });

  const mfaVerifyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!currentConnectionId) throw new Error("No connection ID");
      const res = await apiRequest("POST", "/api/verify-mfa", {
        connectionId: currentConnectionId,
        code,
      });
      const result = await res.json() as { verified: boolean; connection: Connection };
      
      // Always invalidate queries to refresh the connection list
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      
      if (!result.verified) {
        throw new Error("Invalid verification code");
      }
      
      return result;
    },
    onSuccess: (data) => {
      setMfaDialogOpen(false);
      
      toast({
        title: "MFA Verification Successful",
        description: "Access has been granted after MFA verification",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "MFA Verification Failed",
        description: error.message === "Invalid verification code" 
          ? "Invalid verification code - please try again"
          : "An error occurred during verification",
        variant: "destructive",
      });
    },
  });

  const policyMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/policies/${id}`, { enabled });
      return await res.json() as Policy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({
        title: "Policy Updated",
        description: "Policy has been updated successfully",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/network/reset", {});
    },
    onSuccess: () => {
      setCurrentEvaluation(null);
      setNetworkGraph({ nodes: [], edges: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      toast({
        title: "Network Reset",
        description: "All connections have been cleared",
      });
    },
  });

  const displayGraph = graph || networkGraph || { nodes: [], edges: [] };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and simulate Zero Trust network security
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              data-testid="button-reset-network"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => setSimulationOpen(true)}
              data-testid="button-run-simulation"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 network-graph-container">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              {displayGraph?.nodes?.length > 0 ? (
                <NetworkGraphVisualization data={displayGraph} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      No network activity yet
                    </p>
                    <Button onClick={() => setSimulationOpen(true)}>
                      <Play className="h-4 w-4 mr-2" />
                      Run Your First Simulation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-[400px] border-l border-border bg-muted/30 p-6 overflow-y-auto">
          <div className="space-y-6">
            <TrustScoreDisplay evaluation={currentEvaluation} />
            <PolicyControls
              policies={policies}
              onPolicyToggle={(id, enabled) => policyMutation.mutate({ id, enabled })}
            />
            <div className="connection-history-container">
              <ConnectionHistory connections={connections} />
            </div>
          </div>
        </div>
      </div>

      <SimulationForm
        open={simulationOpen}
        onOpenChange={setSimulationOpen}
        users={users}
        devices={devices}
        onSubmit={(data) => simulateMutation.mutate(data)}
        isPending={simulateMutation.isPending}
      />

      <MFAChallengeDialog
        open={mfaDialogOpen}
        onVerify={(code) => mfaVerifyMutation.mutateAsync(code)}
        onCancel={() => {
          setMfaDialogOpen(false);
          toast({
            title: "MFA Cancelled",
            description: "Verification was cancelled - connection remains challenged",
          });
        }}
        isPending={mfaVerifyMutation.isPending}
      />

      <ProductTour />
    </div>
  );
}
