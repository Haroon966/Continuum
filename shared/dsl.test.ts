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

  it("round-trips image and link canvas nodes with url", () => {
    const md = createTemplateMarkdown("Assets");
    const doc = parseContinuumMarkdown(md);
    const withMedia = {
      ...doc.brain,
      canvas: {
        nodes: [
          ...doc.brain.canvas.nodes,
          {
            id: "img1",
            type: "image" as const,
            title: "Shot",
            x: 10,
            y: 20,
            url: ".continuum/assets/a1-my shot.png",
            summary: "UI shot",
          },
          {
            id: "lnk1",
            type: "link" as const,
            title: "Docs",
            x: 40,
            y: 50,
            url: "https://example.com/docs?x=1&y=2",
          },
        ],
        edges: doc.brain.canvas.edges,
      },
    };
    const written = writeBrainIntoMarkdown(md, withMedia);
    expect(written).toMatch(/^\s+url: \.continuum\/assets\/a1-my shot\.png$/m);
    const again = parseContinuumMarkdown(written);
    expect(again.parseErrors).toEqual([]);
    const img = again.brain.canvas.nodes.find((n) => n.id === "img1");
    const lnk = again.brain.canvas.nodes.find((n) => n.id === "lnk1");
    expect(img?.type).toBe("image");
    expect(img?.url).toBe(".continuum/assets/a1-my shot.png");
    expect(lnk?.type).toBe("link");
    expect(lnk?.url).toBe("https://example.com/docs?x=1&y=2");
  });
});
