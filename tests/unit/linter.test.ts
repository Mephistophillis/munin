import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { lintMemoryRepo } from "../../src/core/linter.js";

let tempDir = "";
const mockConfig = {
  ignore: [], staleThresholdDays: 90, maxIndexLines: 100, maxIndexLineLength: 150, secretPatterns: []
};

describe("linter unit tests", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-lint-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should warn if required files are missing", async () => {
    // Empty directory
    const res = await lintMemoryRepo(tempDir, mockConfig);
    const rules = res.results.map(r => r.rule);
    expect(rules).toContain("required-files");
    expect(rules).toContain("index-exists");
  });

  it("should validate frontmatter", async () => {
    await fs.writeFile(path.join(tempDir, "test.md"), "no frontmatter here");
    const res = await lintMemoryRepo(tempDir, mockConfig);
    expect(res.results.some(r => r.rule === "frontmatter-required")).toBe(true);
  });

  it("should catch invalid dates", async () => {
    await fs.writeFile(path.join(tempDir, "test.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: 12-34\n---\nbody");
    const res = await lintMemoryRepo(tempDir, mockConfig);
    expect(res.results.some(r => r.rule === "date-format")).toBe(true);
  });
});
