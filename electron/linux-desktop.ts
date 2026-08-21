import { app, nativeImage } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * GNOME (and many Linux docks) ignore BrowserWindow.setIcon for the shell
 * favorite/dash icon. They look up a .desktop file by StartupWMClass /
 * app.setDesktopName instead. Install that locally on every Linux launch.
 */
export function ensureLinuxDesktopIntegration(iconPath: string): void {
  if (process.platform !== "linux") return;

  app.setDesktopName("continuum.desktop");

  if (!fs.existsSync(iconPath)) return;

  const img = nativeImage.createFromPath(iconPath);
  if (img.isEmpty()) return;

  const home = os.homedir();
  const hicolor = path.join(home, ".local", "share", "icons", "hicolor");
  const appsDir = path.join(home, ".local", "share", "applications");
  fs.mkdirSync(appsDir, { recursive: true });

  for (const size of [32, 48, 64, 128, 256, 512]) {
    const dir = path.join(hicolor, `${size}x${size}`, "apps");
    fs.mkdirSync(dir, { recursive: true });
    const resized = img.resize({ width: size, height: size });
    fs.writeFileSync(path.join(dir, "continuum.png"), resized.toPNG());
  }

  const appPath = app.isPackaged ? process.execPath : path.resolve(process.cwd());
  const exec = app.isPackaged
    ? quoteDesktopArg(process.execPath)
    : `${quoteDesktopArg(process.execPath)} ${quoteDesktopArg(appPath)}`;

  const desktop = `[Desktop Entry]
Version=1.0
Type=Application
Name=Continuum
Comment=One project. Any agent. No lost context.
Exec=${exec}
Icon=continuum
Terminal=false
Categories=Development;IDE;
StartupWMClass=Continuum
StartupNotify=true
`;

  fs.writeFileSync(path.join(appsDir, "continuum.desktop"), desktop);

  // Best-effort caches; ignore failures (missing tools / sandboxes).
  spawn("gtk-update-icon-cache", ["-f", "-t", hicolor], {
    stdio: "ignore",
    detached: true,
  }).unref();
  spawn("update-desktop-database", [appsDir], {
    stdio: "ignore",
    detached: true,
  }).unref();
}

function quoteDesktopArg(value: string): string {
  if (!/[^\w@%+=:,./-]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}
