import { useState } from "react";
import { useAppStore } from "../store";
import {
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  type Task,
  type TaskStatus,
} from "@shared/types";

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
  const [filter, setFilter] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  if (!brain) return null;

  const selected = brain.tasks.find((t) => t.id === selectedTaskId) || null;

  const visible = (status: TaskStatus) =>
    brain.tasks.filter((t) => {
      if (t.status !== status) return false;
      if (!filter.trim()) return true;
      const q = filter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.assignee || "").toLowerCase().includes(q)
      );
    });

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
      assignee: "human",
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

  return (
    <div className="hermes-board">
      <div className="hermes-toolbar">
        <div>
          <h2>Kanban</h2>
          <p className="sub">
            Hermes-style board — drag cards, open drawer, agents share CONTINUUM.md.
          </p>
        </div>
        <input
          className="grow-input"
          aria-label="Filter tasks"
          placeholder="Filter title / assignee…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="hermes-columns">
        {DEFAULT_COLUMNS.map((col) => (
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
              <div>
                <span className="hermes-col-title">{COLUMN_LABELS[col]}</span>
                <span className="hermes-count">{visible(col).length}</span>
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
              {visible(col).map((task) => (
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
                  <div className="hermes-card-meta">
                    <span className={`prio prio-${task.priority || "medium"}`}>
                      {task.priority || "medium"}
                    </span>
                    {task.assignee ? (
                      <span className="assignee">{task.assignee}</span>
                    ) : null}
                    {task.link ? <span className="link-pill">↗ canvas</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
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
            <label htmlFor="ht-assignee">Assignee</label>
            <input
              id="ht-assignee"
              value={selected.assignee || ""}
              placeholder="human / claude / cursor"
              onChange={(e) => void patchSelected({ assignee: e.target.value })}
            />
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
              className="btn primary"
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
