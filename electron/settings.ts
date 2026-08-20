import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { ContinuumSettings } from "../shared/types";

const DEFAULTS: ContinuumSettings = {
  claudePath: "claude",
  cursorPath: "cursor",
  apiPort: 3927,
  apiToken: "",
  lastProjectPath: null,
};

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): ContinuumSettings {
  const file = settingsPath();
  if (!fs.existsSync(file)) {
    const created = {
      ...DEFAULTS,
      apiToken: randomBytes(16).toString("hex"),
    };
    saveSettings(created);
    return created;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ContinuumSettings;
    return { ...DEFAULTS, ...parsed };
  } catch {
    const created = {
      ...DEFAULTS,
      apiToken: randomBytes(16).toString("hex"),
    };
    saveSettings(created);
    return created;
  }
}

export function saveSettings(settings: ContinuumSettings) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
}
