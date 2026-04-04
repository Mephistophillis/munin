import { describe, it, expect } from "bun:test";
import { parseTextInput } from "../../src/core/updater.js";

describe("updater - text parsing", () => {
  it("should parse inline markers", () => {
    const text = `
[file: active-context.md]
[section: Recent Changes]
[action: append]
- New change
    `;
    const patches = parseTextInput(text);
    expect(patches.length).toBe(1);
    expect(patches[0].file).toBe("active-context.md");
    expect(patches[0].section).toBe("Recent Changes");
    expect(patches[0].action).toBe("append");
    expect(patches[0].content).toBe("- New change");
  });

  it("should split multiple blocks", () => {
    const text = `
[file: active-context.md]
[section: Recent Changes]
[action: append]
- Change 1

[file: decisions.md]
[section: Log]
[action: replace]
- Replace 2
    `;
    const patches = parseTextInput(text);
    expect(patches.length).toBe(2);
    expect(patches[1].file).toBe("decisions.md");
    expect(patches[1].action).toBe("replace");
  });

  it("should apply defaults if no markers", () => {
    const text = `Just a simple change`;
    const patches = parseTextInput(text);
    expect(patches.length).toBe(1);
    expect(patches[0].file).toBe("active-context.md");
    expect(patches[0].section).toBe("Recent Changes");
    expect(patches[0].action).toBe("append");
    expect(patches[0].content).toBe("Just a simple change");
  });
});
