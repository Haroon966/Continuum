import { useMemo, useState } from "react";
import { useAppStore } from "../store";

export function Overview() {
  const brain = useAppStore((s) => s.brain());
  const document = useAppStore((s) => s.document);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<
    { kind: string; id: string; text: string }[]
  >([]);

  const stats = useMemo(() => {
    if (!brain) return null;
    return {
      tasks: brain.tasks.length,
      done: brain.tasks.filter((t) => t.status === "done").length,
      decisions: brain.decisions.length,
      nodes: brain.canvas.nodes.length,
    };
  }, [brain]);

  if (!brain || !stats) return null;

  async function runSearch() {
    const result = await window.continuum.search(query);
    setHits(result);
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Overview</h2>
        <p className="sub">Dashboard counts from the continuum DSL.</p>
        <div className="grid-stats">
          <div className="stat">
            <div className="label">Tasks</div>
            <div className="value">{stats.tasks}</div>
          </div>
          <div className="stat">
            <div className="label">Done</div>
            <div className="value">{stats.done}</div>
          </div>
          <div className="stat">
            <div className="label">Decisions</div>
            <div className="value">{stats.decisions}</div>
          </div>
          <div className="stat">
            <div className="label">Canvas nodes</div>
            <div className="value">{stats.nodes}</div>
          </div>
        </div>
        <div className="stack">
          <div>
            <strong>Goal</strong>
            <p className="muted">{brain.goal || "(unset)"}</p>
          </div>
          <div>
            <strong>Current state</strong>
            <p className="muted">{brain.currentState || "(unset)"}</p>
          </div>
          <div>
            <strong>Handoff</strong>
            <p className="muted">{brain.handoff || "(unset)"}</p>
          </div>
        </div>
        {document?.parseErrors?.length ? (
          <p className="error">Parse: {document.parseErrors.join("; ")}</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Search brain</h2>
        <p className="sub">Local search over structured fields.</p>
        <div className="row">
          <input
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. authentication"
            style={{
              flex: 1,
              minWidth: 200,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
          />
          <button type="button" className="btn" onClick={() => void runSearch()}>
            Search
          </button>
        </div>
        <ul className="list">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}-${h.text}`}>
              <span className="muted">{h.kind}</span> — {h.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
