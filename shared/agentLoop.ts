import type { CanvasNode, ContinuumBrain, Task } from "./types";

function chatSpot(brain: ContinuumBrain) {
  const n = brain.canvas.nodes.length;
  return {
    x: 80 + (n % 4) * 280,
    y: 100 + Math.floor(n / 4) * 180,
  };
}

/** Ensure task has a linked chat node and status=running. */
export function startTaskWork(
  brain: ContinuumBrain,
  taskId: string,
): { brain: ContinuumBrain; task: Task; nodeId: string } {
  const task = brain.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  let nodes = brain.canvas.nodes;
  let nodeId = task.link;
  const existing = nodeId
    ? nodes.find((n) => n.id === nodeId && n.type === "chat")
    : undefined;

  if (!existing) {
    nodeId = `n${Date.now()}`;
    const node: CanvasNode = {
      id: nodeId,
      type: "chat",
      title: task.title,
      ...chatSpot(brain),
      summary: `Agent work · ${task.id}`,
    };
    nodes = [...nodes, node];
  } else {
    nodeId = existing.id;
  }

  const nextTask: Task = {
    ...task,
    status: "running",
    link: nodeId,
  };

  return {
    brain: {
      ...brain,
      tasks: brain.tasks.map((t) => (t.id === taskId ? nextTask : t)),
      canvas: { ...brain.canvas, nodes },
      handoff: `Working: ${task.title} (${taskId}) on canvas ${nodeId}`,
      currentState: `Agent running task ${taskId}: ${task.title}`,
    },
    task: nextTask,
    nodeId: nodeId!,
  };
}

/** Mark task done and refresh handoff toward next ready work. */
export function completeTaskWork(
  brain: ContinuumBrain,
  taskId: string,
): { brain: ContinuumBrain; task: Task } {
  const task = brain.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  const nextTask: Task = { ...task, status: "done" };
  const nextReady = brain.tasks.find(
    (t) => t.id !== taskId && t.status === "ready",
  );

  return {
    brain: {
      ...brain,
      tasks: brain.tasks.map((t) => (t.id === taskId ? nextTask : t)),
      handoff: nextReady
        ? `Done: ${task.title}. Next ready: ${nextReady.title} (${nextReady.id})`
        : `Done: ${task.title}. No ready tasks — triage the board.`,
      currentState: `Completed ${taskId}: ${task.title}`,
    },
    task: nextTask,
  };
}
