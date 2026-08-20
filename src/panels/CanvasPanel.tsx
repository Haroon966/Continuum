import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAppStore } from "../store";
import type { CanvasNode, ContinuumBrain } from "@shared/types";
import { TerminalPanel } from "../components/TerminalPanel";

function ChatBoxNode({ data, selected }: NodeProps) {
  const d = data as {
    title: string;
    summary?: string;
    kind: string;
  };
  return (
    <div className={`bon-node${selected ? " selected" : ""} bon-node-${d.kind}`}>
      <Handle type="target" position={Position.Left} />
      <div className="bon-node-bar">{d.kind}</div>
      <div className="bon-node-title">{d.title}</div>
      {d.summary ? <div className="bon-node-body">{d.summary}</div> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { bonChat: ChatBoxNode };

function toFlowNodes(
  nodes: CanvasNode[],
  selectedNodeId: string | null,
): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: "bonChat",
    position: { x: n.x, y: n.y },
    selected: selectedNodeId === n.id,
    data: {
      title: n.title,
      summary: n.summary,
      kind: n.type,
    },
  }));
}

function CanvasInner() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const activeTerminalId = useAppStore((s) => s.activeTerminalId);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);

  const initialNodes = useMemo(
    () => (brain ? toFlowNodes(brain.canvas.nodes, selectedNodeId) : []),
    [brain, selectedNodeId],
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
              animated: true,
              style: { stroke: "#0d9488", strokeWidth: 2 },
            }),
          )
        : [],
    [brain],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
          const data = n.data as { title?: string; summary?: string; kind?: string };
          return {
            id: n.id,
            type: (prev?.type || data.kind || "note") as CanvasNode["type"],
            title: prev?.title || String(data.title || n.id),
            x: n.position.x,
            y: n.position.y,
            summary: prev?.summary || data.summary,
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
            animated: true,
            label: "branch",
            style: { stroke: "#0d9488", strokeWidth: 2 },
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
      x: 140 + brain.canvas.nodes.length * 48,
      y: 120 + brain.canvas.nodes.length * 36,
      summary: "Branch or continue — Claude CLI opens in the dock",
    };
    let tasks = brain.tasks;
    if (selectedTaskId) {
      tasks = brain.tasks.map((t) =>
        t.id === selectedTaskId ? { ...t, link: id } : t,
      );
    }
    await applyBrain({
      ...brain,
      tasks,
      canvas: { ...brain.canvas, nodes: [...brain.canvas.nodes, node] },
    });
    setSelectedNodeId(id);
    setActiveTerminalId(id);
  }

  async function branchSelected() {
    if (!brain || !selectedNodeId) return;
    const parent = brain.canvas.nodes.find((n) => n.id === selectedNodeId);
    if (!parent) return;
    const id = `n${Date.now()}`;
    const node: CanvasNode = {
      id,
      type: "chat",
      title: `Branch · ${parent.title}`,
      x: parent.x + 280,
      y: parent.y + 40,
      summary: `Side-quest from ${parent.id}`,
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
    setSelectedNodeId(id);
    setActiveTerminalId(id);
  }

  if (!brain) return null;

  const selectedMeta = selectedNodeId
    ? brain.canvas.nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <div className="bonscape">
      <div className="bonscape-toolbar">
        <div>
          <h2>Canvas</h2>
          <p className="sub">
            Bonscape-style whiteboard — each box is a chat; draw lines to branch.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => void addChatNode()}>
            New chat box
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!selectedNodeId}
            onClick={() => void branchSelected()}
          >
            Branch selected
          </button>
        </div>
      </div>

      <div className="bonscape-stage">
        <div className="bonscape-canvas">
          <ReactFlow
            colorMode="light"
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={(_e, _node, all) => {
              void persist(all, edges);
            }}
            onNodeClick={(_e, node) => {
              setSelectedNodeId(node.id);
              const meta = brain.canvas.nodes.find((n) => n.id === node.id);
              if (meta?.type === "chat") setActiveTerminalId(node.id);
              const linkedTask = brain.tasks.find((t) => t.link === node.id);
              if (linkedTask) {
                useAppStore.getState().setSelectedTaskId(linkedTask.id);
              }
            }}
            onPaneClick={() => {
              /* keep selection for dock */
            }}
            fitView
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} size={1} color="#c5ebe3" />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>

        {selectedMeta?.type === "chat" && activeTerminalId && (
          <aside className="bonscape-dock" aria-label="Chat session">
            <div className="bonscape-dock-head">
              <div>
                <strong>{selectedMeta.title}</strong>
                <div className="muted">{selectedMeta.summary || "Claude CLI session"}</div>
              </div>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setActiveTerminalId(null)}
              >
                Hide
              </button>
            </div>
            <TerminalPanel id={activeTerminalId} />
          </aside>
        )}
      </div>
    </div>
  );
}

export function CanvasPanel() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
