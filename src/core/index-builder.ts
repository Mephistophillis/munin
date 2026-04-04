import * as path from "node:path";
import * as fs from "node:fs/promises";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";

export async function updateIndex(memoryRepoPath: string, modifiedFiles: string[]): Promise<boolean> {
  if (modifiedFiles.length === 0) return false;
  
  const indexPath = path.join(memoryRepoPath, "_INDEX.md");
  let indexContent = "";
  let frontmatter: any = null;

  try {
    const raw = await fs.readFile(indexPath, "utf8");
    const parsed = parseFrontmatter(raw);
    indexContent = parsed.body;
    frontmatter = parsed.frontmatter;
  } catch (err) {
    // _INDEX.md missing or broken
    return rebuildFullIndex(memoryRepoPath);
  }

  const newEntries = new Map<string, string>();
  for (const file of modifiedFiles) {
    if (file === "_INDEX.md") continue;
    try {
      const p = path.join(memoryRepoPath, file);
      const content = await fs.readFile(p, "utf8");
      const { body } = parseFrontmatter(content);
      const entry = generateIndexEntry(file, body);
      newEntries.set(file, entry);
    } catch {}
  }

  if (newEntries.size === 0) return false;

  let lines = indexContent.split(/\r?\n/);
  const entryRegex = /^- \[([^\]]+)\]\(([^)]+)\) —/;
  
  const updatedLines: string[] = [];
  const existingFiles = new Set<string>();

  for (const line of lines) {
    const match = line.match(entryRegex);
    if (match) {
      const file = match[2];
      if (newEntries.has(file)) {
        updatedLines.push(newEntries.get(file)!);
      } else {
        updatedLines.push(line);
      }
      existingFiles.add(file);
    } else {
      updatedLines.push(line);
    }
  }

  for (const [file, entry] of newEntries.entries()) {
    if (!existingFiles.has(file)) {
      if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
        updatedLines.push("");
      }
      updatedLines.push(entry);
    }
  }

  const entriesOnlyCount = updatedLines.filter(l => l.startsWith("- [")).length;
  if (entriesOnlyCount > 100) {
    return false;
  }

  indexContent = updatedLines.join("\n");
  frontmatter.modified = new Date().toISOString();
  
  await fs.writeFile(indexPath, serializeFrontmatter(frontmatter, indexContent), "utf8");
  return true;
}

export function generateIndexEntry(filePath: string, content: string): string {
  const lines = content.split(/\r?\n/).map(l => l.trim());
  let title = filePath;
  let hook = "";

  const rootH1Index = lines.findIndex(l => l.startsWith("# "));
  if (rootH1Index !== -1) {
    title = lines[rootH1Index].substring(2).trim();
    for (let i = rootH1Index + 1; i < lines.length; i++) {
      if (lines[i] && !lines[i].startsWith("#")) {
        hook = lines[i];
        break;
      }
    }
  } else {
    for (const line of lines) {
      if (line && !line.startsWith("#")) {
        hook = line;
        break;
      }
    }
  }

  let entry = `- [${title}](${filePath})`;
  if (hook) {
    entry += ` — ${hook}`;
  }

  if (entry.length > 150) {
    entry = entry.substring(0, 147) + "...";
  }

  return entry;
}

export async function rebuildFullIndex(memoryRepoPath: string): Promise<boolean> {
  try {
    const dir = await fs.readdir(memoryRepoPath);
    const mdFiles = dir.filter(f => f.endsWith(".md") && f !== "_INDEX.md");

    const entries: string[] = [];
    for (const file of mdFiles) {
      const p = path.join(memoryRepoPath, file);
      try {
        const raw = await fs.readFile(p, "utf8");
        const { body } = parseFrontmatter(raw);
        entries.push(generateIndexEntry(file, body));
      } catch {}
    }

    const folderName = path.basename(path.resolve(memoryRepoPath));

    const frontmatter = {
      "memory-type": "index",
      "memory-scope": folderName,
      "max-lines": 100,
      "max-line-length": 150,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    const content = `# Index: ${folderName}\n\n` + entries.join("\n") + "\n";
    const indexPath = path.join(memoryRepoPath, "_INDEX.md");

    await fs.writeFile(indexPath, serializeFrontmatter(frontmatter, content), "utf8");
    return true;
  } catch (err) {
    return false;
  }
}
