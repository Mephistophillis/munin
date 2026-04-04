import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { isRepo } from "../../src/git/git-ops.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";

const minimalAgents = `
## External Memory
- Memory Repo: minimal-memory-local
`;

let tempDir = "";

describe("init-flow integration", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should create local memory repo", async () => {
    const config = parseAgentsConfig(minimalAgents);
    // Overwrite localPath to point inside tempDir
    config.externalMemory.localPath = "test-memory";
    
    const result = await initMemoryRepo(config, tempDir, "testproject", { dryRun: false });
    
    expect(result.filesCreated.length).toBeGreaterThan(0);
    const repoPath = path.resolve(tempDir, "test-memory");
    
    const repoExists = isRepo(repoPath);
    expect(repoExists).toBe(true);

    const indexContent = await fs.readFile(path.join(repoPath, "_INDEX.md"), "utf8");
    expect(indexContent).toContain("testproject");
  });

  it("should be a dry run", async () => {
    const config = parseAgentsConfig(minimalAgents);
    config.externalMemory.localPath = "test-memory-dry";
    
    const result = await initMemoryRepo(config, tempDir, "testproject", { dryRun: true });
    
    expect(result.commitHash).toBe("dry-run");
    const repoPath = path.resolve(tempDir, "test-memory-dry");
    
    let exists = false;
    try {
       await fs.stat(repoPath);
       exists = true;
    } catch {}
    
    expect(exists).toBe(false);
  });
});
