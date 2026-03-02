import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { TrustEvaluation, NetworkGraph, Connection } from "@shared/schema";

interface SimulationContextType {
  // State
  simulationOpen: boolean;
  mfaDialogOpen: boolean;
  currentConnectionId: string | null;
  currentConnection: Connection | null;
  currentEvaluation: TrustEvaluation | null;
  networkGraph: NetworkGraph;
  pendingScenario: { userId: string; deviceId: string; action: string } | null;
  activeTab: string;
  selectedConnectionId: string | null;
  latestEdgeKey: string | undefined;

  // Actions
  setSimulationOpen: (open: boolean) => void;
  setMfaDialogOpen: (open: boolean) => void;
  setCurrentConnectionId: (id: string | null) => void;
  setCurrentConnection: (connection: Connection | null) => void;
  setCurrentEvaluation: (evaluation: TrustEvaluation | null) => void;
  setNetworkGraph: (graph: NetworkGraph) => void;
  setPendingScenario: (scenario: { userId: string; deviceId: string; action: string } | null) => void;
  setActiveTab: (tab: string) => void;
  setSelectedConnectionId: (id: string | null) => void;
  setLatestEdgeKey: (key: string | undefined) => void;

  // Composite actions
  startSimulation: (scenario?: { userId: string; deviceId: string; action: string }) => void;
  openMfaDialog: (connectionId: string) => void;
  closeMfaDialog: () => void;
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [currentConnection, setCurrentConnection] = useState<Connection | null>(null);
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

  const startSimulation = useCallback(
    (scenario?: { userId: string; deviceId: string; action: string }) => {
      if (scenario) {
        setPendingScenario(scenario);
      }
      setSimulationOpen(true);
    },
    []
  );

  const openMfaDialog = useCallback((connectionId: string) => {
    setCurrentConnectionId(connectionId);
    setMfaDialogOpen(true);
    setSimulationOpen(false);
  }, []);

  const closeMfaDialog = useCallback(() => {
    setMfaDialogOpen(false);
  }, []);

  const resetSimulation = useCallback(() => {
    setPendingScenario(null);
    setSelectedConnectionId(null);
    setCurrentConnectionId(null);
    setCurrentConnection(null);
    setCurrentEvaluation(null);
    setSimulationOpen(false);
    setMfaDialogOpen(false);
  }, []);

  const value: SimulationContextType = {
    simulationOpen,
    mfaDialogOpen,
    currentConnectionId,
    currentConnection,
    currentEvaluation,
    networkGraph,
    pendingScenario,
    activeTab,
    selectedConnectionId,
    latestEdgeKey,

    setSimulationOpen,
    setMfaDialogOpen,
    setCurrentConnectionId,
    setCurrentConnection,
    setCurrentEvaluation,
    setNetworkGraph,
    setPendingScenario,
    setActiveTab,
    setSelectedConnectionId,
    setLatestEdgeKey,

    startSimulation,
    openMfaDialog,
    closeMfaDialog,
    resetSimulation,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }
  return context;
}
