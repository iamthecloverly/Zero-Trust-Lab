import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import type { NetworkGraph } from "@shared/schema";
import type { Node, Edge } from "vis-network";

interface NetworkGraphProps {
  data: NetworkGraph;
  onNodeClick?: (nodeId: string) => void;
}

export function NetworkGraphVisualization({ data, onNodeClick }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = new DataSet<Node>(
      data.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        shape: node.type === "user" ? "dot" : "box",
        color: node.color || (node.type === "user" ? "#22c55e" : "#3b82f6"),
        font: { color: "#fff", size: 14, face: "Inter" },
        size: 25,
      }))
    );

    const edges = new DataSet<Edge>(
      data.edges.map((edge, index) => ({
        id: index,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        color: { color: edge.color || "#666" },
        dashes: edge.dashes || false,
        width: edge.width || 2,
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        font: { size: 12, color: "#fff", face: "JetBrains Mono" },
      }))
    );

    const options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: true,
      },
      edges: {
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
        shadow: true,
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 100,
        },
        barnesHut: {
          gravitationalConstant: -2000,
          springConstant: 0.04,
          springLength: 150,
        },
      },
      interaction: {
        hover: true,
        navigationButtons: true,
        keyboard: true,
      },
    };

    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    if (onNodeClick) {
      networkRef.current.on("click", (params) => {
        if (params.nodes.length > 0) {
          onNodeClick(params.nodes[0] as string);
        }
      });
    }

    return () => {
      networkRef.current?.destroy();
    };
  }, [data, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-md"
      data-testid="network-graph-canvas"
      style={{ background: "transparent" }}
    />
  );
}
