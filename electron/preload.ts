import { contextBridge, ipcRenderer } from "electron";
import type { ContinuumBrain, ContinuumSettings } from "../shared/types";

export type ContinuumApi = {
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<boolean>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;
  getSettings: () => Promise<ContinuumSettings>;
  setSettings: (s: ContinuumSettings) => Promise<ContinuumSettings>;
  openProject: (folder?: string) => Promise<{
    path: string;
    document: unknown;
    settings: ContinuumSettings;
  } | null>;
  getProject: () => Promise<{
    path: string;
    document: unknown;
    settings: ContinuumSettings;
  } | null>;
  applyBrain: (brain: ContinuumBrain) => Promise<unknown>;
  search: (query: string) => Promise<
    { kind: string; id: string; text: string }[]
  >;
  openCursor: () => Promise<{ ok: boolean; folder: string }>;
  revealFile: () => Promise<boolean>;
  terminalStart: (id: string, cols?: number, rows?: number) => Promise<unknown>;
  terminalWrite: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  terminalKill: (id: string) => Promise<void>;
  pickCanvasImage: () => Promise<{ path: string; name: string } | null>;
  readCanvasAsset: (rel: string) => Promise<string | null>;
  openExternalUrl: (url: string) => Promise<boolean>;
  onProjectChanged: (cb: (payload: unknown) => void) => () => void;
  onExternalChange: (cb: () => void) => () => void;
  onTerminalData: (
    cb: (payload: { id: string; data: string }) => void,
  ) => () => void;
  onTerminalExit: (cb: (payload: { id: string }) => void) => () => void;
};

const api: ContinuumApi = {
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
  windowIsMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (s) => ipcRenderer.invoke("settings:set", s),
  openProject: (folder) => ipcRenderer.invoke("project:open", folder),
  getProject: () => ipcRenderer.invoke("project:get"),
  applyBrain: (brain) => ipcRenderer.invoke("project:applyBrain", brain),
  search: (query) => ipcRenderer.invoke("project:search", query),
  openCursor: () => ipcRenderer.invoke("agents:openCursor"),
  revealFile: () => ipcRenderer.invoke("agents:revealFile"),
  terminalStart: (id, cols, rows) =>
    ipcRenderer.invoke("terminal:start", { id, cols, rows }),
  terminalWrite: (id, data) =>
    ipcRenderer.invoke("terminal:write", { id, data }),
  terminalResize: (id, cols, rows) =>
    ipcRenderer.invoke("terminal:resize", { id, cols, rows }),
  terminalKill: (id) => ipcRenderer.invoke("terminal:kill", id),
  pickCanvasImage: () => ipcRenderer.invoke("canvas:pickImage"),
  readCanvasAsset: (rel) => ipcRenderer.invoke("canvas:readAsset", rel),
  openExternalUrl: (url) => ipcRenderer.invoke("canvas:openUrl", url),
  onProjectChanged: (cb) => {
    const listener = (_: unknown, payload: unknown) => cb(payload);
    ipcRenderer.on("project:changed", listener);
    return () => ipcRenderer.removeListener("project:changed", listener);
  },
  onExternalChange: (cb) => {
    const listener = () => cb();
    ipcRenderer.on("project:external-change", listener);
    return () =>
      ipcRenderer.removeListener("project:external-change", listener);
  },
  onTerminalData: (cb) => {
    const listener = (
      _: unknown,
      payload: { id: string; data: string },
    ) => cb(payload);
    ipcRenderer.on("terminal:data", listener);
    return () => ipcRenderer.removeListener("terminal:data", listener);
  },
  onTerminalExit: (cb) => {
    const listener = (_: unknown, payload: { id: string }) => cb(payload);
    ipcRenderer.on("terminal:exit", listener);
    return () => ipcRenderer.removeListener("terminal:exit", listener);
  },
};

contextBridge.exposeInMainWorld("continuum", api);
