import { useAppStore } from "../store";
import { TerminalPanel } from "../components/TerminalPanel";

export function Agents() {
  const settings = useAppStore((s) => s.settings);
  const projectPath = useAppStore((s) => s.projectPath);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const activeTerminalId = useAppStore((s) => s.activeTerminalId);
  const setNotice = useAppStore((s) => s.setNotice);

  async function openCursor() {
    await window.continuum.openCursor();
    setNotice("Cursor launched on project folder");
    window.setTimeout(() => setNotice(null), 2500);
  }

  function startClaude() {
    const id = `cli-${Date.now()}`;
    setActiveTerminalId(id);
  }

  const token = settings?.apiToken || "";
  const port = settings?.apiPort || 3927;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Agents</h2>
        <p className="sub">
          Claude via in-app terminal. Cursor via open app + localhost curl.
        </p>
        <div className="row">
          <button
            type="button"
            className="btn primary"
            disabled={!projectPath}
            onClick={startClaude}
          >
            Start Claude CLI
          </button>
          <button
            type="button"
            className="btn"
            disabled={!projectPath}
            onClick={() => void openCursor()}
          >
            Continue with Cursor
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Cursor curl guide</h2>
        <p className="sub">
          Also embedded in CONTINUUM.md. Token is injected as CONTINUUM_TOKEN in
          Continuum terminals.
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 12,
            fontFamily: "var(--mono)",
            fontSize: "0.8rem",
          }}
        >{`export CONTINUUM_TOKEN=${token}
export CONTINUUM_API=http://127.0.0.1:${port}

# Get decisions / tasks / handoff
curl -s $CONTINUUM_API/api/context \\
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

# Update handoff / state
curl -s -X PATCH $CONTINUUM_API/api/context \\
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"handoff":"Next: …","currentState":"…"}'

# Add task
curl -s -X POST $CONTINUUM_API/api/tasks \\
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Ship slice","status":"ready"}'`}</pre>
      </section>

      {activeTerminalId && (
        <section className="panel">
          <h2>Terminal — {activeTerminalId}</h2>
          <TerminalPanel id={activeTerminalId} />
        </section>
      )}
    </div>
  );
}
