import { describe, it, expect } from "bun:test";
import { parseFrontmatter, serializeFrontmatter } from "../../src/core/frontmatter.js";
import type { Frontmatter } from "../../src/types/memory.js";

describe("frontmatter", () => {
  const validYaml = `---
memory-type: workflow
project: munin
confidence: high
last-verified: 2026-04-03
created: 2026-04-03T00:00:00Z
modified: 2026-04-03T00:00:00Z
---
# Content`;

  it("should parse valid frontmatter", () => {
    const { frontmatter, body } = parseFrontmatter(validYaml);
    expect(frontmatter["memory-type"]).toBe("workflow");
    expect(body.trim()).toBe("# Content");
  });

  it("should serialize frontmatter", () => {
    const fm: Frontmatter = {
      "memory-type": "workflow",
      project: "munin",
      confidence: "high",
      "last-verified": "2026-04-03",
      created: "2026-04-03T00:00:00Z",
      modified: "2026-04-03T00:00:00Z",
    };
    const serialized = serializeFrontmatter(fm, "# Content");
    expect(serialized).toContain("memory-type: workflow");
    expect(serialized).toContain("---");
    expect(serialized).toContain("# Content");
  });

  it("should throw error on missing required field", () => {
    const invalidYaml = `---
memory-type: workflow
---
Body`;
    expect(() => parseFrontmatter(invalidYaml)).toThrow(/Missing required field/);
  });
});
