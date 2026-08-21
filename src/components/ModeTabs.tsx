import { useAppStore, type SectionId } from "../store";
import { IconBoard, IconBrain, IconCanvas } from "./Icons";

type Mode = "board" | "canvas" | "brain";

export function ModeTabs() {
  const focusSection = useAppStore((s) => s.focusSection);
  const setFocusSection = useAppStore((s) => s.setFocusSection);

  const mode: Mode =
    focusSection === "canvas"
      ? "canvas"
      : focusSection === "brain"
        ? "brain"
        : "board";

  function setMode(next: Mode) {
    setFocusSection(next as SectionId);
  }

  return (
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
  );
}
