import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import type { NetworkGraph } from "@shared/schema";
import type { Node, Edge } from "vis-network";

interface NetworkGraphProps {
  data: NetworkGraph;
  latestEdgeKey?: string;
  onNodeClick?: (nodeId: string) => void;
}

export function NetworkGraphVisualization({
  data,
  latestEdgeKey,
  onNodeClick,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setInitError(false);

    let network: Network | null = null;
    const flashTimers: ReturnType<typeof setTimeout>[] = [];
    let highlightedNode: string | null = null;
    let edgesDataSet: DataSet<Edge> | null = null;
    const edgeOriginalColors = new Map<string, string>();

    const init = () => {
      // Don't create vis-network in a 0×0 container (e.g. hidden tab).
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Already initialised for this effect run.
      if (network) return;

      try {
        // ── Deduplicate nodes ──────────────────────────────────────────────
        const nodeById = new Map<string, typeof data.nodes[0]>();
        for (const n of data.nodes) nodeById.set(n.id, n);

        const nodesDataSet = new DataSet<Node>(
          Array.from(nodeById.values()).map((node) => {
            const isUser = node.type === "user";
            return {
              id: node.id,
              label: node.label,
              title: `${isUser ? "User" : "Device"}: ${node.id}`,
              shape: isUser ? "ellipse" : "box",
              color: {
                background: node.color || (isUser ? "#a855f7" : "#0e7490"),
                border: isUser ? "#9333ea" : "#0891b2",
                highlight: {
                  background: isUser ? "#c084fc" : "#22d3ee",
                  border: isUser ? "#a855f7" : "#0e7490",
                },
                hover: {
                  background: isUser ? "#c084fc" : "#22d3ee",
                  border: isUser ? "#a855f7" : "#0e7490",
                },
              },
              font: { color: "#ffffff", size: 13, face: "Inter, sans-serif" },
              size: isUser ? 22 : 20,
              borderWidth: 2,
              shadow: { enabled: true, color: "rgba(0,0,0,0.3)", size: 6, x: 2, y: 2 },
            };
          })
        );

        // ── Deduplicate edges (last wins per from→to pair) ─────────────────
        const edgeByPair = new Map<string, typeof data.edges[0]>();
        for (const e of data.edges) edgeByPair.set(`${e.from}-${e.to}`, e);

        edgesDataSet = new DataSet<Edge>(
          Array.from(edgeByPair.values()).map((edge) => {
            const edgeId = `${edge.from}-${edge.to}`;
            const color = edge.color || "#a78bfa";
            edgeOriginalColors.set(edgeId, color);
            return {
              id: edgeId,
              from: edge.from,
              to: edge.to,
              label: edge.label || "",
              color: { color, highlight: color, hover: color },
              dashes: edge.dashes || false,
              width: (edge as { width?: number }).width ?? 2,
              arrows: { to: { enabled: true, scaleFactor: 0.9, type: "arrow" } },
              font: {
                size: 11,
                color: "#f8fafc",
                face: "monospace",
                strokeWidth: 3,
                strokeColor: "#0f172a",
                align: "middle",
              },
            };
          })
        );

        network = new Network(
          container,
          { nodes: nodesDataSet, edges: edgesDataSet },
          {
            nodes: { borderWidth: 2, borderWidthSelected: 3 },
            edges: { smooth: { enabled: true, type: "curvedCW", roundness: 0.2 }, shadow: false },
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
          }
        );

        // ── Feature 6: flash newest edge after layout stabilises ───────────
        if (latestEdgeKey) {
          network.once("stabilized", () => {
            if (!edgesDataSet) return;
            const origColor = edgeOriginalColors.get(latestEdgeKey);
            const origEdge = edgesDataSet.get(latestEdgeKey);
            const origWidth = (origEdge as { width?: number } | null)?.width ?? 2;
            if (!origColor || !origEdge) return;

            const bright = { color: "#ffffff", highlight: "#ffffff", hover: "#ffffff" };
            const normal = { color: origColor, highlight: origColor, hover: origColor };

            try {
              edgesDataSet.update({ id: latestEdgeKey, width: 6, color: bright });
              flashTimers.push(setTimeout(() => { try { edgesDataSet?.update({ id: latestEdgeKey, width: origWidth, color: normal }); } catch {} }, 350));
              flashTimers.push(setTimeout(() => { try { edgesDataSet?.update({ id: latestEdgeKey, width: 6, color: bright }); } catch {} }, 700));
              flashTimers.push(setTimeout(() => { try { edgesDataSet?.update({ id: latestEdgeKey, width: origWidth, color: normal }); } catch {} }, 1050));
            } catch { /* ignore flash errors */ }
          });
        }

        // ── Feature 2: node click → highlight connected edges ─────────────
        const resetAllEdges = () => {
          if (!edgesDataSet) return;
          const updates: Array<{ id: string; color: object }> = [];
          edgesDataSet.forEach((edge) => {
            const id = edge.id as string;
            const orig = edgeOriginalColors.get(id) || "#a78bfa";
            updates.push({ id, color: { color: orig, highlight: orig, hover: orig } });
          });
          for (const u of updates) edgesDataSet.update(u);
        };

        network.on("click", (params) => {
          if (!edgesDataSet || !network) return;
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0] as string;
            if (highlightedNode === nodeId) {
              highlightedNode = null;
              resetAllEdges();
            } else {
              highlightedNode = nodeId;
              const connected = new Set(network.getConnectedEdges(nodeId) as string[]);
              const updates: Array<{ id: string; color: object }> = [];
              edgesDataSet.forEach((edge) => {
                const id = edge.id as string;
                const orig = edgeOriginalColors.get(id) || "#a78bfa";
                updates.push({
                  id,
                  color: connected.has(id)
                    ? { color: orig, highlight: orig, hover: orig }
                    : { color: "#1e293b", highlight: "#1e293b", hover: "#1e293b" },
                });
              });
              for (const u of updates) edgesDataSet.update(u);
            }
            onNodeClick?.(nodeId);
          } else if (params.edges.length === 0 && highlightedNode !== null) {
            highlightedNode = null;
            resetAllEdges();
          }
        });
      } catch (err) {
        console.error("[NetworkGraph] init error:", err);
        setInitError(true);
      }
    };

    // Init immediately (if container already visible) and on every resize
    // so switching tabs re-initialises the graph at the correct dimensions.
    const ro = new ResizeObserver(() => {
      if (network) {
        try { network.redraw(); network.fit(); } catch { /* ignore */ }
      } else {
        init();
      }
    });
    ro.observe(container);
    init();

    return () => {
      ro.disconnect();
      flashTimers.forEach(clearTimeout);
      network?.destroy();
    };
  }, [data, latestEdgeKey, onNodeClick]);

  if (initError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Graph failed to render.</p>
          <button
            className="text-primary underline"
            onClick={() => setInitError(false)}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div
        ref={containerRef}
        className="flex-1 rounded-md"
        data-testid="network-graph-canvas"
        style={{ background: "transparent", minHeight: 0 }}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded-full bg-[#a855f7]" />
          User
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded bg-[#0e7490]" />
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
            style={{ background: "repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 4px,transparent 4px,transparent 7px)" }}
          />
          ⚠ MFA Challenge
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5"
            style={{ background: "repeating-linear-gradient(90deg,#ef4444 0,#ef4444 4px,transparent 4px,transparent 7px)" }}
          />
          ✕ Deny
        </span>
        <span className="hidden h-3 w-px bg-border sm:block" />
        <span className="text-muted-foreground/70 hidden sm:inline">Click a node to highlight its connections</span>
      </div>
    </div>
  );
}
