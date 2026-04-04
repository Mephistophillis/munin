import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { CheckResult, CheckItem } from "../types/cli.js";

export async function checkFreshness(memoryRepoPath: string, staleThresholdDays: number = 30): Promise<CheckResult> {
  let files: string[] = [];
  try {
    const dir = await fs.readdir(memoryRepoPath);
    files = dir.filter(f => f.endsWith(".md") && f !== "_INDEX.md");
  } catch {
    throw new Error(`Directory ${memoryRepoPath} not found`);
  }

  const items: CheckItem[] = [];
  let fresh = 0;
  let needsReview = 0;
  let expired = 0;
  
  const now = new Date();
  const thresholdMs = staleThresholdDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    let raw = "";
    try {
      raw = await fs.readFile(path.join(memoryRepoPath, file), "utf8");
    } catch {
      continue;
    }

    try {
      const { frontmatter } = parseFrontmatter(raw);
      const verified = frontmatter["last-verified"];
      const expires = frontmatter.expires;
      const type = frontmatter["memory-type"];

      let status: "fresh" | "needs-review" | "expired" = "fresh";

      if (expires) {
        const expDate = new Date(expires);
        if (!isNaN(expDate.getTime()) && expDate < now) {
          status = "expired";
        }
      }

      if (status !== "expired" && verified) {
        const verDate = new Date(verified);
        if (!isNaN(verDate.getTime())) {
          if (now.getTime() - verDate.getTime() > thresholdMs) {
            status = "needs-review";
          }
        }
      }

      if (status === "fresh") fresh++;
      if (status === "needs-review") needsReview++;
      if (status === "expired") expired++;

      items.push({
        file,
        type: type as string,
        lastVerified: verified || "unknown",
        status
      });

    } catch {
      // Invalid frontmatter is ignored in check (handled by lint)
    }
  }

  return {
    total: items.length,
    fresh,
    needsReview,
    expired,
    items
  };
}
