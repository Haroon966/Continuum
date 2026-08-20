import { IconFolder } from "../components/Icons";

export function Welcome({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="empty">
      <div className="welcome-card">
        <p className="eyebrow">Continuum</p>
        <h2>One project. Any agent. No lost context.</h2>
        <p className="sub">
          Open a local folder. Continuum creates <code>CONTINUUM.md</code>, syncs
          your board live, and lets Claude CLI / Cursor continue without paste.
        </p>
        <ul>
          <li>Project brain in one root file</li>
          <li>Kanban ↔ file, two-way</li>
          <li>Canvas branches + agent handoff</li>
        </ul>
        <button type="button" className="btn primary" onClick={onOpen}>
          <IconFolder size={16} />
          Open folder
        </button>
      </div>
    </div>
  );
}
