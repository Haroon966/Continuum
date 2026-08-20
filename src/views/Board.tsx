import { useState } from "react";
import { useAppStore } from "../store";
import {
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  type Task,
  type TaskStatus,
} from "@shared/types";

export function Board() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const [title, setTitle] = useState("");

  if (!brain) return null;

  async function moveTask(id: string, status: TaskStatus) {
    const tasks = brain!.tasks.map((t) =>
      t.id === id ? { ...t, status } : t,
    );
    await applyBrain({ ...brain!, tasks });
  }

  async function addTask() {
    const t = title.trim();
    if (!t) return;
    const task: Task = {
      id: `t${Date.now()}`,
      title: t,
      status: "todo",
      priority: "medium",
    };
    await applyBrain({ ...brain!, tasks: [...brain!.tasks, task] });
    setTitle("");
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Kanban</h2>
        <p className="sub">
          Drag via status select — writes back into CONTINUUM.md live.
        </p>
        <div className="row" style={{ marginBottom: 14 }}>
          <input
            aria-label="New task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task"
            style={{
              flex: 1,
              minWidth: 180,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addTask();
            }}
          />
          <button type="button" className="btn primary" onClick={() => void addTask()}>
            Add task
          </button>
        </div>
        <div className="kanban">
          {DEFAULT_COLUMNS.map((col) => (
            <div className="column" key={col}>
              <h3>{COLUMN_LABELS[col]}</h3>
              {brain.tasks
                .filter((t) => t.status === col)
                .map((task) => (
                  <article className="card" key={task.id}>
                    <div>{task.title}</div>
                    <div className="meta">
                      {task.id}
                      {task.priority ? ` · ${task.priority}` : ""}
                    </div>
                    <label className="muted" htmlFor={`status-${task.id}`}>
                      Move
                    </label>
                    <select
                      id={`status-${task.id}`}
                      value={task.status}
                      onChange={(e) =>
                        void moveTask(task.id, e.target.value as TaskStatus)
                      }
                    >
                      {DEFAULT_COLUMNS.map((s) => (
                        <option key={s} value={s}>
                          {COLUMN_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
