import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  SelectionMode,
  ConnectionMode,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useNodes,
  type Connection,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  SmartEdgeProvider,
  getFloatingEdgeParams,
  useSmartEdgePath,
} from "@tisoap/react-flow-smart-edge";
import { useAppStore } from "../store";
import type { CanvasNode, ContinuumBrain } from "@shared/types";
import { TerminalPanel } from "../components/TerminalPanel";
import {
  IconAgents,
  IconBranch,
  IconChat,
  IconCode,
  IconExternalLink,
  IconFile,
  IconImage,
  IconLink,
  IconSeed,
} from "../components/Icons";
import { mergeCanvasFromFlow } from "@shared/canvasPersist";

type BonData = {
  title: string;
  summary?: string;
  kind: string;
  url?: string;
};

function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").split("/")[0] || url;
  }
}

function NodeKindBar({
  kind,
  icon,
}: {
  kind: string;
  icon: ReactNode;
}) {
  return (
    <div className="bon-node-bar">
      <span className="bon-node-bar-icon">{icon}</span>
      <span>{kind}</span>
    </div>
  );
}

function NodeHandles() {
  return (
    <>
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="bon-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="bon-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="bon-handle"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="bon-handle"
      />
    </>
  );
}

function ChatBoxNode({ data, selected }: NodeProps) {
  const d = data as BonData;
  return (
    <div className={`bon-node${selected ? " selected" : ""} bon-node-${d.kind}`}>
      <NodeHandles />
      <NodeKindBar kind={d.kind} icon={<IconChat size={12} />} />
      <div className="bon-node-title">{d.title}</div>
      {d.summary ? <div className="bon-node-body">{d.summary}</div> : null}
    </div>
  );
}

function ImageBoxNode({ data, selected }: NodeProps) {
  const d = data as BonData;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!d.url) return;
      if (/^https?:\/\//i.test(d.url)) {
        if (alive) setSrc(d.url);
        return;
      }
      try {
        const dataUrl = await window.continuum.readCanvasAsset(d.url);
        if (alive) setSrc(dataUrl);
      } catch {
        if (alive) setSrc(null);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [d.url]);

  return (
    <div className={`bon-node bon-node-image${selected ? " selected" : ""}`}>
      <NodeHandles />
      <NodeKindBar kind="image" icon={<IconImage size={12} />} />
      {src ? (
        <img className="bon-node-img" src={src} alt={d.title} draggable={false} />
      ) : (
        <div className="bon-node-body">Missing image</div>
      )}
      <div className="bon-node-title">{d.title}</div>
      {d.url ? <div className="bon-node-path muted">{d.url}</div> : null}
    </div>
  );
}

function LinkBoxNode({ data, selected }: NodeProps) {
  const d = data as BonData;
  const host = d.url ? linkHost(d.url) : null;
  return (
    <div className={`bon-node bon-node-link${selected ? " selected" : ""}`}>
      <NodeHandles />
      <NodeKindBar kind="link" icon={<IconLink size={12} />} />
      <div className="bon-node-title">{d.title}</div>
      {d.url ? (
        <button
          type="button"
          className="bon-node-link-chip"
          title={d.url}
          onClick={(e) => {
            e.stopPropagation();
            void window.continuum.openExternalUrl(d.url!);
          }}
        >
          <span className="bon-node-link-mark" aria-hidden>
            <IconLink size={14} />
          </span>
          <span className="bon-node-link-text">
            <span className="bon-node-link-host">{host}</span>
            <span className="bon-node-link-url">{d.url}</span>
          </span>
          <span className="bon-node-link-go" aria-hidden>
            <IconExternalLink size={13} />
          </span>
        </button>
      ) : (
        <div className="bon-node-body">No URL</div>
      )}
    </div>
  );
}

function edgeLabelIcon(label: string) {
  const key = label.trim().toLowerCase();
  if (key.includes("seed")) return <IconSeed size={12} />;
  if (key.includes("code")) return <IconCode size={12} />;
  if (key.includes("branch")) return <IconBranch size={12} />;
  if (key.includes("agent")) return <IconAgents size={12} />;
  if (key.includes("doc")) return <IconFile size={12} />;
  if (key.includes("chat")) return <IconChat size={12} />;
  if (key.includes("image")) return <IconImage size={12} />;
  return <IconLink size={12} />;
}

/** Floating sides + A* around nodes; icon label on clean path center. */
function BonEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  animated,
}: EdgeProps) {
  const nodes = useNodes();
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  let sx = sourceX;
  let sy = sourceY;
  let tx = targetX;
  let ty = targetY;
  let sPos = sourcePosition;
  let tPos = targetPosition;

  if (sourceNode && targetNode) {
    try {
      const fp = getFloatingEdgeParams(sourceNode, targetNode);
      sx = fp.sx;
      sy = fp.sy;
      tx = fp.tx;
      ty = fp.ty;
      sPos = fp.sourcePos;
      tPos = fp.targetPos;
    } catch {
      // measured size missing — keep handle coords
    }
  }

  const { route } = useSmartEdgePath({
    id,
    source,
    target,
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sPos,
    targetPosition: tPos,
    preset: "smoothstep",
    options: { nodePadding: 24, borderRadius: 10, gridRatio: 10 },
  });

  const [fallbackPath, fbLX, fbLY] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sPos,
    targetPosition: tPos,
    borderRadius: 10,
    offset: 24,
  });

  const path = route?.kind === "routed" ? route.svgPathString : fallbackPath;
  const labelX = route?.kind === "routed" ? route.edgeCenterX : fbLX;
  const labelY = route?.kind === "routed" ? route.edgeCenterY : fbLY;

  const text =
    typeof label === "string"
      ? label
      : label != null
        ? String(label)
        : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        className={animated ? "animated" : undefined}
      />
      {text ? (
        <EdgeLabelRenderer>
          <div
            className={`bon-edge-label nodrag nopan bon-edge-label-${text
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span className="bon-edge-label-icon" aria-hidden>
              {edgeLabelIcon(text)}
            </span>
            <span className="bon-edge-label-text">{text}</span>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

type Tool = "select" | "hand";

type CtxMenu =
  | {
      kind: "pane";
      clientX: number;
      clientY: number;
      flowX: number;
      flowY: number;
    }
  | {
      kind: "node";
      clientX: number;
      clientY: number;
      nodeId: string;
    };

const nodeTypes = {
  bonChat: ChatBoxNode,
  bonImage: ImageBoxNode,
  bonLink: LinkBoxNode,
};

const edgeTypes = {
  bon: BonEdge,
};

function flowType(kind: CanvasNode["type"]) {
  if (kind === "image") return "bonImage";
  if (kind === "link") return "bonLink";
  return "bonChat";
}

function toFlowNodes(nodes: CanvasNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: flowType(n.type),
    position: { x: n.x, y: n.y },
    data: {
      title: n.title,
      summary: n.summary,
      kind: n.type,
      url: n.url,
    },
  }));
}

function nextSpot(brain: ContinuumBrain) {
  const n = brain.canvas.nodes.length;
  return { x: 120 + (n % 4) * 260, y: 100 + Math.floor(n / 4) * 180 };
}

function CanvasInner() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const activeTerminalId = useAppStore((s) => s.activeTerminalId);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const { fitView, zoomIn, zoomOut, getNodes, getEdges, setNodes: setFlowNodes, screenToFlowPosition } =
    useReactFlow();

  const [tool, setTool] = useState<Tool>("select");
  const [spacePan, setSpacePan] = useState(false);
  const [menu, setMenu] = useState<CtxMenu | null>(null);

  const canvasKey = useMemo(
    () =>
      brain
        ? JSON.stringify({
            nodes: brain.canvas.nodes,
            edges: brain.canvas.edges,
          })
        : "",
    [brain],
  );

  const initialNodes = useMemo(
    () => (brain ? toFlowNodes(brain.canvas.nodes) : []),
    // sync only when canvas payload changes
    [canvasKey],
  );
  const initialEdges = useMemo(
    () =>
      brain
        ? brain.canvas.edges.map(
            (e): Edge => ({
              id: e.id,
              type: "bon",
              source: e.source,
              target: e.target,
              label: e.label,
              animated: true,
              style: { stroke: "#0d9488", strokeWidth: 1.75 },
            }),
          )
        : [],
    [canvasKey],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((prev) => {
      const selected = new Set(prev.filter((n) => n.selected).map((n) => n.id));
      return initialNodes.map((n) => ({
        ...n,
        selected: selected.has(n.id),
      }));
    });
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handMode = tool === "hand" || spacePan;

  /** Always persist the full flow graph — never a drag subset. */
  const persistAll = useCallback(async () => {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const merged = mergeCanvasFromFlow(current, getNodes(), getEdges());
    if (!merged) return;
    await applyBrain({
      ...current,
      canvas: merged,
    });
  }, [applyBrain, getEdges, getNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `e${Date.now()}`,
            type: "bon",
            label: "link",
            animated: true,
            style: { stroke: "#0d9488", strokeWidth: 1.75 },
          },
          eds,
        );
        // Persist after React commits edge state
        queueMicrotask(() => {
          void persistAll();
        });
        return next;
      });
    },
    [persistAll, setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: OnSelectionChangeParams) => {
      const first = selected[0];
      if (!first) {
        setSelectedNodeId(null);
        return;
      }
      setSelectedNodeId(first.id);
      const meta = brain?.canvas.nodes.find((n) => n.id === first.id);
      if (meta?.type === "chat" && selected.length === 1) {
        setActiveTerminalId(first.id);
      } else if (meta?.type !== "chat") {
        setActiveTerminalId(null);
      }
      const linkedTask = brain?.tasks.find((t) => t.link === first.id);
      if (linkedTask) {
        useAppStore.getState().setSelectedTaskId(linkedTask.id);
      }
    },
    [brain, setActiveTerminalId, setSelectedNodeId],
  );

  async function addChatNode(at?: { x: number; y: number }) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const id = `n${Date.now()}`;
    const spot = at ?? nextSpot(current);
    const node: CanvasNode = {
      id,
      type: "chat",
      title: `Chat ${current.canvas.nodes.filter((n) => n.type === "chat").length + 1}`,
      ...spot,
      summary: "Select to open Claude in the dock",
    };
    let tasks = current.tasks;
    if (selectedTaskId) {
      tasks = current.tasks.map((t) =>
        t.id === selectedTaskId ? { ...t, link: id } : t,
      );
    }
    await applyBrain({
      ...current,
      tasks,
      canvas: { ...current.canvas, nodes: [...current.canvas.nodes, node] },
    });
    setSelectedNodeId(id);
    setActiveTerminalId(id);
    setTool("select");
    setMenu(null);
  }

  async function addImageNode(at?: { x: number; y: number }) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const picked = await window.continuum.pickCanvasImage();
    if (!picked) {
      setMenu(null);
      return;
    }
    const id = `n${Date.now()}`;
    const spot = at ?? nextSpot(current);
    const node: CanvasNode = {
      id,
      type: "image",
      title: picked.name,
      ...spot,
      url: picked.path,
      summary: `File: ${picked.path}`,
    };
    await applyBrain({
      ...current,
      canvas: { ...current.canvas, nodes: [...current.canvas.nodes, node] },
    });
    setSelectedNodeId(id);
    setActiveTerminalId(null);
    setTool("select");
    setMenu(null);
  }

  async function addLinkNode(at?: { x: number; y: number }) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const url = window.prompt("Link URL (https://…)");
    if (!url?.trim()) {
      setMenu(null);
      return;
    }
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      window.alert("URL must start with http:// or https://");
      setMenu(null);
      return;
    }
    const title =
      window.prompt("Title", trimmed.replace(/^https?:\/\//i, "").slice(0, 48)) ||
      trimmed;
    const id = `n${Date.now()}`;
    const spot = at ?? nextSpot(current);
    const node: CanvasNode = {
      id,
      type: "link",
      title: title.trim(),
      ...spot,
      url: trimmed,
    };
    await applyBrain({
      ...current,
      canvas: { ...current.canvas, nodes: [...current.canvas.nodes, node] },
    });
    setSelectedNodeId(id);
    setActiveTerminalId(null);
    setTool("select");
    setMenu(null);
  }

  async function branchNode(nodeId: string) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const parent = current.canvas.nodes.find((n) => n.id === nodeId);
    if (!parent) return;
    const id = `n${Date.now()}`;
    const node: CanvasNode = {
      id,
      type: "chat",
      title: `Branch · ${parent.title}`,
      x: parent.x + 280,
      y: parent.y + 40,
      summary: `From ${parent.id}`,
    };
    const edge = {
      id: `e${Date.now()}`,
      source: parent.id,
      target: id,
      label: "branch",
    };
    await applyBrain({
      ...current,
      canvas: {
        nodes: [...current.canvas.nodes, node],
        edges: [...current.canvas.edges, edge],
      },
    });
    setSelectedNodeId(id);
    setActiveTerminalId(id);
    setMenu(null);
  }

  function duplicateNode(nodeId: string) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const prev = current.canvas.nodes.find((n) => n.id === nodeId);
    if (!prev) return;
    const clone: CanvasNode = {
      ...prev,
      id: `n${Date.now()}`,
      title: `${prev.title} copy`,
      x: prev.x + 32,
      y: prev.y + 32,
    };
    void applyBrain({
      ...current,
      canvas: {
        ...current.canvas,
        nodes: [...current.canvas.nodes, clone],
      },
    });
    setSelectedNodeId(clone.id);
    setMenu(null);
  }

  function deleteNode(nodeId: string) {
    const current = useAppStore.getState().brain();
    if (!current) return;
    void applyBrain({
      ...current,
      canvas: {
        nodes: current.canvas.nodes.filter((n) => n.id !== nodeId),
        edges: current.canvas.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        ),
      },
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (activeTerminalId === nodeId) setActiveTerminalId(null);
    setMenu(null);
  }

  function duplicateSelected() {
    const current = useAppStore.getState().brain();
    if (!current) return;
    const selected = getNodes().filter((n) => n.selected);
    if (selected.length === 0) return;
    const stamp = Date.now();
    const clones: CanvasNode[] = selected.map((n, i) => {
      const prev = current.canvas.nodes.find((x) => x.id === n.id);
      const data = n.data as BonData;
      return {
        id: `n${stamp}_${i}`,
        type: (prev?.type || data.kind || "note") as CanvasNode["type"],
        title: `${prev?.title || data.title} copy`,
        x: n.position.x + 32,
        y: n.position.y + 32,
        summary: prev?.summary ?? data.summary,
        url: prev?.url ?? data.url,
      };
    });
    void applyBrain({
      ...current,
      canvas: {
        ...current.canvas,
        nodes: [...current.canvas.nodes, ...clones],
      },
    });
    setSelectedNodeId(clones[0]?.id ?? null);
  }

  useEffect(() => {
    if (!menu) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".bonscape-ctx")) return;
      setMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePan(true);
      }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "h" || e.key === "H") setTool("hand");
      if (e.key === "1" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void fitView({ padding: 0.2, duration: 200 });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        void fitView({ padding: 0.2, duration: 200 });
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        void zoomIn({ duration: 120 });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        void zoomOut({ duration: 120 });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setFlowNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setSpacePan(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => setSpacePan(false));
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brain, fitView, zoomIn, zoomOut, setFlowNodes]);

  if (!brain) return null;

  const selectedMeta = selectedNodeId
    ? brain.canvas.nodes.find((n) => n.id === selectedNodeId)
    : null;

  const menuNode =
    menu?.kind === "node"
      ? brain.canvas.nodes.find((n) => n.id === menu.nodeId)
      : null;

  return (
    <div className={`bonscape${handMode ? " bonscape-hand" : " bonscape-select"}`}>
      <div className="bonscape-stage">
        <div className="bonscape-canvas">
          <SmartEdgeProvider
            nodes={nodes}
            options={{
              preset: "smoothstep",
              nodePadding: 24,
              gridRatio: 10,
              borderRadius: 10,
              routeOnlyWhenBlocked: true,
            }}
          >
          <ReactFlow
            colorMode="light"
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            connectionMode={ConnectionMode.Loose}
            connectionLineStyle={{ stroke: "#0d9488", strokeWidth: 1.5 }}
            onPaneClick={() => setMenu(null)}
            onPaneContextMenu={(e) => {
              e.preventDefault();
              const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
              setMenu({
                kind: "pane",
                clientX: e.clientX,
                clientY: e.clientY,
                flowX: flow.x,
                flowY: flow.y,
              });
            }}
            onNodeContextMenu={(e, node) => {
              e.preventDefault();
              setSelectedNodeId(node.id);
              setFlowNodes((nds) =>
                nds.map((n) => ({ ...n, selected: n.id === node.id })),
              );
              setMenu({
                kind: "node",
                clientX: e.clientX,
                clientY: e.clientY,
                nodeId: node.id,
              });
            }}
            onNodeDragStop={() => {
              void persistAll();
            }}
            onSelectionDragStop={() => {
              void persistAll();
            }}
            onNodesDelete={(deleted) => {
              const current = useAppStore.getState().brain();
              if (!current) return;
              const ids = new Set(deleted.map((n) => n.id));
              void applyBrain({
                ...current,
                canvas: {
                  nodes: current.canvas.nodes.filter((n) => !ids.has(n.id)),
                  edges: current.canvas.edges.filter(
                    (e) => !ids.has(e.source) && !ids.has(e.target),
                  ),
                },
              });
              setActiveTerminalId(null);
            }}
            onEdgesDelete={(deleted) => {
              const current = useAppStore.getState().brain();
              if (!current) return;
              const ids = new Set(deleted.map((e) => e.id));
              void applyBrain({
                ...current,
                canvas: {
                  ...current.canvas,
                  edges: current.canvas.edges.filter((e) => !ids.has(e.id)),
                },
              });
            }}
            defaultEdgeOptions={{
              type: "bon",
              animated: true,
              style: { stroke: "#0d9488", strokeWidth: 1.75 },
            }}
            selectionOnDrag={!handMode}
            panOnDrag={handMode ? true : [1, 2]}
            panOnScroll
            panOnScrollSpeed={1.1}
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Shift"
            deleteKeyCode={["Backspace", "Delete"]}
            panActivationKeyCode={null}
            selectNodesOnDrag={!handMode}
            nodesDraggable={!handMode}
            elementsSelectable={!handMode}
            elevateNodesOnSelect
            snapToGrid
            snapGrid={[8, 8]}
            minZoom={0.1}
            maxZoom={4}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            onlyRenderVisibleElements={false}
          >
            <Background
              id="grid"
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#d0d7de"
            />
            <MiniMap
              pannable
              zoomable
              ariaLabel="Canvas overview"
              maskColor="rgba(15, 23, 42, 0.08)"
              nodeStrokeWidth={2}
              nodeBorderRadius={4}
              nodeColor={(node) => {
                const kind =
                  (node.data as BonData | undefined)?.kind || node.type;
                if (kind === "image" || node.type === "bonImage") return "#3b82f6";
                if (kind === "link" || node.type === "bonLink") return "#f97316";
                if (kind === "chat" || node.type === "bonChat") return "#0d9488";
                if (kind === "decision") return "#8b5cf6";
                if (kind === "task") return "#eab308";
                return "#64748b";
              }}
            />
            <Controls showInteractive={false} />
            <Panel position="bottom-center" className="bonscape-zoom-bar">
              <button
                type="button"
                className="btn ghost"
                title="Zoom out (⌘-)"
                onClick={() => void zoomOut({ duration: 120 })}
              >
                −
              </button>
              <button
                type="button"
                className="btn ghost"
                title="Fit all (1)"
                onClick={() => void fitView({ padding: 0.2, duration: 200 })}
              >
                Fit
              </button>
              <button
                type="button"
                className="btn ghost"
                title="Zoom in (⌘+)"
                onClick={() => void zoomIn({ duration: 120 })}
              >
                +
              </button>
            </Panel>
          </ReactFlow>
          </SmartEdgeProvider>

          {menu && (
            <div
              className="bonscape-ctx"
              role="menu"
              style={{
                left: Math.min(menu.clientX, window.innerWidth - 200),
                top: Math.min(menu.clientY, window.innerHeight - 300),
              }}
            >
              {menu.kind === "pane" ? (
                <>
                  <div className="bonscape-ctx-label">Add</div>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() =>
                      void addChatNode({ x: menu.flowX, y: menu.flowY })
                    }
                  >
                    Chat box
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() =>
                      void addImageNode({ x: menu.flowX, y: menu.flowY })
                    }
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() =>
                      void addLinkNode({ x: menu.flowX, y: menu.flowY })
                    }
                  >
                    Link
                  </button>
                  <div className="bonscape-ctx-sep" />
                  <div className="bonscape-ctx-label">Tool</div>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() => {
                      setTool("select");
                      setMenu(null);
                    }}
                  >
                    Select (V)
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() => {
                      setTool("hand");
                      setMenu(null);
                    }}
                  >
                    Hand (H)
                  </button>
                  <div className="bonscape-ctx-sep" />
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() => {
                      void fitView({ padding: 0.2, duration: 200 });
                      setMenu(null);
                    }}
                  >
                    Fit all
                  </button>
                </>
              ) : (
                <>
                  <div className="bonscape-ctx-label">
                    {menuNode?.title || menu.nodeId}
                  </div>
                  {menuNode?.type === "chat" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="bonscape-ctx-item"
                      onClick={() => {
                        setActiveTerminalId(menu.nodeId);
                        setMenu(null);
                      }}
                    >
                      Open chat dock
                    </button>
                  ) : null}
                  {menuNode?.type === "link" && menuNode.url ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="bonscape-ctx-item"
                      onClick={() => {
                        void window.continuum.openExternalUrl(menuNode.url!);
                        setMenu(null);
                      }}
                    >
                      Open link
                    </button>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() => void branchNode(menu.nodeId)}
                  >
                    Branch chat
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item"
                    onClick={() => duplicateNode(menu.nodeId)}
                  >
                    Duplicate
                  </button>
                  <div className="bonscape-ctx-sep" />
                  <button
                    type="button"
                    role="menuitem"
                    className="bonscape-ctx-item danger"
                    onClick={() => deleteNode(menu.nodeId)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {selectedMeta?.type === "chat" && activeTerminalId && (
          <aside className="bonscape-dock" aria-label="Chat session">
            <div className="bonscape-dock-head">
              <div>
                <strong>{selectedMeta.title}</strong>
                <div className="muted">
                  {selectedMeta.summary || "Claude CLI"}
                </div>
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
