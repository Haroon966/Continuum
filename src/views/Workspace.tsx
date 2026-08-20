import { useMemo, useState } from "react";
import { useAppStore, type SectionId } from "../store";
import { BoardPanel } from "../panels/BoardPanel";
import { BrainPanel } from "../panels/BrainPanel";
import { CanvasPanel } from "../panels/CanvasPanel";
import { SettingsView } from "./SettingsView";
import {
  IconBoard,
  IconBrain,
  IconCanvas,
  IconSettings,
} from "../components/Icons";

type Mode = "board" | "canvas" | "brain";

/**
 * Hermes board + Bonscape canvas as primary surfaces.
 * Brain / settings stay supporting panels.
 */
export function Workspace() {
  const brain = useAppStore((s) => s.brain());
  const document = useAppStore((s) => s.document);
  const focusSection = useAppStore((s) => s.focusSection);
  const setFocusSection = useAppStore((s) => s.setFocusSection);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const [query, setQuery] = useState("");

  const mode: Mode =
    focusSection === "canvas"
      ? "canvas"
      : focusSection === "brain"
        ? "brain"
        : "board";

  const stats = useMemo(() => {
    if (!brain) return null;
    return {
      tasks: brain.tasks.length,
      running: brain.tasks.filter((t) => t.status === "running").length,
      blocked: brain.tasks.filter((t) => t.status === "blocked").length,
      done: brain.tasks.filter((t) => t.status === "done").length,
      nodes: brain.canvas.nodes.length,
    };
  }, [brain]);

  if (!brain || !stats) return null;

  function setMode(next: Mode) {
    setFocusSection(next as SectionId);
  }

  async function runSearch() {
    const result = await window.continuum.search(query);
    const first = result[0];
    if (!first) return;
    if (first.kind === "task") {
      useAppStore.getState().setSelectedTaskId(first.id);
      setMode("board");
    } else if (first.kind === "canvas") {
      useAppStore.getState().setSelectedNodeId(first.id);
      setMode("canvas");
    } else {
      setMode("brain");
    }
  }

  return (
    <div className="workspace workspace-hermes-bon">
      <header className="workspace-top">
        <div className="mode-tabs" role="tablist" aria-label="Workspace mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "board"}
            className={mode === "board" ? "active" : ""}
            onClick={() => setMode("board")}
          >
            <IconBoard size={16} />
            Board
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "canvas"}
            className={mode === "canvas" ? "active" : ""}
            onClick={() => setMode("canvas")}
          >
            <IconCanvas size={16} />
            Canvas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "brain"}
            className={mode === "brain" ? "active" : ""}
            onClick={() => setMode("brain")}
          >
            <IconBrain size={16} />
            Brain
          </button>
        </div>

        <div className="workspace-top-meta">
          <span className="badge">{stats.running} running</span>
          <span className="badge">{stats.blocked} blocked</span>
          <span className="badge">{stats.nodes} chats</span>
          <input
            className="top-search"
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
            className={`btn ghost${settingsOpen ? " active-btn" : ""}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <IconSettings size={16} />
            Settings
          </button>
        </div>
      </header>

      {(document?.parseErrors?.length || !brain.goal) && (
        <div className="workspace-banner">
          {document?.parseErrors?.length
            ? `Parse: ${document.parseErrors.join("; ")}`
            : brain.handoff || "Set a goal in Brain to guide agents."}
        </div>
      )}

      <div className="workspace-surface">
        {mode === "board" && (
          <div id="section-board" className="surface-fill">
            <BoardPanel />
          </div>
        )}
        {mode === "canvas" && (
          <div id="section-canvas" className="surface-fill">
            <CanvasPanel />
          </div>
        )}
        {mode === "brain" && (
          <div id="section-brain" className="surface-fill surface-scroll">
            <div className="panel brain-alone">
              <BrainPanel />
            </div>
          </div>
        )}
      </div>

      {settingsOpen && (
        <aside className="settings-drawer panel" aria-label="Settings">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Settings</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </button>
          </div>
          <SettingsView />
        </aside>
      )}
    </div>
  );
}
