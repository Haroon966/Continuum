import { useEffect } from "react";
import { useAppStore } from "./store";
import type { ContinuumDocument } from "@shared/types";
import { AppChrome } from "./components/AppChrome";
import { ModeTabs } from "./components/ModeTabs";
import { StatusBarMeta } from "./components/StatusBarMeta";
import { IconCursor, IconFile, IconFolder } from "./components/Icons";
import { Workspace } from "./views/Workspace";
import { Welcome } from "./views/Welcome";

export function App() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const projectPath = useAppStore((s) => s.projectPath);
  const notice = useAppStore((s) => s.notice);
  const setNotice = useAppStore((s) => s.setNotice);
  const hydrate = useAppStore((s) => s.hydrate);
  const setDocument = useAppStore((s) => s.setDocument);
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    void (async () => {
      const settings = await window.continuum.getSettings();
      useAppStore.getState().setSettings(settings);
      const project = await window.continuum.getProject();
      if (project) {
        hydrate(project as Parameters<typeof hydrate>[0]);
      }
    })();

    const offChange = window.continuum.onProjectChanged((payload) => {
      const p = payload as {
        path: string;
        document: ContinuumDocument;
      };
      setDocument(p.document);
      useAppStore.setState({ projectPath: p.path });
    });

    const offExternal = window.continuum.onExternalChange(() => {
      setNotice("CONTINUUM.md changed on disk (last write wins)");
      window.setTimeout(() => setNotice(null), 3200);
    });

    return () => {
      offChange();
      offExternal();
    };
  }, [hydrate, setDocument, setNotice]);

  async function openProject() {
    const result = await window.continuum.openProject();
    if (result) hydrate(result as Parameters<typeof hydrate>[0]);
  }

  async function openCursor() {
    await window.continuum.openCursor();
    setNotice("Opened Cursor on project folder");
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <div className="app-root">
      <AppChrome
        view={view}
        setView={setView}
        hasProject={Boolean(projectPath)}
        onOpenProject={() => void openProject()}
        onOpenCursor={() => void openCursor()}
        onRevealFile={() => void window.continuum.revealFile()}
      />

      <div className="app-shell app-shell-unified">
        <div className="main">
          <header className="topbar">
            <div className="topbar-left">
              {projectPath ? <ModeTabs /> : null}
            </div>
            <div className="row">
              {settings && (
                <span className="badge" title="Local Continuum API">
                  API :{settings.apiPort}
                </span>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => void openProject()}
              >
                <IconFolder size={16} />
                Open folder
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!projectPath}
                onClick={() => void window.continuum.revealFile()}
              >
                <IconFile size={16} />
                CONTINUUM.md
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!projectPath}
                onClick={() => void openCursor()}
              >
                <IconCursor size={22} variant="light" />
                Cursor
              </button>
            </div>
          </header>
          <main className="content content-unified">
            {!projectPath ? (
              <Welcome onOpen={() => void openProject()} />
            ) : (
              <Workspace />
            )}
          </main>
        </div>
      </div>

      <footer className="statusbar" aria-label="Status">
        <div className="statusbar-path muted" title={projectPath || undefined}>
          {projectPath || "No project open"}
        </div>
        <StatusBarMeta />
      </footer>

      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
