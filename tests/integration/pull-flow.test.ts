import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import { init, status, getAheadBehind } from "../../src/git/git-ops.js";

describe("pull-flow integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "munin-pull-test-"));
    init(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("status should return correct types", () => {
    const s = status(tmpDir);
    expect(s).toHaveProperty("clean");
    expect(s.clean).toBeDefined();
    expect(s.staged).toBeInstanceOf(Array);
    expect(s.conflicted).toBeInstanceOf(Array);
  });
  
  it("aheadBehind should return object", () => {
     const res = getAheadBehind(tmpDir);
     expect(res.ahead).toBeGreaterThanOrEqual(0);
     expect(res.behind).toBeGreaterThanOrEqual(0);
  });
});
