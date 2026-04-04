import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";
import { scanForSecrets } from "../../src/core/secret-scanner.js";

const minimalAgents = `
## External Memory
- Memory Repo: minimal-memory-local
`;

let tempDir = "";
let repoPath = "";

describe("commit-flow tests", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-test-com-"));
    const config = parseAgentsConfig(minimalAgents);
    config.externalMemory.localPath = "test-memory";
    await initMemoryRepo(config, tempDir, "testproj", { dryRun: false });
    repoPath = path.resolve(tempDir, "test-memory");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should detect secrets before commit", async () => {
    // Write an API key in a file
    await fs.writeFile(path.join(repoPath, "tasks.md"), "Here is my api_key=sk-123", "utf8");
    const scan = await scanForSecrets(repoPath);
    expect(scan.found).toBe(true);
    expect(scan.issues[0].pattern).toBe("api_key");
  });

  it("should not detect secrets in INDEX", async () => {
    // Write an API key in a file
    await fs.appendFile(path.join(repoPath, "_INDEX.md"), "\napi_key", "utf8");
    const scan = await scanForSecrets(repoPath);
    expect(scan.found).toBe(false);
  });
});
