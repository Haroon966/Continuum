export type TaskStatus =
  | "triage"
  | "todo"
  | "ready"
  | "running"
  | "blocked"
  | "done";

export type CanvasNodeType =
  | "chat"
  | "decision"
  | "task"
  | "note"
  | "image"
  | "link";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: "low" | "medium" | "high";
  /** Linked canvas node id */
  link?: string;
  /** Optional longer notes (Hermes-style card body) */
  notes?: string;
  assignee?: string;
}

export interface Decision {
  id: string;
  title: string;
  reason?: string;
  alternatives?: string[];
}

export interface ActivityItem {
  at: string;
  text: string;
}

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  title: string;
  x: number;
  y: number;
  summary?: string;
  /** Project-relative path (.continuum/assets/…) or http(s) URL — for image/link nodes */
  url?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ContinuumBrain {
  goal: string;
  requirements: string[];
  architecture: string[];
  constraints: string[];
  currentState: string;
  handoff: string;
  tasks: Task[];
  decisions: Decision[];
  activity: ActivityItem[];
  canvas: {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  };
}

export interface ContinuumDocument {
  brain: ContinuumBrain;
  parseErrors: string[];
  raw: string;
}

export interface ContinuumSettings {
  claudePath: string;
  cursorPath: string;
  apiPort: number;
  apiToken: string;
  lastProjectPath: string | null;
}

export interface ProjectContextResponse {
  path: string;
  brain: ContinuumBrain;
  updatedAt: string;
}

/** Hermes-style multi-agent columns */
export const DEFAULT_COLUMNS: TaskStatus[] = [
  "triage",
  "todo",
  "ready",
  "running",
  "blocked",
  "done",
];

export const COLUMN_LABELS: Record<TaskStatus, string> = {
  triage: "Triage",
  todo: "Todo",
  ready: "Ready",
  running: "Running",
  blocked: "Blocked",
  done: "Done",
};

/** Map legacy Continuum statuses → Hermes columns */
export const STATUS_ALIASES: Record<string, TaskStatus> = {
  backlog: "todo",
  in_progress: "running",
  review: "blocked",
};
