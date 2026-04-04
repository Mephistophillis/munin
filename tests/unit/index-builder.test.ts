import { describe, it, expect } from "bun:test";
import { generateIndexEntry } from "../../src/core/index-builder.js";

describe("index-builder", () => {
  it("should generate proper entry with H1 and hook", () => {
    const content = `# Project Overview
Welcome to the project.
This is test.`;
    const entry = generateIndexEntry("overview.md", content);
    expect(entry).toBe("- [Project Overview](overview.md) — Welcome to the project.");
  });

  it("should fallback to filename if no H1", () => {
    const content = `Welcome to the project.
This is test.`;
    const entry = generateIndexEntry("overview.md", content);
    expect(entry).toBe("- [overview.md](overview.md) — Welcome to the project.");
  });

  it("should truncate long lines", () => {
    const hook = "A".repeat(200);
    const content = `# Long\n${hook}`;
    const entry = generateIndexEntry("long.md", content);
    expect(entry.length).toBeLessThanOrEqual(150);
    expect(entry).toContain("...");
  });
});
