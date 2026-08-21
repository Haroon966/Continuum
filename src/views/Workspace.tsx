import { useAppStore } from "../store";
import { BoardPanel } from "../panels/BoardPanel";
import { BrainPanel } from "../panels/BrainPanel";
import { CanvasPanel } from "../panels/CanvasPanel";
import { SettingsView } from "./SettingsView";

/**
 * Hermes board + Bonscape canvas as primary surfaces.
 * Brain / settings stay supporting panels.
 */
export function Workspace() {
  const brain = useAppStore((s) => s.brain());
  const document = useAppStore((s) => s.document);
  const focusSection = useAppStore((s) => s.focusSection);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const mode =
    focusSection === "canvas"
      ? "canvas"
      : focusSection === "brain"
        ? "brain"
        : "board";

  if (!brain) return null;

  return (
    <div className="workspace workspace-hermes-bon">
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
          <div id="section-brain" className="surface-fill surface-scroll brain-full">
            <BrainPanel />
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
