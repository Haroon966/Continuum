import { useEffect, useState } from "react";
import { useAppStore } from "../store";
import type { ContinuumSettings } from "@shared/types";

export function SettingsView() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const setNotice = useAppStore((s) => s.setNotice);
  const [draft, setDraft] = useState<ContinuumSettings | null>(null);

  useEffect(() => {
    if (settings) setDraft({ ...settings });
  }, [settings]);

  if (!draft) return null;

  async function save() {
    const next = await window.continuum.setSettings(draft!);
    setSettings(next);
    setNotice("Settings saved — API restarted");
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <div className="stack">
      <p className="sub">Local-only. No login. No cloud sync.</p>
      <div className="field">
        <label htmlFor="claude">Claude CLI path</label>
        <input
          id="claude"
          value={draft.claudePath}
          onChange={(e) => setDraft({ ...draft, claudePath: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="cursor">Cursor CLI / binary path</label>
        <input
          id="cursor"
          value={draft.cursorPath}
          onChange={(e) => setDraft({ ...draft, cursorPath: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="port">Local API port</label>
        <input
          id="port"
          type="number"
          value={draft.apiPort}
          onChange={(e) =>
            setDraft({ ...draft, apiPort: Number(e.target.value) || 3927 })
          }
        />
      </div>
      <div className="field">
        <label htmlFor="token">API bearer token</label>
        <input
          id="token"
          value={draft.apiToken}
          onChange={(e) => setDraft({ ...draft, apiToken: e.target.value })}
        />
      </div>
      <button type="button" className="btn primary" onClick={() => void save()}>
        Save settings
      </button>
    </div>
  );
}
