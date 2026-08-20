import { useEffect, useRef, useState } from "react";
import type { ViewId } from "../store";

type MenuId = "file" | "edit" | "view" | "window" | "help";

type MenuAction = {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  action: () => void | Promise<void>;
};

type ChromeProps = {
  view: ViewId;
  setView: (v: ViewId) => void;
  hasProject: boolean;
  onOpenProject: () => void;
  onOpenCursor: () => void;
  onRevealFile: () => void;
};

export function AppChrome({
  view,
  setView,
  hasProject,
  onOpenProject,
  onOpenCursor,
  onRevealFile,
}: ChromeProps) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [maximized, setMaximized] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void window.continuum.windowIsMaximized().then(setMaximized);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const menus: Record<MenuId, { label: string; items: MenuAction[] }> = {
    file: {
      label: "File",
      items: [
        { label: "Open Folder…", shortcut: "Ctrl+O", action: onOpenProject },
        {
          label: "Show CONTINUUM.md",
          disabled: !hasProject,
          action: onRevealFile,
        },
        {
          label: "Continue with Cursor",
          disabled: !hasProject,
          action: onOpenCursor,
        },
        {
          label: "Quit",
          shortcut: "Ctrl+Q",
          action: () => void window.continuum.windowClose(),
        },
      ],
    },
    edit: {
      label: "Edit",
      items: [
        {
          label: "Settings",
          action: () => {
            setView("settings");
          },
        },
      ],
    },
    view: {
      label: "View",
      items: [
        { label: "Board (Hermes)", action: () => setView("board") },
        { label: "Canvas (Bonscape)", action: () => setView("canvas") },
        { label: "Brain", action: () => setView("brain") },
        { label: "Settings", action: () => setView("settings") },
      ],
    },
    window: {
      label: "Window",
      items: [
        {
          label: maximized ? "Restore" : "Maximize",
          action: async () => {
            const next = await window.continuum.windowMaximize();
            setMaximized(next);
          },
        },
        {
          label: "Minimize",
          action: () => void window.continuum.windowMinimize(),
        },
      ],
    },
    help: {
      label: "Help",
      items: [
        {
          label: "About Continuum",
          action: () => {
            window.alert(
              "Continuum\nOne project. Any agent. No lost context.\nLocal desktop workspace.",
            );
          },
        },
      ],
    },
  };

  return (
    <div className="chrome" ref={rootRef}>
      <div className="titlebar">
        <div className="titlebar-drag" />
        <div className="titlebar-title">Continuum</div>
        <div className="window-controls">
          <button
            type="button"
            className="win-btn"
            aria-label="Minimize"
            onClick={() => void window.continuum.windowMinimize()}
          >
            <span className="win-icon win-min" />
          </button>
          <button
            type="button"
            className="win-btn"
            aria-label={maximized ? "Restore" : "Maximize"}
            onClick={async () => {
              const next = await window.continuum.windowMaximize();
              setMaximized(next);
            }}
          >
            <span className={`win-icon ${maximized ? "win-restore" : "win-max"}`} />
          </button>
          <button
            type="button"
            className="win-btn win-close"
            aria-label="Close"
            onClick={() => void window.continuum.windowClose()}
          >
            <span className="win-icon win-x" />
          </button>
        </div>
      </div>

      <div className="menubar" role="menubar">
        {(Object.keys(menus) as MenuId[]).map((id) => {
          const menu = menus[id];
          const isOpen = openMenu === id;
          return (
            <div className="menu-item-wrap" key={id}>
              <button
                type="button"
                className={`menu-trigger${isOpen ? " open" : ""}`}
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setOpenMenu(isOpen ? null : id)}
                onMouseEnter={() => {
                  if (openMenu) setOpenMenu(id);
                }}
              >
                {menu.label}
              </button>
              {isOpen && (
                <ul className="menu-dropdown" role="menu">
                  {menu.items.map((item) => (
                    <li key={item.label} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="menu-option"
                        disabled={item.disabled}
                        onClick={() => {
                          setOpenMenu(null);
                          void item.action();
                        }}
                      >
                        <span>{item.label}</span>
                        {item.shortcut ? (
                          <span className="menu-shortcut">{item.shortcut}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        <div className="menubar-spacer" />
        <span className="menubar-view muted" aria-live="polite">
          workspace
        </span>
      </div>
    </div>
  );
}
