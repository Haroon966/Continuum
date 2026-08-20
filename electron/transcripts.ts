import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

function transcriptDir(projectKey: string) {
  const dir = path.join(app.getPath("userData"), "transcripts", projectKey);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function projectKey(projectPath: string) {
  return Buffer.from(projectPath).toString("base64url");
}

export function appendTranscript(
  projectPath: string,
  nodeId: string,
  chunk: string,
) {
  const file = path.join(transcriptDir(projectKey(projectPath)), `${nodeId}.log`);
  fs.appendFileSync(file, chunk, "utf8");
}

export function readTranscript(projectPath: string, nodeId: string): string {
  const file = path.join(transcriptDir(projectKey(projectPath)), `${nodeId}.log`);
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}
