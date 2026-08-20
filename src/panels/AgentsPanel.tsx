import { useAppStore } from "../store";
import { TerminalPanel } from "../components/TerminalPanel";
import { IconCursor } from "../components/Icons";

export function AgentsPanel() {
  const settings = useAppStore((s) => s.settings);
  const projectPath = useAppStore((s) => s.projectPath);
  const brain = useAppStore((s) => s.brain());
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setActiveTerminalId = useAppStore((s) => s.setActiveTerminalId);
  const activeTerminalId = useAppStore((s) => s.activeTerminalId);
  const setNotice = useAppStore((s) => s.setNotice);
  const scrollToSection = useAppStore((s) => s.scrollToSection);

  async function openCursor() {
    await window.continuum.openCursor();
    setNotice("Cursor launched — use curl guide below");
    window.setTimeout(() => setNotice(null), 2500);
  }

  function startClaude() {
    const id =
      selectedNodeId &&
      brain?.canvas.nodes.find((n) => n.id === selectedNodeId)?.type === "chat"
        ? selectedNodeId
        : `cli-${Date.now()}`;
    setActiveTerminalId(id);
  }

  const token = settings?.apiToken || "";
  const port = settings?.apiPort || 3927;
  const linkedTask = selectedTaskId
    ? brain?.tasks.find((t) => t.id === selectedTaskId)
    : null;
  const linkedNode = selectedNodeId
    ? brain?.canvas.nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h2>Agents</h2>
          <p className="sub">
            Claude CLI here · Cursor via open + curl. Context stays in CONTINUUM.md.
          </p>
        </div>
      </div>

      <div className="agent-context">
        <div>
          <span className="muted">Task</span>
          <div>{linkedTask ? linkedTask.title : "None selected"}</div>
        </div>
        <div>
          <span className="muted">Canvas node</span>
          <div>{linkedNode ? linkedNode.title : "None selected"}</div>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => scrollToSection("board")}
        >
          Go to board
        </button>
      </div>

      <div className="row">
        <button
          type="button"
          className="btn teal"
          disabled={!projectPath}
          onClick={startClaude}
        >
          Start Claude CLI
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!projectPath}
          onClick={() => void openCursor()}
        >
          <IconCursor size={16} />
          Continue with Cursor
        </button>
      </div>

      {activeTerminalId && (
        <div>
          <p className="muted" style={{ marginBottom: 8 }}>
            Terminal — {activeTerminalId}
          </p>
          <TerminalPanel id={activeTerminalId} />
        </div>
      )}

      <details className="brain-more">
        <summary>Cursor curl commands</summary>
        <pre className="curl-block">{`export CONTINUUM_TOKEN=${token}
export CONTINUUM_API=http://127.0.0.1:${port}

curl -s $CONTINUUM_API/api/context \\
  -H "Authorization: Bearer $CONTINUUM_TOKEN"

curl -s -X PATCH $CONTINUUM_API/api/context \\
  -H "Authorization: Bearer $CONTINUUM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"handoff":"Next: …"}'`}</pre>
      </details>
    </div>
  );
}
