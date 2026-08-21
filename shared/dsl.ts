import type {
  ActivityItem,
  CanvasEdge,
  CanvasNode,
  ContinuumBrain,
  ContinuumDocument,
  Decision,
  Task,
  TaskStatus,
} from "./types";
import { STATUS_ALIASES } from "./types";

export const CONTINUUM_FILENAME = "CONTINUUM.md";

const FENCE_START = "```continuum";
const FENCE_END = "```";

export function emptyBrain(): ContinuumBrain {
  return {
    goal: "",
    requirements: [],
    architecture: [],
    constraints: [],
    currentState: "",
    handoff: "",
    tasks: [],
    decisions: [],
    activity: [],
    canvas: { nodes: [], edges: [] },
  };
}

export function createTemplateMarkdown(projectName: string): string {
  const brain: ContinuumBrain = {
    ...emptyBrain(),
    goal: `Build ${projectName}`,
    currentState: "Project just created in Continuum.",
    handoff: "Open a canvas chat node (Claude CLI) or Continue with Cursor.",
    tasks: [
      {
        id: "t1",
        title: "Clarify MVP scope",
        status: "ready",
        priority: "high",
      },
      {
        id: "t2",
        title: "First implementation slice",
        status: "todo",
        priority: "medium",
      },
    ],
    canvas: {
      nodes: [
        {
          id: "n1",
          type: "chat",
          title: "Main thread",
          x: 80,
          y: 120,
          summary: "Primary Claude CLI session",
        },
      ],
      edges: [],
    },
    activity: [
      {
        at: new Date().toISOString(),
        text: "Continuum project initialized",
      },
    ],
  };

  return `${AGENT_GUIDE}

# ${projectName}

Project brain lives in the fenced \`continuum\` block below.
Edit via Continuum UI, agents, or curl — Continuum keeps the board in sync.

${serializeBrainFence(brain)}
`;
}

export const AGENT_GUIDE = `<!-- CONTINUUM AGENT GUIDE
Rules for Claude CLI / Cursor (and humans):

1. CONTINUUM.md is the project brain at repo root. Canvas media may live under .continuum/assets/ only.
2. Update the fenced continuum block when something meaningful changes (goal, tasks, decisions, handoff, canvas map).
3. Do NOT dump full chat transcripts into this file. Keep summaries short.
4. Prefer updating tasks/decisions/currentState/handoff after real progress.
5. If nothing meaningful changed, do not rewrite this file.
6. Canvas nodes: chat | note | image | link | decision | task.
   - image/link nodes use url= (project-relative path or https URL).
   - Agents may POST /api/canvas/nodes or /api/canvas/assets — same as the UI.

## Cursor local API (curl)

Continuum desktop exposes localhost HTTP. Default port 3927.

GET context (decisions, tasks, handoff, canvas):
  curl -s http://127.0.0.1:3927/api/context \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN"

Update brain / canvas (JSON body merges into brain):
  curl -s -X PATCH http://127.0.0.1:3927/api/context \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"handoff":"Next: fix tests","currentState":"..."}'

Add link or note on canvas:
  curl -s -X POST http://127.0.0.1:3927/api/canvas/nodes \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"type":"link","title":"Docs","url":"https://example.com","x":200,"y":120}'

Upload image to canvas (base64, lands in .continuum/assets/):
  curl -s -X POST http://127.0.0.1:3927/api/canvas/assets \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"filename":"shot.png","dataBase64":"...","title":"Screenshot","x":240,"y":160}'

Create / move task:
  curl -s -X POST http://127.0.0.1:3927/api/tasks \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"title":"Add login","status":"ready","priority":"high"}'

  curl -s -X PATCH http://127.0.0.1:3927/api/tasks/t1 \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"done"}'

Agent loop (ready → running+chat → done):
  curl -s -X POST http://127.0.0.1:3927/api/tasks/t1/start \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN"
  # → creates/links chat node, status=running; open that node in Continuum UI

  curl -s -X POST http://127.0.0.1:3927/api/tasks/t1/complete \\
    -H "Authorization: Bearer $CONTINUUM_TOKEN"
  # → status=done; handoff points at next ready task

Token and port: Continuum Settings. Prefer curl GET before big Cursor work.
-->`;

export function serializeBrainFence(brain: ContinuumBrain): string {
  return `${FENCE_START}
${serializeBrain(brain)}
${FENCE_END}`;
}

export function serializeBrain(brain: ContinuumBrain): string {
  const lines: string[] = [];

  lines.push("goal:", indentBlock(brain.goal || "(unset)"), "");
  lines.push("requirements:");
  pushList(lines, brain.requirements);
  lines.push("");
  lines.push("architecture:");
  pushList(lines, brain.architecture);
  lines.push("");
  lines.push("constraints:");
  pushList(lines, brain.constraints);
  lines.push("");
  lines.push("currentState:", indentBlock(brain.currentState || "(unset)"), "");
  lines.push("handoff:", indentBlock(brain.handoff || "(unset)"), "");

  lines.push("tasks:");
  if (brain.tasks.length === 0) {
    lines.push("  - (none)");
  } else {
    for (const t of brain.tasks) {
      const bits = [`id=${t.id}`, `status=${t.status}`];
      if (t.priority) bits.push(`priority=${t.priority}`);
      if (t.assignee) bits.push(`assignee=${escapeInline(t.assignee)}`);
      if (t.link) bits.push(`link=${t.link}`);
      if (t.notes) bits.push(`notes=${escapeInline(t.notes)}`);
      lines.push(`  - [${bits.join(" ")}] ${escapeInline(t.title)}`);
    }
  }
  lines.push("");

  lines.push("decisions:");
  if (brain.decisions.length === 0) {
    lines.push("  - (none)");
  } else {
    for (const d of brain.decisions) {
      lines.push(`  - [id=${d.id}] ${escapeInline(d.title)}`);
      if (d.reason) lines.push(`    reason: ${escapeInline(d.reason)}`);
      if (d.alternatives?.length) {
        lines.push(`    alternatives: ${d.alternatives.map(escapeInline).join(" | ")}`);
      }
    }
  }
  lines.push("");

  lines.push("activity:");
  if (brain.activity.length === 0) {
    lines.push("  - (none)");
  } else {
    for (const a of brain.activity.slice(-50)) {
      lines.push(`  - [${a.at}] ${escapeInline(a.text)}`);
    }
  }
  lines.push("");

  lines.push("canvas:");
  lines.push("  nodes:");
  if (brain.canvas.nodes.length === 0) {
    lines.push("    - (none)");
  } else {
    for (const n of brain.canvas.nodes) {
      const bits = [
        `id=${n.id}`,
        `type=${n.type}`,
        `x=${Math.round(n.x)}`,
        `y=${Math.round(n.y)}`,
      ];
      lines.push(`    - [${bits.join(" ")}] ${escapeInline(n.title)}`);
      if (n.url) lines.push(`      url: ${escapeInline(n.url)}`);
      if (n.summary) lines.push(`      summary: ${escapeInline(n.summary)}`);
    }
  }
  lines.push("  edges:");
  if (brain.canvas.edges.length === 0) {
    lines.push("    - (none)");
  } else {
    for (const e of brain.canvas.edges) {
      const label = e.label ? ` label=${escapeInline(e.label)}` : "";
      lines.push(
        `    - [id=${e.id}] ${e.source} -> ${e.target}${label}`,
      );
    }
  }

  return lines.join("\n");
}

export function parseContinuumMarkdown(raw: string): ContinuumDocument {
  const errors: string[] = [];
  const fence = extractFence(raw);
  if (!fence) {
    errors.push("Missing ```continuum fence");
    return { brain: emptyBrain(), parseErrors: errors, raw };
  }

  try {
    const brain = parseBrainBody(fence.body, errors);
    return { brain, parseErrors: errors, raw };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return { brain: emptyBrain(), parseErrors: errors, raw };
  }
}

export function writeBrainIntoMarkdown(
  raw: string,
  brain: ContinuumBrain,
): string {
  const fence = extractFence(raw);
  const block = serializeBrainFence(brain);
  if (!fence) {
    const guide = raw.includes("CONTINUUM AGENT GUIDE") ? "" : `${AGENT_GUIDE}\n\n`;
    return `${guide}${raw.trim()}\n\n${block}\n`;
  }
  return (
    raw.slice(0, fence.startIndex) + block + raw.slice(fence.endIndex)
  );
}

function extractFence(
  raw: string,
): { body: string; startIndex: number; endIndex: number } | null {
  // Prefer a continuum fence that starts a line (ignore mentions in comments/docs)
  const re = /(^|\n)(```continuum[^\n]*\n)/;
  const match = re.exec(raw);
  if (!match) return null;
  const start = match.index + match[1].length;
  const bodyStart = start + match[2].length;
  const endRel = raw.slice(bodyStart).search(/\n```/);
  if (endRel < 0) return null;
  const end = bodyStart + endRel;
  return {
    body: raw.slice(bodyStart, end).trimEnd(),
    startIndex: start,
    endIndex: end + 1 + 3,
  };
}

function parseBrainBody(body: string, errors: string[]): ContinuumBrain {
  const brain = emptyBrain();
  const lines = body.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = line.trim();

    if (key === "goal:") {
      const { text, next } = readBlock(lines, i + 1);
      brain.goal = text;
      i = next;
      continue;
    }
    if (key === "currentState:") {
      const { text, next } = readBlock(lines, i + 1);
      brain.currentState = text;
      i = next;
      continue;
    }
    if (key === "handoff:") {
      const { text, next } = readBlock(lines, i + 1);
      brain.handoff = text;
      i = next;
      continue;
    }
    if (key === "requirements:") {
      const { items, next } = readBulletList(lines, i + 1);
      brain.requirements = items.filter((x) => x !== "(none)");
      i = next;
      continue;
    }
    if (key === "architecture:") {
      const { items, next } = readBulletList(lines, i + 1);
      brain.architecture = items.filter((x) => x !== "(none)");
      i = next;
      continue;
    }
    if (key === "constraints:") {
      const { items, next } = readBulletList(lines, i + 1);
      brain.constraints = items.filter((x) => x !== "(none)");
      i = next;
      continue;
    }
    if (key === "tasks:") {
      const { tasks, next } = readTasks(lines, i + 1, errors);
      brain.tasks = tasks;
      i = next;
      continue;
    }
    if (key === "decisions:") {
      const { decisions, next } = readDecisions(lines, i + 1, errors);
      brain.decisions = decisions;
      i = next;
      continue;
    }
    if (key === "activity:") {
      const { activity, next } = readActivity(lines, i + 1);
      brain.activity = activity;
      i = next;
      continue;
    }
    if (key === "canvas:") {
      const { canvas, next } = readCanvas(lines, i + 1, errors);
      brain.canvas = canvas;
      i = next;
      continue;
    }

    i += 1;
  }

  return brain;
}

function readBlock(
  lines: string[],
  start: number,
): { text: string; next: number } {
  const chunks: string[] = [];
  let i = start;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.startsWith("  ") && raw.trim() !== "") break;
    if (raw.trim() === "" && chunks.length > 0) {
      // allow blank inside? stop on blank that precedes next key-looking line
      if (i + 1 < lines.length && !lines[i + 1].startsWith("  ") && lines[i + 1].includes(":")) {
        break;
      }
    }
    if (raw.startsWith("  ")) chunks.push(raw.slice(2));
    else if (raw.trim() === "") chunks.push("");
    else break;
    i += 1;
  }
  return { text: chunks.join("\n").trim(), next: i };
}

function readBulletList(
  lines: string[],
  start: number,
): { items: string[]; next: number } {
  const items: string[] = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(/^\s+-\s+(.*)$/);
    if (!m) break;
    items.push(m[1].trim());
    i += 1;
  }
  return { items, next: i };
}

function readTasks(
  lines: string[],
  start: number,
  errors: string[],
): { tasks: Task[]; next: number } {
  const tasks: Task[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^\s+-\s+\[([^\]]*)\]\s*(.*)$/);
    if (!m) {
      if (/^\s+-\s+\(none\)\s*$/.test(line)) {
        i += 1;
        continue;
      }
      break;
    }
    const meta = parseMeta(m[1]);
    const rawStatus = meta.status || "todo";
    const status = normalizeStatus(rawStatus);
    if (!status) {
      errors.push(`Unknown task status: ${rawStatus}`);
    }
    tasks.push({
      id: meta.id || `t${tasks.length + 1}`,
      title: unescapeInline(m[2].trim()),
      status: status || "todo",
      priority: meta.priority as Task["priority"],
      link: meta.link,
      notes: meta.notes ? unescapeInline(meta.notes) : undefined,
      assignee: meta.assignee,
    });
    i += 1;
  }
  return { tasks, next: i };
}

function readDecisions(
  lines: string[],
  start: number,
  _errors: string[],
): { decisions: Decision[]; next: number } {
  const decisions: Decision[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^\s+-\s+\[([^\]]*)\]\s*(.*)$/);
    if (!m) {
      if (/^\s+-\s+\(none\)\s*$/.test(line)) {
        i += 1;
        continue;
      }
      break;
    }
    const meta = parseMeta(m[1]);
    const decision: Decision = {
      id: meta.id || `d${decisions.length + 1}`,
      title: unescapeInline(m[2].trim()),
    };
    i += 1;
    while (i < lines.length) {
      const sub = lines[i].match(/^\s{4}(reason|alternatives):\s*(.*)$/);
      if (!sub) break;
      if (sub[1] === "reason") decision.reason = unescapeInline(sub[2].trim());
      if (sub[1] === "alternatives") {
        decision.alternatives = sub[2]
          .split("|")
          .map((s) => unescapeInline(s.trim()))
          .filter(Boolean);
      }
      i += 1;
    }
    decisions.push(decision);
  }
  return { decisions, next: i };
}

function readActivity(
  lines: string[],
  start: number,
): { activity: ActivityItem[]; next: number } {
  const activity: ActivityItem[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^\s+-\s+\[([^\]]+)\]\s*(.*)$/);
    if (!m) {
      if (/^\s+-\s+\(none\)\s*$/.test(line)) {
        i += 1;
        continue;
      }
      break;
    }
    activity.push({ at: m[1].trim(), text: unescapeInline(m[2].trim()) });
    i += 1;
  }
  return { activity, next: i };
}

function readCanvas(
  lines: string[],
  start: number,
  errors: string[],
): {
  canvas: ContinuumBrain["canvas"];
  next: number;
} {
  const canvas: ContinuumBrain["canvas"] = { nodes: [], edges: [] };
  let i = start;
  let mode: "none" | "nodes" | "edges" = "none";

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed && !lines[i].startsWith(" ") && trimmed.endsWith(":")) {
      break;
    }
    if (trimmed === "nodes:") {
      mode = "nodes";
      i += 1;
      continue;
    }
    if (trimmed === "edges:") {
      mode = "edges";
      i += 1;
      continue;
    }

    if (mode === "nodes") {
      const m = lines[i].match(/^\s+-\s+\[([^\]]*)\]\s*(.*)$/);
      if (!m) {
        if (/^\s+-\s+\(none\)\s*$/.test(lines[i])) {
          i += 1;
          continue;
        }
        if (trimmed === "") {
          i += 1;
          continue;
        }
        mode = "none";
        continue;
      }
      const meta = parseMeta(m[1]);
      const node: CanvasNode = {
        id: meta.id || `n${canvas.nodes.length + 1}`,
        type: (meta.type as CanvasNode["type"]) || "note",
        title: unescapeInline(m[2].trim()),
        x: Number(meta.x || 0),
        y: Number(meta.y || 0),
        // legacy: url= in [meta] (breaks on spaces) — prefer nested url: line
        url: meta.url ? unescapeInline(meta.url) : undefined,
      };
      i += 1;
      while (i < lines.length) {
        const sum = lines[i].match(/^\s+summary:\s*(.*)$/);
        if (sum) {
          node.summary = unescapeInline(sum[1].trim());
          i += 1;
          continue;
        }
        const urlLine = lines[i].match(/^\s+url:\s*(.*)$/);
        if (urlLine) {
          node.url = unescapeInline(urlLine[1].trim());
          i += 1;
          continue;
        }
        break;
      }
      canvas.nodes.push(node);
      continue;
    }

    if (mode === "edges") {
      const m = lines[i].match(
        /^\s+-\s+\[id=([^\]]+)\]\s+(\S+)\s+->\s+(\S+)(?:\s+label=(.*))?$/,
      );
      if (!m) {
        if (/^\s+-\s+\(none\)\s*$/.test(lines[i])) {
          i += 1;
          continue;
        }
        break;
      }
      const edge: CanvasEdge = {
        id: m[1],
        source: m[2],
        target: m[3],
        label: m[4] ? unescapeInline(m[4].trim()) : undefined,
      };
      canvas.edges.push(edge);
      i += 1;
      continue;
    }

    i += 1;
  }

  for (const n of canvas.nodes) {
    if (
      !["chat", "decision", "task", "note", "image", "link"].includes(n.type)
    ) {
      errors.push(`Unknown canvas node type: ${n.type}`);
      n.type = "note";
    }
  }

  return { canvas, next: i };
}

function parseMeta(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.trim().split(/\s+/).filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

function normalizeStatus(s: string): TaskStatus | null {
  if (
    ["triage", "todo", "ready", "running", "blocked", "done"].includes(s)
  ) {
    return s as TaskStatus;
  }
  return STATUS_ALIASES[s] ?? null;
}

function pushList(lines: string[], items: string[]) {
  if (items.length === 0) {
    lines.push("  - (none)");
    return;
  }
  for (const item of items) lines.push(`  - ${item}`);
}

function indentBlock(text: string): string {
  if (!text) return "  (unset)";
  return text
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

function escapeInline(text: string): string {
  return text.replace(/\n/g, " ");
}

function unescapeInline(text: string): string {
  return text;
}
