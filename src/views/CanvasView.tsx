import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAppStore } from "../store";
import type { CanvasNode, ContinuumBrain } from "@shared/types";
import { TerminalPanel } from "../components/TerminalPanel";

function toFlowNodes(nodes: CanvasNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    data: { label: `${n.type}: ${n.title}` },
    style: {
      background: n.type === "chat" ? "#ccfbf1" : "#ffffff",
      color: "#134e4a",
      border: "1px solid #99f6e4",
      borderRadius: 12,
      padding: 10,
      minWidth: 160,
      fontWeight: 600,
    },
  }));
}

export function CanvasView() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const setView = useAppStore((s) => s.setView);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const activeTerminalId = useAppStore((s) => s.activeTerminalId);

  const initialNodes = useMemo(
    () => (brain ? toFlowNodes(brain.canvas.nodes) : []),
    [brain],
  );
  const initialEdges = useMemo(
    () =>
      brain
        ? brain.canvas.edges.map(
            (e): Edge => ({
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
            }),
          )
        : [],
    [brain],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const persist = useCallback(
    async (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!brain) return;
      const canvas = {
        nodes: nextNodes.map((n) => {
          const prev = brain.canvas.nodes.find((x) => x.id === n.id);
          return {
            id: n.id,
            type: prev?.type || "note",
            title: prev?.title || String(n.data.label || n.id),
            x: n.position.x,
            y: n.position.y,
            summary: prev?.summary,
          } satisfies CanvasNode;
        }),
        edges: nextEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === "string" ? e.label : undefined,
        })),
      };
      const next: ContinuumBrain = { ...brain, canvas };
      await applyBrain(next);
    },
    [applyBrain, brain],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `e${Date.now()}`,
          },
          eds,
        );
        void persist(nodes, next);
        return next;
      });
    },
    [nodes, persist, setEdges],
  );

  async function addChatNode() {
    if (!brain) return;
    const id = `n${Date.now()}`;
    const node: CanvasNode = {
      id,
      type: "chat",
      title: `Chat ${brain.canvas.nodes.length + 1}`,
      x: 120 + brain.canvas.nodes.length * 40,
      y: 140 + brain.canvas.nodes.length * 30,
      summary: "Claude CLI session",
    };
    await applyBrain({
      ...brain,
      canvas: { ...brain.canvas, nodes: [...brain.canvas.nodes, node] },
    });
    setSelected(id);
    setActiveTerminalId(id);
  }

  async function branchFromSelected() {
    if (!brain || !selected) return;
    const parent = brain.canvas.nodes.find((n) => n.id === selected);
    if (!parent) return;
    const id = `n${Date.now()}`;
    const node: CanvasNode = {
      id,
      type: "chat",
      title: `Branch of ${parent.title}`,
      x: parent.x + 220,
      y: parent.y + 40,
      summary: `Branched from ${parent.id}`,
    };
    const edge = {
      id: `e${Date.now()}`,
      source: parent.id,
      target: id,
      label: "branch",
    };
    await applyBrain({
      ...brain,
      canvas: {
        nodes: [...brain.canvas.nodes, node],
        edges: [...brain.canvas.edges, edge],
      },
    });
    setSelected(id);
    setActiveTerminalId(id);
  }

  if (!brain) return null;

  return (
    <ReactFlowProvider>
    <div className="stack">
      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Canvas</h2>
            <p className="sub">
              Bonscape-style nodes. Chat nodes open Claude CLI in-app.
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => void addChatNode()}>
              Add chat node
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!selected}
              onClick={() => void branchFromSelected()}
            >
              Branch selected
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setView("agents")}
            >
              Agents panel
            </button>
          </div>
        </div>
        <div className="canvas-wrap">
          <ReactFlow
            colorMode="light"
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={(_e, _node, all) => {
              void persist(all, edges);
            }}
            onNodeClick={(_e, node) => {
              setSelected(node.id);
              const meta = brain.canvas.nodes.find((n) => n.id === node.id);
              if (meta?.type === "chat") setActiveTerminalId(node.id);
            }}
            fitView
          >
            <Background gap={18} size={1} color="#99f6e4" />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      </section>

      {activeTerminalId && (
        <section className="panel">
          <h2>Claude CLI — node {activeTerminalId}</h2>
          <p className="sub">
            In-app terminal in the project folder. Read CONTINUUM.md; update when needed.
          </p>
          <TerminalPanel id={activeTerminalId} />
        </section>
      )}
    </div>
    </ReactFlowProvider>
  );
}
