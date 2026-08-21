import type { CanvasEdge, CanvasNode, ContinuumBrain } from "./types";

export type FlowNodeLike = {
  id: string;
  position: { x: number; y: number };
  data?: {
    title?: string;
    summary?: string;
    kind?: string;
    url?: string;
  };
};

export type FlowEdgeLike = {
  id: string;
  source: string;
  target: string;
  label?: unknown;
};

/**
 * Merge React Flow positions into brain canvas without wiping on empty/partial flow.
 * Returns null when persist should be skipped (empty flow vs populated brain).
 */
export function mergeCanvasFromFlow(
  current: ContinuumBrain,
  flowNodes: FlowNodeLike[],
  flowEdges: FlowEdgeLike[],
): ContinuumBrain["canvas"] | null {
  if (flowNodes.length === 0 && current.canvas.nodes.length > 0) {
    return null;
  }

  const byId = new Map(flowNodes.map((n) => [n.id, n]));
  const mergedIds = new Set<string>();
  const canvasNodes: CanvasNode[] = [];

  for (const prev of current.canvas.nodes) {
    const n = byId.get(prev.id);
    mergedIds.add(prev.id);
    if (n) {
      const data = n.data || {};
      canvasNodes.push({
        id: prev.id,
        type: prev.type,
        title: prev.title || String(data.title || prev.id),
        x: n.position.x,
        y: n.position.y,
        summary: prev.summary ?? data.summary,
        url: data.url ?? prev.url,
      });
    } else {
      canvasNodes.push(prev);
    }
  }
  for (const n of flowNodes) {
    if (mergedIds.has(n.id)) continue;
    const data = n.data || {};
    canvasNodes.push({
      id: n.id,
      type: (data.kind || "note") as CanvasNode["type"],
      title: String(data.title || n.id),
      x: n.position.x,
      y: n.position.y,
      summary: data.summary,
      url: data.url,
    });
  }

  const edges: CanvasEdge[] = flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === "string" ? e.label : undefined,
  }));

  return { nodes: canvasNodes, edges };
}
