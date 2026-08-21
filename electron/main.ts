import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeTheme,
  shell,
} from "electron";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Server } from "node:http";
import { createApiServer } from "./api";
import { projectStore } from "./project";
import { loadSettings, saveSettings } from "./settings";
import { spawnProjectTerminal, type TerminalSession } from "./terminal";
import { appendTranscript, readTranscript } from "./transcripts";
import { readAssetDataUrl, saveAssetFromPath } from "./assets";
import type { ContinuumBrain, ContinuumSettings } from "../shared/types";

// Linux/dev: avoid FATAL "GPU process isn't usable" killing the app + Vite esbuild
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("no-sandbox");

let mainWindow: BrowserWindow | null = null;
let apiServer: Server | null = null;
let settings = loadSettings();
const terminals = new Map<string, TerminalSession>();

const isDev = !app.isPackaged;

function resolveAppIcon() {
  if (isDev) {
    return path.join(process.cwd(), "public", "continuum-color.png");
  }
  return path.join(__dirname, "../dist/continuum-color.png");
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "Continuum",
    icon: resolveAppIcon(),
    backgroundColor: "#00000000",
    transparent: true,
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  nativeTheme.themeSource = "light";
  if (isDev) {
    await mainWindow.loadURL("http://127.0.0.1:5173");
    if (process.env.CONTINUUM_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function broadcast(channel: string, payload: unknown) {
  mainWindow?.webContents.send(channel, payload);
}

async function startApi() {
  if (apiServer) {
    await new Promise<void>((resolve) => apiServer!.close(() => resolve()));
    apiServer = null;
  }
  try {
    const { listen } = createApiServer(projectStore, {
      port: settings.apiPort,
      token: settings.apiToken,
    });
    apiServer = await listen();
  } catch (err) {
    console.error("Continuum API failed to bind:", err);
  }
}

function registerIpc() {
  ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });
  ipcMain.handle("window:maximize", () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });
  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

  ipcMain.handle("settings:get", () => settings);

  ipcMain.handle("settings:set", (_e, next: ContinuumSettings) => {
    settings = { ...settings, ...next };
    saveSettings(settings);
    void startApi();
    return settings;
  });

  ipcMain.handle("project:open", async (_e, folder?: string) => {
    let target = folder;
    if (!target) {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory"],
      });
      if (result.canceled || !result.filePaths[0]) return null;
      target = result.filePaths[0];
    }
    const doc = await projectStore.openProject(target);
    settings.lastProjectPath = target;
    saveSettings(settings);
    return {
      path: projectStore.projectPath,
      document: doc,
      settings,
    };
  });

  ipcMain.handle("project:get", () => {
    if (!projectStore.projectPath || !projectStore.document) return null;
    return {
      path: projectStore.projectPath,
      document: projectStore.document,
      settings,
    };
  });

  ipcMain.handle("project:applyBrain", (_e, brain: ContinuumBrain) => {
    return projectStore.applyBrain(brain, "Updated from Continuum UI");
  });

  ipcMain.handle("project:search", (_e, query: string) => {
    const brain = projectStore.getBrain();
    if (!brain) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: { kind: string; id: string; text: string }[] = [];
    const push = (kind: string, id: string, text: string) => {
      if (text.toLowerCase().includes(q)) hits.push({ kind, id, text });
    };
    push("goal", "goal", brain.goal);
    push("currentState", "currentState", brain.currentState);
    push("handoff", "handoff", brain.handoff);
    for (const t of brain.tasks) push("task", t.id, t.title);
    for (const d of brain.decisions) {
      push("decision", d.id, `${d.title} ${d.reason || ""}`);
    }
    for (const n of brain.canvas.nodes) {
      push("canvas", n.id, `${n.title} ${n.summary || ""} ${n.url || ""}`);
    }
    for (const r of brain.requirements) push("requirement", r, r);
    for (const a of brain.architecture) push("architecture", a, a);
    for (const c of brain.constraints) push("constraint", c, c);
    return hits;
  });

  ipcMain.handle("agents:openCursor", async () => {
    if (!projectStore.projectPath) throw new Error("No project open");
    const folder = projectStore.projectPath;
    const bin = settings.cursorPath || "cursor";
    spawn(bin, [folder], {
      detached: true,
      stdio: "ignore",
      shell: process.platform === "win32",
    }).unref();
    return { ok: true, folder };
  });

  ipcMain.handle("agents:revealFile", async () => {
    const file = projectStore.filePath();
    if (!file) throw new Error("No project open");
    shell.showItemInFolder(file);
    return true;
  });

  ipcMain.handle(
    "terminal:start",
    (_e, payload: { id: string; cols?: number; rows?: number }) => {
      if (!projectStore.projectPath) throw new Error("No project open");
      if (terminals.has(payload.id)) return { ok: true, reused: true };

      const claude = settings.claudePath || "claude";
      const command = `export CONTINUUM_TOKEN='${settings.apiToken}'; export CONTINUUM_API='http://127.0.0.1:${settings.apiPort}'; echo "Continuum → Claude CLI"; echo "cwd: $(pwd)"; echo "Tip: read CONTINUUM.md / curl \\$CONTINUUM_API"; echo; ${claude}`;

      const session = spawnProjectTerminal({
        cwd: projectStore.projectPath,
        env: {
          CONTINUUM_TOKEN: settings.apiToken,
          CONTINUUM_API: `http://127.0.0.1:${settings.apiPort}`,
        },
        command,
        onData: (data) => {
          if (projectStore.projectPath) {
            appendTranscript(projectStore.projectPath, payload.id, data);
          }
          broadcast("terminal:data", { id: payload.id, data });
        },
        onExit: () => {
          terminals.delete(payload.id);
          broadcast("terminal:exit", { id: payload.id });
        },
      });

      terminals.set(payload.id, session);
      const history = projectStore.projectPath
        ? readTranscript(projectStore.projectPath, payload.id)
        : "";
      if (history) {
        broadcast("terminal:data", { id: payload.id, data: history });
      }
      return { ok: true, reused: false };
    },
  );

  ipcMain.handle(
    "terminal:write",
    (_e, payload: { id: string; data: string }) => {
      terminals.get(payload.id)?.write(payload.data);
    },
  );

  ipcMain.handle(
    "terminal:resize",
    (_e, payload: { id: string; cols: number; rows: number }) => {
      terminals.get(payload.id)?.resize(payload.cols, payload.rows);
    },
  );

  ipcMain.handle("terminal:kill", (_e, id: string) => {
    const term = terminals.get(id);
    if (term) {
      term.kill();
      terminals.delete(id);
    }
  });

  ipcMain.handle("canvas:pickImage", async () => {
    if (!projectStore.projectPath) throw new Error("No project open");
    const result = await dialog.showOpenDialog({
      title: "Add image to canvas",
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const { rel } = saveAssetFromPath(
      projectStore.projectPath,
      result.filePaths[0],
    );
    return { path: rel, name: path.basename(result.filePaths[0]) };
  });

  ipcMain.handle("canvas:readAsset", (_e, rel: string) => {
    if (!projectStore.projectPath) throw new Error("No project open");
    return readAssetDataUrl(projectStore.projectPath, rel);
  });

  ipcMain.handle("canvas:openUrl", async (_e, url: string) => {
    const u = String(url || "");
    if (!/^https?:\/\//i.test(u)) throw new Error("Only http(s) URLs allowed");
    await shell.openExternal(u);
    return true;
  });
}

projectStore.on("change", (doc) => {
  broadcast("project:changed", {
    path: projectStore.projectPath,
    document: doc,
  });
});

projectStore.on("external-change", () => {
  broadcast("project:external-change", true);
});

app.whenReady().then(async () => {
  registerIpc();
  await startApi();
  await createWindow();

  if (settings.lastProjectPath) {
    try {
      await projectStore.openProject(settings.lastProjectPath);
    } catch {
      // ignore missing last project
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  for (const term of terminals.values()) term.kill();
  terminals.clear();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  apiServer?.close();
});
