import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";
// Simple mock for CLI execution instead of actual spawn because CLI exit codes kill the process during tests
// but here we just test we can read files physically created. 
// A real integration suite for CLI outputs would wrap execa or bun spawn.

const agentsContent = `
## External Memory
- Memory Repo: minimal-memory-local
`;

let tempDir = "";
let repoPath = "";

describe("read-flow tests", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-read-"));
    const config = parseAgentsConfig(agentsContent);
    config.externalMemory.localPath = "read-memory";
    await initMemoryRepo(config, tempDir, "readproj", { dryRun: false });
    repoPath = path.resolve(tempDir, "read-memory");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should have generated mvp files ready for reading", async () => {
    const list = await fs.readdir(repoPath);
    expect(list).toContain("project-brief.md");
    expect(list).toContain("active-context.md");
    expect(list).toContain("tasks.md");
  });

  it("should read frontmatter explicitly", async () => {
    const raw = await fs.readFile(path.join(repoPath, "project-brief.md"), "utf8");
    expect(raw).toContain("memory-type: project-architecture");
  });
});
