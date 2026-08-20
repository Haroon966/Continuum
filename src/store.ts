import { create } from "zustand";
import type {
  ContinuumBrain,
  ContinuumDocument,
  ContinuumSettings,
} from "@shared/types";

export type SectionId =
  | "brain"
  | "board"
  | "canvas"
  | "agents"
  | "settings";

/** @deprecated use SectionId — kept for chrome menu scroll targets */
export type ViewId = SectionId | "overview" | "workspace";

type ProjectPayload = {
  path: string;
  document: ContinuumDocument;
  settings: ContinuumSettings;
};

interface AppState {
  view: ViewId;
  focusSection: SectionId;
  selectedTaskId: string | null;
  selectedNodeId: string | null;
  projectPath: string | null;
  document: ContinuumDocument | null;
  settings: ContinuumSettings | null;
  notice: string | null;
  activeTerminalId: string | null;
  settingsOpen: boolean;
  setView: (view: ViewId) => void;
  setFocusSection: (section: SectionId) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSettingsOpen: (open: boolean) => void;
  setNotice: (notice: string | null) => void;
  hydrate: (payload: ProjectPayload | null) => void;
  setDocument: (document: ContinuumDocument) => void;
  setSettings: (settings: ContinuumSettings) => void;
  setActiveTerminalId: (id: string | null) => void;
  brain: () => ContinuumBrain | null;
  applyBrain: (brain: ContinuumBrain) => Promise<void>;
  scrollToSection: (section: SectionId) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: "workspace",
  focusSection: "board",
  selectedTaskId: null,
  selectedNodeId: null,
  projectPath: null,
  document: null,
  settings: null,
  notice: null,
  activeTerminalId: null,
  settingsOpen: false,
  setView: (view) => {
    if (view === "settings") {
      set({ view: "workspace", settingsOpen: true, focusSection: "settings" });
      return;
    }
    if (view === "overview" || view === "workspace" || view === "agents") {
      set({
        view: "workspace",
        focusSection: view === "agents" ? "canvas" : "board",
      });
      return;
    }
    set({ view: "workspace", focusSection: view as SectionId });
  },
  setFocusSection: (focusSection) => set({ focusSection }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setNotice: (notice) => set({ notice }),
  hydrate: (payload) => {
    if (!payload) {
      set({ projectPath: null, document: null });
      return;
    }
    set({
      projectPath: payload.path,
      document: payload.document as ContinuumDocument,
      settings: payload.settings,
    });
  },
  setDocument: (document) => set({ document }),
  setSettings: (settings) => set({ settings }),
  setActiveTerminalId: (id) => set({ activeTerminalId: id }),
  brain: () => get().document?.brain ?? null,
  applyBrain: async (brain) => {
    const doc = (await window.continuum.applyBrain(brain)) as ContinuumDocument;
    set({ document: doc });
  },
  scrollToSection: (section) => {
    const el = document.getElementById(`section-${section}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    set({ focusSection: section });
  },
}));
