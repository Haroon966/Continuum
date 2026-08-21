import { useState } from "react";
import { useAppStore } from "../store";
import {
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  type Task,
  type TaskStatus,
} from "@shared/types";
import { completeTaskWork, startTaskWork } from "@shared/agentLoop";

function TicketIcon() {
  return (
    <svg
      className="hermes-ticket-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 5H5a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h10" />
      <path d="M19 5h-2v14h2a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="hermes-check-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Hermes-inspired kanban: columns triage→done, + per column,
 * click card → right drawer, drag cards between columns.
 */
export function BoardPanel() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const setFocusSection = useAppStore((s) => s.setFocusSection);
  const [dragId, setDragId] = useState<string | null>(null);

  if (!brain) return null;

  const selected = brain.tasks.find((t) => t.id === selectedTaskId) || null;

  const visible = (status: TaskStatus) =>
    brain.tasks.filter((t) => t.status === status);

  async function moveTask(id: string, status: TaskStatus) {
    const tasks = brain!.tasks.map((t) =>
      t.id === id ? { ...t, status } : t,
    );
    await applyBrain({ ...brain!, tasks });
  }

  async function createInColumn(status: TaskStatus) {
    const title = window.prompt(`New task in ${COLUMN_LABELS[status]}`);
    if (!title?.trim()) return;
    const task: Task = {
      id: `t${Date.now()}`,
      title: title.trim(),
      status,
      priority: "medium",
    };
    await applyBrain({ ...brain!, tasks: [...brain!.tasks, task] });
    setSelectedTaskId(task.id);
  }

  async function patchSelected(patch: Partial<Task>) {
    if (!selected) return;
    const tasks = brain!.tasks.map((t) =>
      t.id === selected.id ? { ...t, ...patch, id: selected.id } : t,
    );
    await applyBrain({ ...brain!, tasks });
  }

  function openLinkedCanvas() {
    if (!selected?.link) return;
    setSelectedNodeId(selected.link);
    const node = brain!.canvas.nodes.find((n) => n.id === selected.link);
    if (node?.type === "chat") setActiveTerminalId(node.id);
    setFocusSection("canvas");
  }

  async function startAgentOnSelected() {
    if (!selected || !brain) return;
    const { brain: next, nodeId } = startTaskWork(brain, selected.id);
    await applyBrain(next);
    setSelectedNodeId(nodeId);
    setActiveTerminalId(nodeId);
    setFocusSection("canvas");
  }

  async function completeSelected() {
    if (!selected || !brain) return;
    const { brain: next } = completeTaskWork(brain, selected.id);
    await applyBrain(next);
  }

  return (
    <div className="hermes-board">
      <div className="hermes-columns">
        {DEFAULT_COLUMNS.map((col) => {
          const count = visible(col).length;
          return (
            <section
              className={`hermes-col hermes-col-${col}`}
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/task-id") || dragId;
                if (id) void moveTask(id, col);
                setDragId(null);
              }}
            >
              <header className="hermes-col-head">
                <div className="hermes-col-label">
                  <span className="hermes-col-title">{COLUMN_LABELS[col]}</span>
                  <span className="hermes-count">
                    {col === "done" ? <CheckIcon /> : null}
                    {count}
                  </span>
                </div>
                <button
                  type="button"
                  className="hermes-add"
                  aria-label={`Add to ${COLUMN_LABELS[col]}`}
                  onClick={() => void createInColumn(col)}
                >
                  +
                </button>
              </header>
              <div className="hermes-col-body">
                {visible(col).map((task) => {
                  const prio = task.priority || "medium";
                  return (
                    <article
                      key={task.id}
                      className={`hermes-card${selectedTaskId === task.id ? " selected" : ""}`}
                      draggable
                      onDragStart={(e) => {
                        setDragId(task.id);
                        e.dataTransfer.setData("text/task-id", task.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => setSelectedTaskId(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedTaskId(task.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="hermes-card-title">{task.title}</div>
                      <span className={`hermes-tag hermes-tag-${prio}`}>
                        {prio}
                      </span>
                      <div className="hermes-card-foot">
                        <span className="hermes-ticket">
                          <TicketIcon />
                          {task.id}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selected && (
        <aside className="hermes-drawer" aria-label="Task details">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>Task</h3>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSelectedTaskId(null)}
            >
              Close
            </button>
          </div>
          <div className="field">
            <label htmlFor="ht-title">Title</label>
            <input
              id="ht-title"
              value={selected.title}
              onChange={(e) => void patchSelected({ title: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ht-status">Status</label>
            <select
              id="ht-status"
              value={selected.status}
              onChange={(e) =>
                void patchSelected({ status: e.target.value as TaskStatus })
              }
            >
              {DEFAULT_COLUMNS.map((s) => (
                <option key={s} value={s}>
                  {COLUMN_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ht-prio">Priority</label>
            <select
              id="ht-prio"
              value={selected.priority || "medium"}
              onChange={(e) =>
                void patchSelected({
                  priority: e.target.value as Task["priority"],
                })
              }
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="ht-notes">Notes</label>
            <textarea
              id="ht-notes"
              rows={4}
              value={selected.notes || ""}
              onChange={(e) => void patchSelected({ notes: e.target.value })}
            />
          </div>
          <div className="row">
            <button
              type="button"
              className="btn primary"
              disabled={selected.status === "done"}
              onClick={() => void startAgentOnSelected()}
            >
              Start agent
            </button>
            <button
              type="button"
              className="btn"
              disabled={selected.status === "done"}
              onClick={() => void completeSelected()}
            >
              Mark done
            </button>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                const chat =
                  brain.canvas.nodes.find((n) => n.type === "chat") ||
                  brain.canvas.nodes[0];
                if (!chat) return;
                void patchSelected({ link: chat.id });
              }}
            >
              Link → canvas
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!selected.link}
              onClick={openLinkedCanvas}
            >
              Open on canvas
            </button>
          </div>
          <div className="hermes-actions">
            {(
              [
                ["triage", "→ Triage"],
                ["ready", "→ Ready"],
                ["running", "→ Running"],
                ["blocked", "Block"],
                ["done", "Complete"],
              ] as [TaskStatus, string][]
            ).map(([st, label]) => (
              <button
                key={st}
                type="button"
                className="btn"
                onClick={() => void patchSelected({ status: st })}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
