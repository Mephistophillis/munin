import { test, expect, beforeAll, afterAll } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { initMemoryRepo } from "../../src/core/memory-repo.js";
import { applyPatchBatch } from "../../src/core/updater.js";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";
import type { JsonPatch } from "../../src/types/cli.js";

let tempDir = "";
let repoPath = "";

test.skipIf(!process.env.PERF_TEST)("batch patching 50 items < 2.5s", async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "munin-load-"));
  const config = parseAgentsConfig(`\n## External Memory\n- Memory Repo: none\n`);
  config.externalMemory.localPath = "load-memory";
  
  await initMemoryRepo(config, tempDir, "loadproj", { dryRun: false });
  repoPath = path.resolve(tempDir, "load-memory");

  const patches: JsonPatch[] = [];
  for (let i = 0; i < 50; i++) {
     patches.push({
        file: "active-context.md",
        section: "Recent Changes",
        action: "append",
        content: `Change ${i}`
     });
  }

  const start = performance.now();
  await applyPatchBatch(repoPath, patches);
  const elapsed = performance.now() - start;

  expect(elapsed).toBeLessThan(2500);
  
  await fs.rm(tempDir, { recursive: true, force: true });
});
