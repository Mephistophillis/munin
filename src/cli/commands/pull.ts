import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { isGitInstalled } from "../../git/git-exec.js";
import { isRepo, getCurrentBranch, fetch, pull, getAheadBehind, checkout } from "../../git/git-ops.js";
import { detectConflicts } from "../../git/conflict.js";
import { output } from "../output.js";

export function registerPullCommand(program: Command) {
  program
    .command("pull")
    .description("Pull memory repository")
    .option("--json", "JSON output")
    .action(async (options) => {
      try {
        if (!isGitInstalled()) {
          output({ success: false, command: "pull", error: { code: ExitCode.GIT_NOT_INSTALLED, constant: "GIT_NOT_INSTALLED", message: "Git is not installed", suggestion: "Install git" } }, options.json);
          process.exit(ExitCode.GIT_NOT_INSTALLED);
        }

        const cwd = process.cwd();
        const agentsPath = path.resolve(cwd, "AGENTS.md");
        let agentsContent = "";

        try {
          agentsContent = await fs.readFile(agentsPath, "utf8");
        } catch {
          output({ success: false, command: "pull", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "Run init first or create AGENTS.md" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const config = parseAgentsConfig(agentsContent);
        const relPath = config.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        let exists = false;
        try {
          exists = (await fs.stat(localPath)).isDirectory();
        } catch {}

        if (!exists || !isRepo(localPath)) {
          output({ success: false, command: "pull", error: { code: ExitCode.MEMORY_REPO_NOT_FOUND, constant: "MEMORY_REPO_NOT_FOUND", message: `Memory repo not found at ${localPath}`, suggestion: "Run munin init" } }, options.json);
          process.exit(ExitCode.MEMORY_REPO_NOT_FOUND);
        }

        const branch = config.externalMemory.defaultBranch || "main";
        const current = getCurrentBranch(localPath);
        if (current !== branch) {
          const checkoutRes = checkout(localPath, branch);
          if (!checkoutRes.success) {
            output({ success: false, command: "pull", error: { code: ExitCode.GENERAL_ERROR, constant: "GENERAL_ERROR", message: `Failed to checkout branch ${branch}`, suggestion: "Check if the branch exists" } }, options.json);
            process.exit(ExitCode.GENERAL_ERROR);
          }
        }

        fetch(localPath);
        const { ahead, behind } = getAheadBehind(localPath, "origin", branch);

        if (behind > 0) {
          const res = pull(localPath, branch);
          if (!res.success) {
            output({ success: false, command: "pull", error: { code: ExitCode.GENERAL_ERROR, constant: "GENERAL_ERROR", message: "Pull failed", suggestion: "Check git credentials" } }, options.json);
            process.exit(ExitCode.GENERAL_ERROR);
          }
        }

        const conflicts = detectConflicts(localPath);
        if (conflicts.length > 0) {
          output({ success: false, command: "pull", error: { code: ExitCode.MEMORY_REPO_CONFLICT, constant: "MEMORY_REPO_CONFLICT", message: `Conflicts in: ${conflicts.join(", ")}`, suggestion: "Resolve conflicts manually and run munin pull again" } }, options.json);
          process.exit(ExitCode.MEMORY_REPO_CONFLICT);
        }

        output({
          success: true,
          command: "pull",
          data: {
            branch,
            ahead,
            behind,
            updated: behind > 0
          },
          message: `Pulled ${behind} new commits`
        }, options.json);

      } catch (err: any) {
        output({
          success: false,
          command: "pull",
          error: { code: ExitCode.GENERAL_ERROR, constant: "ERROR", message: err.message, suggestion: "" }
        }, options.json);
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
