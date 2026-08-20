import express from "express";
import cors from "cors";
import type { Server } from "node:http";
import type { ProjectStore } from "./project";
import type { ContinuumBrain, Task, TaskStatus } from "../shared/types";

export function createApiServer(
  store: ProjectStore,
  opts: { port: number; token: string },
): { app: express.Express; listen: () => Promise<Server> } {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

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
      };
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

  const listen = () =>
    new Promise<Server>((resolve, reject) => {
      const server = app.listen(opts.port, "127.0.0.1", () => resolve(server));
      server.on("error", reject);
    });

  return { app, listen };
}
