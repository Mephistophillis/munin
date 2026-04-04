import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { applyPatchBatch } from "../../src/core/updater.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";

const agentsContent = `
## External Memory
- Memory Repo: minimal-memory-local
`;

let tempDir = "";
let repoPath = "";

describe("e2e-smoke test", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-e2e-smoke-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("init -> update -> index", async () => {
    const config = parseAgentsConfig(agentsContent);
    config.externalMemory.localPath = "smoke-memory";
    
    // Init
    await initMemoryRepo(config, tempDir, "smokeproj", { dryRun: false });
    repoPath = path.resolve(tempDir, "smoke-memory");
    
    // Update
    const patch = { file: "active-context.md", section: "Recent Changes", action: "append" as const, content: "Test append" };
    await applyPatchBatch(repoPath, [patch]);
    
    // Assert
    const content = await fs.readFile(path.join(repoPath, "active-context.md"), "utf8");
    expect(content).toContain("Test append");

    const indexContent = await fs.readFile(path.join(repoPath, "_INDEX.md"), "utf8");
    expect(indexContent).toContain("active-context.md");
  });
});
