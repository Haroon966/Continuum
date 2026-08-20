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

export function Brain() {
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
    <section className="panel stack">
      <div>
        <h2>Project brain</h2>
        <p className="sub">Edits write the continuum DSL fence in CONTINUUM.md.</p>
      </div>

      <div className="field">
        <label htmlFor="goal">Goal</label>
        <textarea
          id="goal"
          value={draft.goal}
          onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="req">Requirements (one per line)</label>
        <textarea
          id="req"
          value={reqText}
          onChange={(e) => setReqText(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="arch">Architecture (one per line)</label>
        <textarea
          id="arch"
          value={archText}
          onChange={(e) => setArchText(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="con">Constraints (one per line)</label>
        <textarea
          id="con"
          value={conText}
          onChange={(e) => setConText(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="state">Current state</label>
        <textarea
          id="state"
          value={draft.currentState}
          onChange={(e) =>
            setDraft({ ...draft, currentState: e.target.value })
          }
        />
      </div>
      <div className="field">
        <label htmlFor="handoff">Handoff</label>
        <textarea
          id="handoff"
          value={draft.handoff}
          onChange={(e) => setDraft({ ...draft, handoff: e.target.value })}
        />
      </div>

      <div>
        <h3>Decisions</h3>
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

      <div className="row">
        <button type="button" className="btn primary" onClick={() => void save()}>
          Save to CONTINUUM.md
        </button>
      </div>
    </section>
  );
}
