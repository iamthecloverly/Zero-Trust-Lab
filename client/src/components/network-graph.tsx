import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import type { NetworkGraph } from "@shared/schema";
import type { Node, Edge } from "vis-network";

interface NetworkGraphProps {
  data: NetworkGraph;
  /** "sourceId-targetId" of the most recent simulation edge to flash on stabilisation */
  latestEdgeKey?: string;
  onNodeClick?: (nodeId: string) => void;
}

export function NetworkGraphVisualization({
  data,
  latestEdgeKey,
  onNodeClick,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const edgeOriginalColors = new Map<string, string>();

    const nodesDataSet = new DataSet<Node>(
      data.nodes.map((node) => {
        const isUser = node.type === "user";
        return {
          id: node.id,
          label: node.label,
          title: `${isUser ? "User" : "Device"}: ${node.id}`,
          shape: isUser ? "ellipse" : "box",
          color: {
            background: node.color || (isUser ? "#6366f1" : "#64748b"),
            border: isUser ? "#4f46e5" : "#475569",
            highlight: {
              background: isUser ? "#818cf8" : "#94a3b8",
              border: isUser ? "#6366f1" : "#64748b",
            },
            hover: {
              background: isUser ? "#818cf8" : "#94a3b8",
              border: isUser ? "#6366f1" : "#64748b",
            },
          },
          font: { color: "#ffffff", size: 13, face: "Inter, sans-serif" },
          size: isUser ? 22 : 20,
          borderWidth: 2,
          shadow: { enabled: true, color: "rgba(0,0,0,0.3)", size: 6, x: 2, y: 2 },
        };
      })
    );

    // Defensive dedup: keep only the last edge per from→to pair.
    // Guards against any path that sends duplicate pairs (e.g. stale cache race).
    const edgeByPair = new Map<string, typeof data.edges[0]>();
    for (const e of data.edges) {
      edgeByPair.set(`${e.from}-${e.to}`, e);
    }
    const uniqueEdges = Array.from(edgeByPair.values());

    const edgesDataSet = new DataSet<Edge>(
      uniqueEdges.map((edge) => {
        const edgeId = `${edge.from}-${edge.to}`;
        const color = edge.color || "#94a3b8";
        edgeOriginalColors.set(edgeId, color);
        const origWidth = (edge as { width?: number }).width ?? 2;
        return {
          id: edgeId,
          from: edge.from,
          to: edge.to,
          label: edge.label || "",
          color: { color, highlight: color, hover: color },
          dashes: edge.dashes || false,
          width: origWidth,
          arrows: { to: { enabled: true, scaleFactor: 0.9, type: "arrow" } },
          font: {
            size: 11,
            color: "#f8fafc",
            face: "monospace",
            strokeWidth: 3,
            strokeColor: "#0f172a",
            align: "middle",
          },
          smooth: { enabled: true, type: "curvedCW", roundness: 0.2 },
        };
      })
    );

    const options = {
      nodes: { borderWidth: 2, borderWidthSelected: 3 },
      edges: { smooth: false, shadow: false },
      physics: {
        enabled: true,
        stabilization: { iterations: 150, fit: true },
        barnesHut: {
          gravitationalConstant: -3000,
          springConstant: 0.05,
          springLength: 160,
          damping: 0.4,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        navigationButtons: false,
        keyboard: false,
        zoomView: true,
        dragView: true,
      },
      layout: { improvedLayout: true },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );
    networkRef.current = network;
    const flashTimers: ReturnType<typeof setTimeout>[] = [];

    // --- Feature 6: flash newest edge after layout stabilises ---
    if (latestEdgeKey) {
      network.once("stabilized", () => {
        const origColor = edgeOriginalColors.get(latestEdgeKey);
        const origEdge = edgesDataSet.get(latestEdgeKey);
        const origWidth = origEdge ? ((origEdge as { width?: number }).width ?? 2) : 2;
        if (!origColor) return;

        const bright = { color: "#ffffff", highlight: "#ffffff", hover: "#ffffff" };
        const normal = { color: origColor, highlight: origColor, hover: origColor };

        edgesDataSet.update({ id: latestEdgeKey, width: 6, color: bright });
        flashTimers.push(setTimeout(() => edgesDataSet.update({ id: latestEdgeKey, width: origWidth, color: normal }), 350));
        flashTimers.push(setTimeout(() => edgesDataSet.update({ id: latestEdgeKey, width: 6, color: bright }), 700));
        flashTimers.push(setTimeout(() => edgesDataSet.update({ id: latestEdgeKey, width: origWidth, color: normal }), 1050));
      });
    }

    // --- Feature 2: node click → highlight connected edges, dim others ---
    let highlightedNode: string | null = null;

    const resetAllEdges = () => {
      edgesDataSet.forEach((edge) => {
        const id = edge.id as string;
        const orig = edgeOriginalColors.get(id) || "#94a3b8";
        edgesDataSet.update({ id, color: { color: orig, highlight: orig, hover: orig } });
      });
    };

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;

        if (highlightedNode === nodeId) {
          // Second click on same node → reset
          highlightedNode = null;
          resetAllEdges();
        } else {
          highlightedNode = nodeId;
          const connected = new Set(network.getConnectedEdges(nodeId) as string[]);

          edgesDataSet.forEach((edge) => {
            const id = edge.id as string;
            const orig = edgeOriginalColors.get(id) || "#94a3b8";
            if (connected.has(id)) {
              edgesDataSet.update({ id, color: { color: orig, highlight: orig, hover: orig } });
            } else {
              // Dim non-connected edges
              edgesDataSet.update({ id, color: { color: "#1e293b", highlight: "#1e293b", hover: "#1e293b" } });
            }
          });
        }

        onNodeClick?.(nodeId);
      } else if (params.edges.length === 0) {
        // Click on empty canvas → reset
        if (highlightedNode !== null) {
          highlightedNode = null;
          resetAllEdges();
        }
      }
    });

    return () => {
      flashTimers.forEach(clearTimeout);
      network.destroy();
    };
  }, [data, latestEdgeKey, onNodeClick]);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {/* Graph canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded-md"
        data-testid="network-graph-canvas"
        style={{ background: "transparent", minHeight: 0 }}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Legend:</span>

        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded-full bg-[#6366f1]" />
          User
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded bg-[#64748b]" />
          Device
        </span>

        <span className="hidden h-3 w-px bg-border sm:block" />

        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-[#22c55e]" />
          ✓ Allow
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5"
            style={{
              background:
                "repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 4px,transparent 4px,transparent 7px)",
            }}
          />
          ⚠ MFA Challenge
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5"
            style={{
              background:
                "repeating-linear-gradient(90deg,#ef4444 0,#ef4444 4px,transparent 4px,transparent 7px)",
            }}
          />
          ✕ Deny
        </span>

        <span className="hidden h-3 w-px bg-border sm:block" />
        <span className="text-muted-foreground/70 hidden sm:inline">
          Click a node to highlight its connections
        </span>
      </div>
    </div>
  );
}
