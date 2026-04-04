import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";

export interface SecretIssue {
  file: string;
  line: number;
  pattern: string;
  context: string;
}

export interface SecretScanResult {
  found: boolean;
  issues: SecretIssue[];
}

export const DEFAULT_SECRET_PATTERNS = [
  "api_key",
  "password",
  "token",
  "secret",
  "private_key",
];

export async function scanForSecrets(dir: string, patterns: string[] = DEFAULT_SECRET_PATTERNS): Promise<SecretScanResult> {
  const issues: SecretIssue[] = [];
  
  const regexes = patterns.map(pattern => ({
    pattern,
    regex: new RegExp(`(?<![\\w])${pattern}(?![\\w])`, "gi")
  }));

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "_INDEX.md") {
      const filePath = path.join(dir, entry.name);
      const content = await fs.readFile(filePath, "utf8");
      
      let body = content;
      try {
        const parsed = parseFrontmatter(content);
        body = parsed.body;
      } catch {
        // If frontmatter is missing or invalid, scan the whole file
      }

      const lines = body.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip comment lines %% ... %% 
        // Note: inline comments and multi-line comments may be more complex,
        // but for MVP we skip completely if line contains %%
        if (line.includes("%%")) {
            continue;
        }

        for (const { pattern, regex } of regexes) {
          regex.lastIndex = 0;
          if (regex.test(line)) {
            issues.push({
              file: entry.name,
              line: i + 1,
              pattern,
              context: line.substring(0, 100) // Truncate context
            });
          }
        }
      }
    }
  }

  return {
    found: issues.length > 0,
    issues
  };
}
