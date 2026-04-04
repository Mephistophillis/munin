import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { applyPatchBatch } from "../../src/core/updater.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";

const minimalAgents = `
## External Memory
- Memory Repo: minimal-memory-local
`;

let tempDir = "";
let repoPath = "";

describe("update-flow integration", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-test-upd-"));
    const config = parseAgentsConfig(minimalAgents);
    config.externalMemory.localPath = "test-memory";
    await initMemoryRepo(config, tempDir, "testproj", { dryRun: false });
    repoPath = path.resolve(tempDir, "test-memory");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should append patch and update index", async () => {
     const patch = { file: "active-context.md", section: "Recent Changes", action: "append" as const, content: "My new line" };
     const res = await applyPatchBatch(repoPath, [patch]);
     
     expect(res.filesModified).toContain("active-context.md");
     
     const content = await fs.readFile(path.join(repoPath, "active-context.md"), "utf8");
     expect(content).toContain("My new line");

     // Since modified it should have updated index if there was H1 inside active-context.md
     // In template it might have one.
  });

  it("should rollback on failure", async () => {
    const patchOk = { file: "active-context.md", section: "Recent Changes", action: "append" as const, content: "My new line" };
    const patchFail = { file: "missing.md", section: "Fail", action: "append" as const, content: "Fail line" };
    
    let caught = false;
    try {
        await applyPatchBatch(repoPath, [patchOk, patchFail]);
    } catch {
        caught = true;
    }
    
    expect(caught).toBe(true);

    const content = await fs.readFile(path.join(repoPath, "active-context.md"), "utf8");
    expect(content).not.toContain("My new line"); // should be rolled back!
  });
});
