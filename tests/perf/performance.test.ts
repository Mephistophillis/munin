import { test, expect, beforeAll, afterAll } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";

let tempDir = "";
let repoPath = "";

const agentsContent = `
## External Memory
- Memory Repo: https://github.com/mock/repo.git
`;

test.skipIf(!process.env.PERF_TEST)("init with 100+ files < 2s", async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-perf-"));
  const config = parseAgentsConfig(agentsContent);
  config.externalMemory.localPath = "perf-memory";
  
  const start = performance.now();
  await initMemoryRepo(config, tempDir, "perfproj", { dryRun: false });
  repoPath = path.resolve(tempDir, "perf-memory");

  // Create 100+ files to simulate a large repo
  for (let i = 0; i < 100; i++) {
     await fs.writeFile(path.join(repoPath, `session-${i}.md`), "Fake content");
  }

  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThan(2000);
});

test.skipIf(!process.env.PERF_TEST)("cleanup", async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
