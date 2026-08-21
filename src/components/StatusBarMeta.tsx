import { useMemo, useState } from "react";
import { useAppStore, type SectionId } from "../store";
import { IconSettings } from "./Icons";

export function StatusBarMeta() {
  const brain = useAppStore((s) => s.brain());
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setFocusSection = useAppStore((s) => s.setFocusSection);
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    if (!brain) return null;
    return {
      running: brain.tasks.filter((t) => t.status === "running").length,
      blocked: brain.tasks.filter((t) => t.status === "blocked").length,
      nodes: brain.canvas.nodes.length,
    };
  }, [brain]);

  if (!stats) return null;

  async function runSearch() {
    const result = await window.continuum.search(query);
    const first = result[0];
    if (!first) return;
    if (first.kind === "task") {
      useAppStore.getState().setSelectedTaskId(first.id);
      setFocusSection("board" as SectionId);
    } else if (first.kind === "canvas") {
      useAppStore.getState().setSelectedNodeId(first.id);
      setFocusSection("canvas" as SectionId);
    } else {
      setFocusSection("brain" as SectionId);
    }
  }

  return (
    <div className="statusbar-meta">
      <span className="badge">{stats.running} running</span>
      <span className="badge">{stats.blocked} blocked</span>
      <span className="badge">{stats.nodes} chats</span>
      <input
        className="statusbar-search"
        aria-label="Search"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void runSearch();
        }}
      />
      <button
        type="button"
        className={`btn ghost statusbar-settings${settingsOpen ? " active-btn" : ""}`}
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <IconSettings size={14} />
        Settings
      </button>
    </div>
  );
}
