import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { checkFreshness } from "../../src/core/checker.js";

let tempDir = "";

describe("check-flow tests", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-checkflow-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should output zero needs-review on fresh files", async () => {
     await fs.writeFile(path.join(tempDir, "fresh.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: " + new Date().toISOString() + "\n---\nOk");
     const res = await checkFreshness(tempDir, 30);
     expect(res.needsReview).toBe(0);
     expect(res.fresh).toBe(1);
  });

  it("should trigger needs-review natively", async () => {
     const staleDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
     await fs.writeFile(path.join(tempDir, "stale.md"), "---\nmemory-type: project-architecture\nproject: munin\nconfidence: high\ncreated: 2026-04-03\nmodified: 2026-04-03\nlast-verified: " + staleDate.toISOString() + "\n---\nStale");
     const res = await checkFreshness(tempDir, 30);
     expect(res.needsReview).toBe(1);
  });
});
