import { describe, it, expect } from "bun:test";
import { extractSections, findSection, replaceSection, appendToSection, createSection } from "../../src/utils/markdown.js";

describe("markdown utils", () => {
  const md = `intro
## Section 1
Content 1
## Section 2
Content 2`;

  it("should extract sections correctly", () => {
    const sections = extractSections(md);
    expect(sections.size).toBe(3);
    expect(sections.get("")).toBe("intro\n");
    expect(sections.get("Section 1")).toBe("## Section 1\nContent 1\n");
    expect(sections.get("Section 2")).toBe("## Section 2\nContent 2");
  });

  it("should find an existing section", () => {
    const section = findSection(md, "Section 1");
    expect(section).toBe("## Section 1\nContent 1\n");
  });

  it("should replace section", () => {
    const updated = replaceSection(md, "Section 1", "New Content");
    expect(updated).toContain("New Content");
    expect(updated).not.toContain("Content 1");
  });

  it("should append to section", () => {
    const updated = appendToSection(md, "Section 1", "Appended");
    expect(updated).toContain("Content 1");
    expect(updated).toContain("Appended");
  });

  it("should create section", () => {
    const section = createSection("New Section", "Data");
    expect(section).toBe("## New Section\n\nData\n");
  });
});
