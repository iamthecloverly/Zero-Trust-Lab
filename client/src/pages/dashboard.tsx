import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RefreshCw, Activity, Shield, BarChart3, Network } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { NetworkGraphVisualization } from "@/components/network-graph";
import { TrustScoreDisplay } from "@/components/trust-score-display";
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
  const [pendingScenario, setPendingScenario] = useState<{
    userId: string;
    deviceId: string;
    action: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("network");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [latestEdgeKey, setLatestEdgeKey] = useState<string | undefined>(undefined);

  // Read sessionStorage signals from TopNav / Scenario Library
  useEffect(() => {
    try {
      const openSim = sessionStorage.getItem("open-simulation");
      if (openSim) {
        sessionStorage.removeItem("open-simulation");
        setSimulationOpen(true);
      }

      const scenario = sessionStorage.getItem("pending-scenario");
      if (scenario) {
        sessionStorage.removeItem("pending-scenario");
        const parsed = JSON.parse(scenario);
        if (parsed && typeof parsed === "object" && typeof parsed.userId === "string" && typeof parsed.deviceId === "string" && typeof parsed.action === "string") {
          setPendingScenario(parsed as { userId: string; deviceId: string; action: string });
          setSimulationOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: devices = [] } = useQuery<Device[]>({ queryKey: ["/api/devices"] });
  const { data: connections = [] } = useQuery<Connection[]>({ queryKey: ["/api/connections"] });
  const { data: policies = [] } = useQuery<Policy[]>({ queryKey: ["/api/policies"] });
  const { data: graph } = useQuery<NetworkGraph>({
    queryKey: ["/api/network/graph"],
    enabled: connections.length > 0,
  });

  // Feature 3: replay evaluation for a selected connection from history
  const { data: replayEvaluation } = useQuery<TrustEvaluation>({
    queryKey: ["/api/connections", selectedConnectionId, "evaluation"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/connections/${selectedConnectionId}/evaluation`);
      return res.json() as Promise<TrustEvaluation>;
    },
    enabled: !!selectedConnectionId,
    staleTime: 30_000,
  });

  // When replay evaluation arrives, display it
  useEffect(() => {
    if (replayEvaluation) {
      setCurrentEvaluation(replayEvaluation);
    }
  }, [replayEvaluation]);

  const simulateMutation = useMutation({
    mutationFn: async (data: { userId: string; deviceId: string; action: string }) => {
      const res = await apiRequest("POST", "/api/simulate", data);
      return await res.json() as SimulationResponse;
    },
    onSuccess: (data) => {
      setCurrentEvaluation(data.evaluation);
      setNetworkGraph(data.graph);
      setPendingScenario(null);
      setSelectedConnectionId(null);
      setLatestEdgeKey(`${data.connection.sourceId}-${data.connection.targetId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });

      if (data.evaluation.verdict === "CHALLENGE_MFA") {
        setCurrentConnectionId(data.connection.id);
        // Store connection data in sessionStorage to handle serverless function restarts
        sessionStorage.setItem("mfa-pending-connection", JSON.stringify(data.connection));
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
      
      // Retrieve stored connection data to handle serverless restarts
      const storedConnection = sessionStorage.getItem("mfa-pending-connection");
      const connection = storedConnection ? JSON.parse(storedConnection) : null;
      
      const res = await apiRequest("POST", "/api/verify-mfa", {
        connectionId: currentConnectionId,
        code,
        connection, // Send connection data for serverless recovery
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        if (res.status === 404) {
          throw new Error("Connection expired");
        }
        throw new Error(errorData.error || "Verification failed");
      }
      
      const result = await res.json() as { verified: boolean; connection: Connection };
      
      // Clear stored connection after successful verification
      sessionStorage.removeItem("mfa-pending-connection");
      
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      if (!result.verified) throw new Error("Invalid verification code");
      return result;
    },
    onSuccess: () => {
      setMfaDialogOpen(false);
      toast({
        title: "MFA Verification Successful",
        description: "Access has been granted after MFA verification",
      });
    },
    onError: (error: Error) => {
      if (error.message === "Connection expired") {
        setMfaDialogOpen(false);
        sessionStorage.removeItem("mfa-pending-connection");
        toast({
          title: "Connection Expired",
          description: "The connection session expired. Please run a new simulation.",
          variant: "destructive",
        });
        setSimulationOpen(true);
      } else {
        toast({
          title: "MFA Verification Failed",
          description:
            error.message === "Invalid verification code"
              ? "Invalid verification code - please try again"
              : "An error occurred during verification",
          variant: "destructive",
        });
      }
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/network/reset", {}),
    onSuccess: () => {
      setCurrentEvaluation(null);
      setNetworkGraph({ nodes: [], edges: [] });
      setSelectedConnectionId(null);
      setLatestEdgeKey(undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/network/graph"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Network Reset", description: "All connections have been cleared" });
    },
  });

  // Feature 3: clicking a history row → load its evaluation and show Network tab
  const handleConnectionSelect = (conn: Connection) => {
    if (selectedConnectionId === conn.id) {
      // Deselect
      setSelectedConnectionId(null);
      setCurrentEvaluation(null);
    } else {
      setSelectedConnectionId(conn.id);
      setActiveTab("network");
    }
  };

  const displayGraph = graph || networkGraph;
  const activePolicies = policies.filter((p) => p.enabled).length;
  const allowCount = connections.filter((c) => c.verdict === "ALLOW").length;
  const allowRate =
    connections.length > 0
      ? Math.round((allowCount / connections.length) * 100)
      : 0;
  const avgTrustScore =
    connections.length > 0
      ? Math.round(connections.reduce((sum, c) => sum + c.trustScore, 0) / connections.length)
      : 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Dashboard"
        description="Monitor and simulate Zero Trust network security"
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            data-testid="button-reset-network"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-0 lg:grid-cols-4">
        <MetricCard
          label="Total Connections"
          value={connections.length}
          icon={<Activity className="h-5 w-5" />}
          sub="access attempts"
        />
        <MetricCard
          label="Avg Trust Score"
          value={connections.length > 0 ? `${avgTrustScore}/100` : "—"}
          icon={<Shield className="h-5 w-5" />}
          sub="across all sims"
          accent={
            connections.length === 0
              ? "neutral"
              : avgTrustScore >= 70
              ? "allow"
              : avgTrustScore >= 40
              ? "challenge"
              : "deny"
          }
        />
        <MetricCard
          label="Allow Rate"
          value={connections.length > 0 ? `${allowRate}%` : "—"}
          icon={<BarChart3 className="h-5 w-5" />}
          sub="verdicts allowed"
          accent={connections.length === 0 ? "neutral" : allowRate >= 70 ? "allow" : allowRate >= 40 ? "challenge" : "deny"}
        />
        <MetricCard
          label="Active Policies"
          value={`${activePolicies} / ${policies.length}`}
          icon={<Shield className="h-5 w-5" />}
          sub="enforcement rules"
          accent={activePolicies > 0 ? "allow" : "deny"}
        />
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <TabsList className="mb-3 w-fit">
            <TabsTrigger value="network" className="gap-2">
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="flex-1 overflow-hidden mt-0">
            <div className="flex h-full gap-4 overflow-hidden">
              {/* Graph */}
              <div className="flex-1 overflow-hidden network-graph-container">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    {displayGraph?.nodes?.length > 0 ? (
                      <NetworkGraphVisualization
                        data={displayGraph}
                        latestEdgeKey={latestEdgeKey}
                      />
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
              {/* Trust score sidebar */}
              <div className="w-80 shrink-0 overflow-y-auto">
                <TrustScoreDisplay evaluation={currentEvaluation} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-hidden mt-0">
            <div className="connection-history-container h-full overflow-y-auto">
              <ConnectionHistory
                connections={connections}
                scrollHeight="h-[calc(100vh-20rem)]"
                selectedId={selectedConnectionId}
                onSelect={handleConnectionSelect}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SimulationForm
        open={simulationOpen}
        onOpenChange={(open) => {
          setSimulationOpen(open);
          if (!open) setPendingScenario(null);
        }}
        users={users}
        devices={devices}
        onSubmit={(data) => simulateMutation.mutate(data)}
        isPending={simulateMutation.isPending}
        defaultValues={pendingScenario ?? undefined}
      />

      <MFAChallengeDialog
        open={mfaDialogOpen}
        onVerify={(code) => mfaVerifyMutation.mutateAsync(code)}
        onCancel={() => {
          setMfaDialogOpen(false);
          sessionStorage.removeItem("mfa-pending-connection");
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
