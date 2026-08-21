import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { ProjectStore } from "../electron/project";
import { createApiServer } from "../electron/api";

describe("local curl API", () => {
  const store = new ProjectStore();
  let server: Server;
  let port = 0;
  const token = "test-token";
  let folder = "";

  beforeAll(async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "continuum-"));
    await store.openProject(folder);
    const api = createApiServer(store, { port: 0, token });
    // listen on ephemeral: express listen(0)
    server = await new Promise<Server>((resolve, reject) => {
      const s = api.app.listen(0, "127.0.0.1", () => resolve(s));
      s.on("error", reject);
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    port = addr.port;
  });

  afterAll(async () => {
    await store.closeProject();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it("GET /api/context returns brain", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/context`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { brain: { goal: string } };
    expect(json.brain.goal.length).toBeGreaterThan(0);
  });

  it("PATCH handoff and POST task", async () => {
    const patch = await fetch(`http://127.0.0.1:${port}/api/context`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ handoff: "Next: verify API" }),
    });
    expect(patch.status).toBe(200);

    const created = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "API task", status: "ready" }),
    });
    expect(created.status).toBe(201);

    const file = fs.readFileSync(path.join(folder, "CONTINUUM.md"), "utf8");
    expect(file).toContain("Next: verify API");
    expect(file).toContain("API task");
  });

  it("POST canvas link + asset", async () => {
    const link = await fetch(`http://127.0.0.1:${port}/api/canvas/nodes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "link",
        title: "Example",
        url: "https://example.com",
        x: 12,
        y: 34,
      }),
    });
    expect(link.status).toBe(201);

    const tinyPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const asset = await fetch(`http://127.0.0.1:${port}/api/canvas/assets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: "dot.png",
        dataBase64: tinyPng,
        title: "Dot",
      }),
    });
    expect(asset.status).toBe(201);
    const json = (await asset.json()) as { path: string };
    expect(json.path).toContain(".continuum/assets/");
    expect(fs.existsSync(path.join(folder, json.path))).toBe(true);

    const file = fs.readFileSync(path.join(folder, "CONTINUUM.md"), "utf8");
    expect(file).toContain("https://example.com");
    expect(file).toContain("type=image");
  });

  it("agent loop start + complete", async () => {
    const created = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Loop me", status: "ready", id: "tloop" }),
    });
    expect(created.status).toBe(201);

    const start = await fetch(
      `http://127.0.0.1:${port}/api/tasks/tloop/start`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(start.status).toBe(200);
    const started = (await start.json()) as {
      task: { status: string; link: string };
      nodeId: string;
    };
    expect(started.task.status).toBe("running");
    expect(started.nodeId).toBeTruthy();
    expect(started.task.link).toBe(started.nodeId);

    const done = await fetch(
      `http://127.0.0.1:${port}/api/tasks/tloop/complete`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(done.status).toBe(200);
    const finished = (await done.json()) as { task: { status: string } };
    expect(finished.task.status).toBe("done");
  });
});
