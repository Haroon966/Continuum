import express from "express";
import cors from "cors";
import type { Server } from "node:http";
import type { ProjectStore } from "./project";
import type { ContinuumBrain, Task, TaskStatus } from "../shared/types";
import { completeTaskWork, startTaskWork } from "../shared/agentLoop";
import { saveAssetFromBase64 } from "./assets";

export function createApiServer(
  store: ProjectStore,
  opts: { port: number; token: string },
): { app: express.Express; listen: () => Promise<Server> } {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "16mb" }));

  app.use((req, res, next) => {
    if (req.path === "/api/health") return next();
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : req.header("x-continuum-token") || "";
    if (token !== opts.token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      project: store.projectPath,
      hasBrain: Boolean(store.getBrain()),
    });
  });

  app.get("/api/context", (_req, res) => {
    const brain = store.getBrain();
    if (!store.projectPath || !brain) {
      res.status(404).json({ error: "No project open" });
      return;
    }
    res.json({
      path: store.projectPath,
      brain,
      updatedAt: new Date().toISOString(),
    });
  });

  app.patch("/api/context", (req, res) => {
    try {
      const partial = req.body as Partial<ContinuumBrain>;
      const doc = store.mergeBrain(partial, "Updated via curl PATCH /api/context");
      res.json({ ok: true, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const title = String(req.body.title || "").trim();
      if (!title) throw new Error("title required");
      const id = String(req.body.id || `t${Date.now()}`);
      const status = (req.body.status as TaskStatus) || "todo";
      const task: Task = {
        id,
        title,
        status,
        priority: req.body.priority,
        link: req.body.link,
      };
      const doc = store.applyBrain(
        { ...brain, tasks: [...brain.tasks, task] },
        `Task created via API: ${title}`,
      );
      res.status(201).json({ ok: true, task, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    try {
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const id = req.params.id;
      const idx = brain.tasks.findIndex((t) => t.id === id);
      if (idx < 0) throw new Error(`Task not found: ${id}`);
      const updated = { ...brain.tasks[idx], ...req.body, id };
      const tasks = [...brain.tasks];
      tasks[idx] = updated;
      const doc = store.applyBrain(
        { ...brain, tasks },
        `Task updated via API: ${id}`,
      );
      res.json({ ok: true, task: updated, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  /** Agent loop: create/link chat node + set running */
  app.post("/api/tasks/:id/start", (req, res) => {
    try {
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const { brain: next, task, nodeId } = startTaskWork(
        brain,
        req.params.id,
      );
      const doc = store.applyBrain(next, `Agent started task ${req.params.id}`);
      res.json({ ok: true, task, nodeId, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  /** Agent loop: mark done + handoff to next ready */
  app.post("/api/tasks/:id/complete", (req, res) => {
    try {
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const { brain: next, task } = completeTaskWork(brain, req.params.id);
      const doc = store.applyBrain(
        next,
        `Agent completed task ${req.params.id}`,
      );
      res.json({ ok: true, task, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/api/canvas/nodes", (req, res) => {
    try {
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const id = String(req.body.id || `n${Date.now()}`);
      const node = {
        id,
        type: req.body.type || "note",
        title: String(req.body.title || "Node"),
        x: Number(req.body.x || 100),
        y: Number(req.body.y || 100),
        summary: req.body.summary,
        url: req.body.url ? String(req.body.url) : undefined,
      };
      if (
        (node.type === "image" || node.type === "link") &&
        !node.url
      ) {
        throw new Error("url required for image/link nodes");
      }
      const doc = store.applyBrain(
        {
          ...brain,
          canvas: {
            ...brain.canvas,
            nodes: [...brain.canvas.nodes, node],
          },
        },
        `Canvas node added via API: ${node.title}`,
      );
      res.status(201).json({ ok: true, node, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post("/api/canvas/assets", (req, res) => {
    try {
      if (!store.projectPath) throw new Error("No project open");
      const brain = store.getBrain();
      if (!brain) throw new Error("No project open");
      const filename = String(req.body.filename || "upload.png");
      const dataBase64 = String(req.body.dataBase64 || "");
      if (!dataBase64) throw new Error("dataBase64 required");
      const { rel } = saveAssetFromBase64(
        store.projectPath,
        filename,
        dataBase64,
      );
      const id = String(req.body.id || `n${Date.now()}`);
      const node = {
        id,
        type: "image" as const,
        title: String(req.body.title || filename),
        x: Number(req.body.x || 160),
        y: Number(req.body.y || 140),
        summary: req.body.summary
          ? String(req.body.summary)
          : `Asset ${rel}`,
        url: rel,
      };
      const doc = store.applyBrain(
        {
          ...brain,
          canvas: {
            ...brain.canvas,
            nodes: [...brain.canvas.nodes, node],
          },
        },
        `Canvas image uploaded via API: ${node.title}`,
      );
      res.status(201).json({ ok: true, node, path: rel, brain: doc.brain });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  const listen = () =>
    new Promise<Server>((resolve, reject) => {
      const server = app.listen(opts.port, "127.0.0.1", () => resolve(server));
      server.on("error", reject);
    });

  return { app, listen };
}
