import { describe, expect, it } from "vitest";
import { emptyBrain } from "./dsl";
import { completeTaskWork, startTaskWork } from "./agentLoop";

describe("agentLoop", () => {
  it("start creates chat, links task, sets running", () => {
    const brain = emptyBrain();
    brain.tasks = [
      { id: "t1", title: "Ship loop", status: "ready", priority: "high" },
    ];
    const { brain: next, nodeId, task } = startTaskWork(brain, "t1");
    expect(task.status).toBe("running");
    expect(task.link).toBe(nodeId);
    const node = next.canvas.nodes.find((n) => n.id === nodeId);
    expect(node?.type).toBe("chat");
    expect(node?.title).toBe("Ship loop");
    expect(next.handoff).toContain("t1");
  });

  it("start reuses existing linked chat", () => {
    const brain = emptyBrain();
    brain.canvas.nodes = [
      {
        id: "n9",
        type: "chat",
        title: "Existing",
        x: 0,
        y: 0,
      },
    ];
    brain.tasks = [
      {
        id: "t1",
        title: "Reuse",
        status: "ready",
        link: "n9",
      },
    ];
    const { brain: next, nodeId } = startTaskWork(brain, "t1");
    expect(nodeId).toBe("n9");
    expect(next.canvas.nodes).toHaveLength(1);
  });

  it("complete marks done and points handoff at next ready", () => {
    const brain = emptyBrain();
    brain.tasks = [
      { id: "t1", title: "A", status: "running", link: "n1" },
      { id: "t2", title: "B", status: "ready" },
    ];
    const { brain: next, task } = completeTaskWork(brain, "t1");
    expect(task.status).toBe("done");
    expect(next.handoff).toContain("t2");
  });
});
