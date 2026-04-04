import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { JsonPatch, UpdateAction, UpdateResult } from "../types/cli.js";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { appendToSection, replaceSection, createSection } from "../utils/markdown.js";
import { updateIndex } from "./index-builder.js";

export async function applyPatch(memoryRepoPath: string, patch: JsonPatch): Promise<{ filesModified: string[], sectionsChanged: string[] }> {
  if (!patch.file || !patch.section || !patch.action || !patch.content) {
    throw new Error(`Invalid patch payload: missing required fields`);
  }

  const p = path.join(memoryRepoPath, patch.file);
  let raw = "";
  try {
    raw = await fs.readFile(p, "utf8");
  } catch {
    throw new Error(`FILE_NOT_FOUND: ${patch.file}`);
  }

  const { frontmatter, body } = parseFrontmatter(raw);
  let newBody = body;

  const contentBlock = patch.content;

  if (patch.action === "append") {
    newBody = appendToSection(newBody, patch.section, contentBlock);
  } else if (patch.action === "replace") {
    newBody = replaceSection(newBody, patch.section, contentBlock);
  } else {
    throw new Error(`Unsupported action: ${patch.action}`);
  }

  frontmatter.modified = new Date().toISOString();
  const newRaw = serializeFrontmatter(frontmatter, newBody);

  await fs.writeFile(p, newRaw, "utf8");

  return { filesModified: [patch.file], sectionsChanged: [patch.section] };
}

export async function applyPatchBatch(memoryRepoPath: string, patches: JsonPatch[]): Promise<UpdateResult> {
  // Snapshot for rollback
  const snapshot = new Map<string, string>();
  const uniqueFiles = [...new Set(patches.map(p => p.file))];

  for (const file of uniqueFiles) {
    const p = path.join(memoryRepoPath, file);
    try {
      snapshot.set(file, await fs.readFile(p, "utf8"));
    } catch {
      // file might not exist, handled inside applyPatch
    }
  }

  const filesModified = new Set<string>();
  const sectionsChanged = new Set<string>();

  try {
    for (const patch of patches) {
      const res = await applyPatch(memoryRepoPath, patch);
      res.filesModified.forEach(f => filesModified.add(f));
      res.sectionsChanged.forEach(s => sectionsChanged.add(s));
    }
  } catch (err: any) {
    // Rollback
    for (const [file, originalContent] of snapshot.entries()) {
      await fs.writeFile(path.join(memoryRepoPath, file), originalContent, "utf8");
    }
    throw err;
  }

  const modifiedList = Array.from(filesModified);
  const indexUpdated = await updateIndex(memoryRepoPath, modifiedList);

  return {
    filesModified: modifiedList,
    sectionsChanged: Array.from(sectionsChanged),
    indexUpdated,
    staged: false
  };
}

export function parseTextInput(text: string): JsonPatch[] {
  if (!text || !text.trim()) {
    return [];
  }

  const lines = text.split(/\r?\n/);
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  const patches: JsonPatch[] = [];

  for (const block of blocks) {
    const meta: Record<string, string> = {
      file: "active-context.md",
      section: "Recent Changes",
      action: "append"
    };

    const contentLines: string[] = [];

    for (const line of block) {
      const metaMatch = line.match(/^\[(file|section|action):\s*(.+)\]$/);
      if (metaMatch) {
         meta[metaMatch[1]] = metaMatch[2].trim();
      } else {
         contentLines.push(line);
      }
    }

    if (contentLines.length > 0) {
      patches.push({
        file: meta.file,
        section: meta.section,
        action: meta.action as UpdateAction,
        content: contentLines.join("\n")
      });
    }
  }

  return patches;
}
