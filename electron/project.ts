import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import chokidar, { type FSWatcher } from "chokidar";
import {
  CONTINUUM_FILENAME,
  createTemplateMarkdown,
  parseContinuumMarkdown,
  writeBrainIntoMarkdown,
} from "../shared/dsl";
import type { ContinuumBrain, ContinuumDocument } from "../shared/types";

export class ProjectStore extends EventEmitter {
  projectPath: string | null = null;
  document: ContinuumDocument | null = null;
  private watcher: FSWatcher | null = null;
  private writing = false;
  private suppressUntil = 0;

  async openProject(folderPath: string): Promise<ContinuumDocument> {
    const resolved = path.resolve(folderPath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new Error(`Not a directory: ${resolved}`);
    }

    await this.closeProject();
    this.projectPath = resolved;
    const file = this.filePath();
    if (!file) throw new Error("No project path");

    if (!fs.existsSync(file)) {
      const name = path.basename(resolved);
      fs.writeFileSync(file, createTemplateMarkdown(name), "utf8");
    }

    this.document = this.readFile();
    this.startWatch(file);
    this.emit("change", this.document);
    return this.document;
  }

  async closeProject() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.projectPath = null;
    this.document = null;
  }

  filePath(): string | null {
    if (!this.projectPath) return null;
    return path.join(this.projectPath, CONTINUUM_FILENAME);
  }

  getBrain(): ContinuumBrain | null {
    return this.document?.brain ?? null;
  }

  applyBrain(brain: ContinuumBrain, activityText?: string): ContinuumDocument {
    if (!this.projectPath || !this.document) {
      throw new Error("No project open");
    }
    const nextBrain = { ...brain };
    if (activityText) {
      nextBrain.activity = [
        ...nextBrain.activity,
        { at: new Date().toISOString(), text: activityText },
      ].slice(-50);
    }
    const raw = writeBrainIntoMarkdown(this.document.raw, nextBrain);
    this.writeRaw(raw);
    this.document = parseContinuumMarkdown(raw);
    this.emit("change", this.document);
    return this.document;
  }

  mergeBrain(
    partial: Partial<ContinuumBrain>,
    activityText?: string,
  ): ContinuumDocument {
    const current = this.getBrain();
    if (!current) throw new Error("No project open");
    const merged: ContinuumBrain = {
      ...current,
      ...partial,
      canvas: partial.canvas
        ? {
            nodes: partial.canvas.nodes ?? current.canvas.nodes,
            edges: partial.canvas.edges ?? current.canvas.edges,
          }
        : current.canvas,
      tasks: partial.tasks ?? current.tasks,
      decisions: partial.decisions ?? current.decisions,
      requirements: partial.requirements ?? current.requirements,
      architecture: partial.architecture ?? current.architecture,
      constraints: partial.constraints ?? current.constraints,
      activity: partial.activity ?? current.activity,
    };
    return this.applyBrain(merged, activityText);
  }

  private readFile(): ContinuumDocument {
    const file = this.filePath();
    if (!file) throw new Error("No project");
    const raw = fs.readFileSync(file, "utf8");
    return parseContinuumMarkdown(raw);
  }

  private writeRaw(raw: string) {
    const file = this.filePath();
    if (!file) throw new Error("No project");
    this.writing = true;
    this.suppressUntil = Date.now() + 400;
    fs.writeFileSync(file, raw, "utf8");
    this.writing = false;
  }

  private startWatch(file: string) {
    this.watcher = chokidar.watch(file, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    });
    this.watcher.on("change", () => {
      if (this.writing || Date.now() < this.suppressUntil) return;
      try {
        this.document = this.readFile();
        this.emit("change", this.document);
        this.emit("external-change");
      } catch (err) {
        this.emit("error", err);
      }
    });
  }
}

export const projectStore = new ProjectStore();
