import { describe, expect, it } from "vitest";
import {
  createTemplateMarkdown,
  parseContinuumMarkdown,
  writeBrainIntoMarkdown,
} from "../shared/dsl";

describe("continuum dsl", () => {
  it("round-trips template brain", () => {
    const md = createTemplateMarkdown("Demo");
    const doc = parseContinuumMarkdown(md);
    expect(doc.parseErrors).toEqual([]);
    expect(doc.brain.goal).toContain("Demo");
    expect(doc.brain.tasks.length).toBeGreaterThan(0);
    expect(doc.brain.canvas.nodes[0]?.type).toBe("chat");

    const next = {
      ...doc.brain,
      handoff: "Do the thing",
      tasks: doc.brain.tasks.map((t, i) =>
        i === 0 ? { ...t, status: "done" as const } : t,
      ),
    };
    const written = writeBrainIntoMarkdown(md, next);
    const again = parseContinuumMarkdown(written);
    expect(again.brain.handoff).toBe("Do the thing");
    expect(again.brain.tasks[0]?.status).toBe("done");
  });
});
