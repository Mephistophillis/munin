import * as yaml from "yaml";
import type { Frontmatter } from "../types/memory.js";

export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  
  if (!match) {
    throw new Error("Invalid or missing frontmatter");
  }

  const [, yamlString, body] = match;
  
  try {
    const parsed = yaml.parse(yamlString);
    const frontmatter = validateFrontmatter(parsed);
    return { frontmatter, body };
  } catch (err: any) {
    throw new Error(`Failed to parse frontmatter: ${err.message}`);
  }
}

export function serializeFrontmatter(frontmatter: Frontmatter | Record<string, unknown>, body: string): string {
  const yamlString = yaml.stringify(frontmatter);
  return `---\n${yamlString}---\n${body}`;
}

export function validateFrontmatter(data: any): Frontmatter {
  if (!data || typeof data !== "object") {
    throw new Error("Frontmatter must be an object");
  }

  const requiredFields = ["memory-type", "project", "confidence", "last-verified", "created", "modified"];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const validMemoryTypes = [
    "project-architecture", "workflow", "debugging-tip", "user-preference",
    "codebase-pattern", "decision", "session", "retro", "snapshot", "index"
  ];
  
  if (!validMemoryTypes.includes(data["memory-type"])) {
    throw new Error(`Invalid memory-type: ${data["memory-type"]}`);
  }

  if (data["memory-type"] !== "index") {
    const validConfidences = ["high", "medium", "low"];
    if (!validConfidences.includes(data.confidence)) {
      throw new Error(`Invalid confidence: ${data.confidence}`);
    }
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data["last-verified"] && !dateRegex.test(data["last-verified"]) && !data["last-verified"].includes("T")) {
     // permissive check
  }

  return data as Frontmatter;
}
