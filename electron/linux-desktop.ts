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

  // Dev must start Vite (port 5173). Raw electron → blank window.
  // Prefer ~/.local/bin/continuum from install.sh; else npm in cwd.
  const launcher = path.join(home, ".local", "bin", "continuum");
  const exec = app.isPackaged
    ? quoteDesktopArg(process.execPath)
    : fs.existsSync(launcher)
      ? quoteDesktopArg(launcher)
      : `env ELECTRON_DISABLE_GPU=1 npm --prefix ${quoteDesktopArg(path.resolve(process.cwd()))} run electron:dev`;

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
