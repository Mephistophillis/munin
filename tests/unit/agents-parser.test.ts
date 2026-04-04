import { describe, it, expect } from "bun:test";
import { parseAgentsConfig } from "../../src/core/agents-parser.js";

describe("agents-parser", () => {
  it("should parse a valid complete AGENTS.md", async () => {
    const file = Bun.file("tests/fixtures/valid-agents.md");
    const content = await file.text();
    const config = parseAgentsConfig(content);
    
    expect(config.externalMemory.memoryRepo).toBe("git@github.com:testorg/test-memory.git");
    expect(config.externalMemory.localPath).toBe("../test-memory");
    expect(config.externalMemory.mode).toBe("direct");
    expect(config.requiredReads).toEqual(["project-brief.md", "active-context.md", "decisions.md"]);
    expect(config.updateTriggers).toEqual(["start of work", "architecture decisions"]);
    expect(config.commitPolicy).toEqual(["memory: update after <task>"]);
    expect(config.forbiddenActions).toEqual(["Delete historical files"]);
  });

  it("should parse a minimal AGENTS.md and fill defaults", async () => {
    const file = Bun.file("tests/fixtures/minimal-agents.md");
    const content = await file.text();
    const config = parseAgentsConfig(content);
    
    expect(config.externalMemory.memoryRepo).toBe("minimal-memory-local");
    expect(config.externalMemory.localPath).toBe("../minimal-memory-local"); // derived
    expect(config.externalMemory.mode).toBe("direct"); // default
    expect(config.requiredReads.length).toBe(5); // defaults
  });

  it("should throw on missing External Memory section", async () => {
    const file = Bun.file("tests/fixtures/invalid-agents.md");
    const content = await file.text();
    expect(() => parseAgentsConfig(content)).toThrow(/'## External Memory' not found/);
  });
});
