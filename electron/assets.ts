import fs from "node:fs";
import path from "node:path";

export function ensureAssetsDir(projectPath: string) {
  const dir = path.join(projectPath, ".continuum", "assets");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function resolveAssetPath(projectPath: string, relOrUrl: string) {
  if (/^https?:\/\//i.test(relOrUrl)) return null;
  const rel = relOrUrl.replace(/^\.\//, "");
  if (rel.includes("..") || !rel.startsWith(".continuum/assets/")) {
    throw new Error("Asset path must be under .continuum/assets/");
  }
  const abs = path.resolve(projectPath, rel);
  const root = path.resolve(projectPath, ".continuum", "assets");
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error("Asset path escapes assets dir");
  }
  return abs;
}

export function saveAssetFromPath(
  projectPath: string,
  sourcePath: string,
  preferredName?: string,
) {
  ensureAssetsDir(projectPath);
  const id = `a${Date.now()}`;
  const name = preferredName || path.basename(sourcePath);
  // No spaces: CONTINUUM.md meta/paths must stay single tokens when legacy-parsed
  const safe = `${id}-${path
    .basename(name)
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-()+]+/g, "_")}`;
  const rel = `.continuum/assets/${safe}`;
  const dest = path.join(projectPath, ".continuum", "assets", safe);
  fs.copyFileSync(sourcePath, dest);
  return { rel, abs: dest };
}

export function saveAssetFromBase64(
  projectPath: string,
  filename: string,
  dataBase64: string,
) {
  ensureAssetsDir(projectPath);
  const id = `a${Date.now()}`;
  const safe = `${id}-${path
    .basename(filename)
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-()+]+/g, "_")}`;
  const rel = `.continuum/assets/${safe}`;
  const dest = path.join(projectPath, ".continuum", "assets", safe);
  const raw = dataBase64.includes(",")
    ? dataBase64.slice(dataBase64.indexOf(",") + 1)
    : dataBase64;
  const buf = Buffer.from(raw, "base64");
  if (buf.length > 12 * 1024 * 1024) {
    throw new Error("Asset too large (max 12MB)");
  }
  fs.writeFileSync(dest, buf);
  return { rel, abs: dest };
}

export function readAssetDataUrl(
  projectPath: string,
  rel: string,
): string | null {
  try {
    const abs = resolveAssetPath(projectPath, rel);
    if (!abs) return null;
    if (!fs.existsSync(abs)) return null;
    const buf = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".svg"
              ? "image/svg+xml"
              : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
