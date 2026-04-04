import * as fs from "node:fs/promises";
import { type Dirent } from "node:fs";
import * as path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import { scanForSecrets } from "./secret-scanner.js";
import type { LintConfig } from "../utils/config.js";
import type { LintResult, LintIssue } from "../types/cli.js";

export async function lintMemoryRepo(memoryRepoPath: string, config: LintConfig): Promise<LintResult> {
  const issues: LintIssue[] = [];

  const addIssue = (rule: string, level: "error" | "warning", file: string, message: string) => {
    issues.push({ rule, level, file, message });
  };

  let allFiles: Dirent[] = [];
  try {
    allFiles = await fs.readdir(memoryRepoPath, { withFileTypes: true, recursive: true });
  } catch {
    return { errors: 1, warnings: 0, results: [{ rule: "system", level: "error", file: memoryRepoPath, message: "Failed to read repository" }] };
  }

  // Very basic ignore implementation. Real implementation would use picomatch/glob
  const ignorePatterns = config.ignore.map(ign => new RegExp(ign.replace(/\*/g, ".*")));
  const isIgnored = (f: string) => ignorePatterns.some(ign => ign.test(f));

  const rootFiles = new Set<string>();
  const allMdFiles: string[] = [];
  
  for (const f of allFiles) {
     const parentPath = (f as { path?: string; parentPath?: string }).path || (f as { path?: string; parentPath?: string }).parentPath || "";
     const fullPath = path.join(parentPath, f.name);
     const rel = path.relative(memoryRepoPath, fullPath).replace(/\\/g, "/");
     
     // Skip .git and anything in it
     if (rel === ".git" || rel.startsWith(".git/")) continue;
     
     if (isIgnored(rel)) continue;

     if (rel.includes("/")) {
       // It's in subdirectory
     } else {
       if (f.isFile()) rootFiles.add(f.name);
     }
     
     if (f.isFile() && f.name.endsWith(".md")) {
       allMdFiles.push(rel);
     }

     // 11. no-binary
     if (f.isFile()) {
       const isAllowedExt = [".md", ".json", ".txt", ".yml", ".yaml"].some(ext => f.name.toLowerCase().endsWith(ext));
       const isSpecialFile = [".gitignore", ".gitattributes", "LICENSE"].includes(f.name);
       
       if (!isAllowedExt && !isSpecialFile && !f.name.startsWith(".")) {
         addIssue("no-binary", "error", rel, `Binary or unsupported file type: ${f.name}`);
       }
     }
  }

  // 1. required-files
  const mvp = ["project-brief.md", "active-context.md", "decisions.md", "tasks.md", "progress.md"];
  for (const m of mvp) {
    if (!rootFiles.has(m)) addIssue("required-files", "error", m, `Missing required MVP file: ${m}`);
  }

  // 8. index-exists
  if (!rootFiles.has("_INDEX.md")) {
    addIssue("index-exists", "warning", "_INDEX.md", "Root _INDEX.md is missing");
  }

  // 9. index-size
  if (rootFiles.has("_INDEX.md")) {
     try {
       const indexRaw = await fs.readFile(path.join(memoryRepoPath, "_INDEX.md"), "utf8");
       const lines = indexRaw.split("\n");
       if (lines.length > config.maxIndexLines) {
           addIssue("index-size", "warning", "_INDEX.md", `Index has ${lines.length} lines, max is ${config.maxIndexLines}`);
       }
       for (let i = 0; i < lines.length; i++) {
          if (lines[i].length > config.maxIndexLineLength) {
              addIssue("index-size", "warning", "_INDEX.md", `Line ${i + 1} exceeds ${config.maxIndexLineLength} characters`);
          }
       }
     } catch {}
  }

  const validMemoryTypes = ["project-architecture", "workflow", "debugging-tip", "user-preference", "codebase-pattern", "decision", "session", "retro", "snapshot", "index"];
  const validConfidences = ["high", "medium", "low"];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const now = new Date();
  const staleThresholdMs = config.staleThresholdDays * 24 * 60 * 60 * 1000;

  for (const rel of allMdFiles) {
    if (rel.endsWith("_INDEX.md")) continue;

    let content = "";
    try {
      content = await fs.readFile(path.join(memoryRepoPath, rel), "utf8");
    } catch { continue; }

    // 2. frontmatter-required (Exempt README.md)
    if (rel.toLowerCase() === "readme.md") continue;

    if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
      addIssue("frontmatter-required", "error", rel, "Missing YAML frontmatter");
      continue;
    }

    let parsed: any;
    try {
      parsed = parseFrontmatter(content);
    } catch {
      addIssue("frontmatter-required", "error", rel, "Invalid YAML frontmatter");
      continue;
    }

    const fm = parsed.frontmatter;

    // 3. frontmatter-fields
    const req = ["memory-type", "project", "confidence", "last-verified", "created", "modified"];
    for (const r of req) {
      if (!fm[r]) addIssue("frontmatter-fields", "error", rel, `Missing field: ${r}`);
    }

    // 4. memory-type-valid
    if (fm["memory-type"] && !validMemoryTypes.includes(fm["memory-type"])) {
      addIssue("memory-type-valid", "error", rel, `Invalid memory-type: ${fm["memory-type"]}`);
    }

    // 5. confidence-valid
    if (fm.confidence && !validConfidences.includes(fm.confidence)) {
      addIssue("confidence-valid", "error", rel, `Invalid confidence: ${fm.confidence}`);
    }

    // 6. date-format
    if (fm["last-verified"] && !dateRegex.test(fm["last-verified"]?.split("T")[0] || "")) {
       addIssue("date-format", "error", rel, `last-verified must be YYYY-MM-DD, got ${fm["last-verified"]}`);
    }
    if (fm.expires && !dateRegex.test(fm.expires?.split("T")[0] || "")) {
       addIssue("date-format", "error", rel, `expires must be YYYY-MM-DD, got ${fm.expires}`);
    }

    // 7. timestamp-format
    const isIso = (d: string) => !isNaN(new Date(d).getTime());
    if (fm.created && !isIso(fm.created)) addIssue("timestamp-format", "error", rel, "created is not ISO 8601");
    if (fm.modified && !isIso(fm.modified)) addIssue("timestamp-format", "error", rel, "modified is not ISO 8601");

    // 12. stale-content
    if (fm["last-verified"] && isIso(fm["last-verified"])) {
      const verDate = new Date(fm["last-verified"]);
      if (now.getTime() - verDate.getTime() > staleThresholdMs) {
        addIssue("stale-content", "warning", rel, `last-verified is older than ${config.staleThresholdDays} days`);
      }
    }
  }

  // 10. no-secrets
  const sec = await scanForSecrets(memoryRepoPath, config.secretPatterns);
  if (sec.found) {
    for (const s of sec.issues) {
       addIssue("no-secrets", "error", s.file, `Found secret pattern '${s.pattern}' on line ${s.line}`);
    }
  }

  const errors = issues.filter(i => i.level === "error").length;
  const warnings = issues.filter(i => i.level === "warning").length;

  return { errors, warnings, results: issues };
}
