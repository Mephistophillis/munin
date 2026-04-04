import * as path from "node:path";
import * as fs from "node:fs/promises";
import { isRepo, clone, init, add, commit } from "../git/git-ops.js";
import { gitExec } from "../git/git-exec.js";
import { generateTemplates } from "./file-templates.js";
import type { AgentsConfig } from "../types/agents.js";
import type { InitResult } from "../types/cli.js";

export async function initMemoryRepo(
  agentsConfig: AgentsConfig,
  projectPath: string,
  projectName: string,
  options?: { dryRun?: boolean }
): Promise<InitResult> {
  const localRelative = agentsConfig.externalMemory.localPath || "../project-memory";
  const localTarget = path.resolve(projectPath, localRelative);
  
  const filesCreated: string[] = [];
  const branch = agentsConfig.externalMemory.defaultBranch || "main";

  if (options?.dryRun) {
    return {
      memoryRepo: localRelative,
      branch,
      filesCreated: ["project-brief.md", "active-context.md", "decisions.md", "tasks.md", "progress.md", "_INDEX.md"],
      commitHash: "dry-run",
    };
  }

  let exists = false;
  try {
    const stat = await fs.stat(localTarget);
    exists = true;
    if (!stat.isDirectory()) {
      throw new Error(`MEMORY_REPO_NOT_FOUND: ${localTarget} exists but is not a directory`);
    }
  } catch (e: any) {
    if (e.code !== "ENOENT" && !e.message.includes("MEMORY_REPO_NOT_FOUND")) {
      throw e;
    }
  }

  if (exists) {
    if (!isRepo(localTarget)) {
      throw new Error(`MEMORY_REPO_NOT_FOUND: Directory ${localTarget} exists but is not a git repository`);
    }
  } else {
    // Need to create
    if (agentsConfig.externalMemory.memoryRepo && agentsConfig.externalMemory.memoryRepo.includes("://") || agentsConfig.externalMemory.memoryRepo.includes("@")) {
      // Remote url -> clone
      const res = clone(agentsConfig.externalMemory.memoryRepo, localTarget, branch);
      if (!res.success) {
        // Fallback or error
        throw new Error(`MEMORY_REPO_CLONE_FAILED: Failed to clone ${agentsConfig.externalMemory.memoryRepo}\n${res.stderr}`);
      }
    } else {
       await fs.mkdir(localTarget, { recursive: true });
       const res = init(localTarget);
       if (!res.success) throw new Error(`MEMORY_REPO_CLONE_FAILED: Failed to init git ${localTarget}\n${res.stderr}`);
    }
  }

  // Generate missing files
  const dateStr = new Date().toISOString();
  const templates = await generateTemplates(projectName, dateStr);
  
  for (const [filename, content] of templates.entries()) {
    const filePath = path.join(localTarget, filename);
    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch {}

    if (!fileExists) {
      await fs.writeFile(filePath, content, "utf8");
      filesCreated.push(filename);
    }
  }

  let commitHash = "";
  if (filesCreated.length > 0) {
    add(localTarget, filesCreated);
    const commRes = commit(localTarget, "memory: initial commit (munin init)");
    if (commRes.success) {
       const revRes = gitExec(["rev-parse", "HEAD"], { cwd: localTarget });
       commitHash = revRes.success ? revRes.stdout.trim() : "unknown";
    }
  }

  return {
    memoryRepo: localRelative,
    branch,
    filesCreated,
    commitHash,
  };
}
