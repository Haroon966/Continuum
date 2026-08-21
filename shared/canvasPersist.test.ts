import { describe, expect, it } from "vitest";
import { emptyBrain } from "./dsl";
import { mergeCanvasFromFlow } from "./canvasPersist";

describe("mergeCanvasFromFlow", () => {
  it("skips wipe when flow empty but brain has nodes", () => {
    const brain = emptyBrain();
    brain.canvas.nodes = [
      { id: "n1", type: "chat", title: "Keep", x: 10, y: 20 },
    ];
    expect(mergeCanvasFromFlow(brain, [], [])).toBeNull();
  });

  it("updates positions from flow without dropping siblings", () => {
    const brain = emptyBrain();
    brain.canvas.nodes = [
      { id: "n1", type: "chat", title: "A", x: 0, y: 0 },
      { id: "n2", type: "note", title: "B", x: 50, y: 50 },
    ];
    const next = mergeCanvasFromFlow(
      brain,
      [{ id: "n1", position: { x: 99, y: 88 }, data: { title: "A", kind: "chat" } }],
      [{ id: "e1", source: "n1", target: "n2", label: "link" }],
    );
    expect(next).not.toBeNull();
    expect(next!.nodes).toHaveLength(2);
    expect(next!.nodes.find((n) => n.id === "n1")?.x).toBe(99);
    expect(next!.nodes.find((n) => n.id === "n2")?.title).toBe("B");
    expect(next!.edges[0]?.label).toBe("link");
  });
});
