import { useEffect, useState } from "react";
import { useAppStore } from "../store";
import type { ContinuumBrain } from "@shared/types";

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BrainPanel() {
  const brain = useAppStore((s) => s.brain());
  const applyBrain = useAppStore((s) => s.applyBrain);
  const [draft, setDraft] = useState<ContinuumBrain | null>(null);
  const [reqText, setReqText] = useState("");
  const [archText, setArchText] = useState("");
  const [conText, setConText] = useState("");

  useEffect(() => {
    if (brain) {
      setDraft(structuredClone(brain));
      setReqText(listToText(brain.requirements));
      setArchText(listToText(brain.architecture));
      setConText(listToText(brain.constraints));
    }
  }, [brain]);

  if (!draft) return null;

  async function save() {
    await applyBrain({
      ...draft,
      requirements: textToList(reqText),
      architecture: textToList(archText),
      constraints: textToList(conText),
    });
  }

  return (
    <div className="stack">
      <div className="panel-head">
        <div>
          <h2>Brain</h2>
          <p className="sub">Goal, state, decisions — source of truth for agents.</p>
        </div>
        <button type="button" className="btn teal" onClick={() => void save()}>
          Save brain
        </button>
      </div>

      <div className="field">
        <label htmlFor="ws-goal">Goal</label>
        <textarea
          id="ws-goal"
          value={draft.goal}
          onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
          rows={2}
        />
      </div>
      <div className="brain-grid">
        <div className="field">
          <label htmlFor="ws-state">Current state</label>
          <textarea
            id="ws-state"
            value={draft.currentState}
            onChange={(e) =>
              setDraft({ ...draft, currentState: e.target.value })
            }
            rows={3}
          />
        </div>
        <div className="field">
          <label htmlFor="ws-handoff">Handoff</label>
          <textarea
            id="ws-handoff"
            value={draft.handoff}
            onChange={(e) => setDraft({ ...draft, handoff: e.target.value })}
            rows={3}
          />
        </div>
      </div>
      <details className="brain-more">
        <summary>Requirements · architecture · constraints</summary>
        <div className="brain-grid" style={{ marginTop: 10 }}>
          <div className="field">
            <label htmlFor="ws-req">Requirements</label>
            <textarea
              id="ws-req"
              value={reqText}
              onChange={(e) => setReqText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="field">
            <label htmlFor="ws-arch">Architecture</label>
            <textarea
              id="ws-arch"
              value={archText}
              onChange={(e) => setArchText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="field">
            <label htmlFor="ws-con">Constraints</label>
            <textarea
              id="ws-con"
              value={conText}
              onChange={(e) => setConText(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </details>
      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Decisions</strong>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const title = window.prompt("Decision title?");
              if (!title) return;
              const reason = window.prompt("Reason?") || undefined;
              setDraft({
                ...draft,
                decisions: [
                  ...draft.decisions,
                  { id: `d${Date.now()}`, title, reason },
                ],
              });
            }}
          >
            Add decision
          </button>
        </div>
        <ul className="list">
          {draft.decisions.length === 0 && (
            <li className="muted">No decisions yet</li>
          )}
          {draft.decisions.map((d) => (
            <li key={d.id}>
              <strong>{d.title}</strong>
              {d.reason ? <div className="muted">{d.reason}</div> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
