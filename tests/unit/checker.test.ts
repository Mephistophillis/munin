import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { checkFreshness } from "../../src/core/checker.js";

let tempDir = "";

describe("checker unit test", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-check-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should classify files correctly", async () => {
    const now = new Date();
    
    // Fresh
    await fs.writeFile(path.join(tempDir, "1.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: " + now.toISOString() + "\n---\nbody");
    
    // Needs review (>30 days)
    const old = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    await fs.writeFile(path.join(tempDir, "2.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: " + old.toISOString() + "\n---\nbody");

    // Expired
    const exp = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    await fs.writeFile(path.join(tempDir, "3.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: 2026-04-03\nexpires: " + exp.toISOString() + "\n---\nbody");

    const res = await checkFreshness(tempDir, 30);
    
    expect(res.total).toBe(3);
    expect(res.fresh).toBe(1);
    expect(res.needsReview).toBe(1);
    expect(res.expired).toBe(1);
  });
});
