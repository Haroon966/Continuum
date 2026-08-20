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
});
