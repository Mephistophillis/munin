import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as crypto from "node:crypto";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { scanForSecrets } from "../../core/secret-scanner.js";
import { loadConfig } from "../../utils/config.js";
import { output } from "../output.js";
import { isGitInstalled, gitExec } from "../../git/git-exec.js";
import { status, add, commit, push, checkout, branch as gitBranch } from "../../git/git-ops.js";

function formatCommitMessage(reason: string): string {
  const line = reason.split(/\r?\n/)[0].trim();
  let msg = `memory: update after ${line}`;
  if (msg.length > 72) {
    msg = msg.substring(0, 69) + "...";
  }
  return msg;
}

function generateShortId(reason: string): string {
  return crypto.createHash("md5").update(reason).digest("hex").substring(0, 6);
}

export function registerCommitCommand(program: Command) {
  program
    .command("commit")
    .description("Commit memory modifications")
    .requiredOption("--reason <text>", "Reason for commit")
    .option("--pr", "Create PR using gh CLI (review mode only)")
    .option("--dry-run", "Show what will be done without doing it")
    .option("--json", "JSON output")
    .action(async (options) => {
      try {
        if (!isGitInstalled()) {
          output({ success: false, command: "commit", error: { code: ExitCode.GIT_NOT_INSTALLED, constant: "GIT_NOT_INSTALLED", message: "Git not installed", suggestion: "Install git" } }, options.json);
          process.exit(ExitCode.GIT_NOT_INSTALLED);
        }

        const cwd = process.cwd();
        let agentsContent = "";
        try {
          agentsContent = await fs.readFile(path.resolve(cwd, "AGENTS.md"), "utf8");
        } catch {
          output({ success: false, command: "commit", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const agentsConfig = parseAgentsConfig(agentsContent);
        const relPath = agentsConfig.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        try {
          if (!(await fs.stat(localPath)).isDirectory()) throw new Error();
        } catch {
          output({ success: false, command: "commit", error: { code: ExitCode.MEMORY_REPO_NOT_FOUND, constant: "MEMORY_REPO_NOT_FOUND", message: `Memory repo not found at ${localPath}`, suggestion: "" } }, options.json);
          process.exit(ExitCode.MEMORY_REPO_NOT_FOUND);
        }

        const config = await loadConfig(localPath, agentsConfig);
        
        const stat = status(localPath);
        if (stat.clean) {
          output({ success: false, command: "commit", error: { code: ExitCode.UPDATE_NO_CHANGES, constant: "UPDATE_NO_CHANGES", message: "No changes to commit", suggestion: "" } }, options.json);
          process.exit(ExitCode.UPDATE_NO_CHANGES);
        }

        const secrets = await scanForSecrets(localPath, config.lint.secretPatterns);
        if (secrets.found) {
          output({ success: false, command: "commit", error: { code: ExitCode.SECRET_DETECTED, constant: "SECRET_DETECTED", message: `Secrets detected in ${secrets.issues.length} places`, suggestion: "Remove secrets before committing" } }, options.json);
          process.exit(ExitCode.SECRET_DETECTED);
        }

        const msg = formatCommitMessage(options.reason);

        if (options.dryRun) {
          let dryBranch = config.defaultBranch;
          if (config.mode === "review") dryBranch = `mem/${generateShortId(options.reason)}`;
          
          output({
            success: true,
            command: "commit",
            data: {
              mode: config.mode, branch: dryBranch,
              message: msg, push: true, pr: !!options.pr && config.mode === "review",
              dryRun: true
            },
            message: "Dry run complete"
          }, options.json);
          return;
        }

        let currentBranch = config.defaultBranch;

        if (config.mode === "review") {
          const shortId = generateShortId(options.reason);
          currentBranch = `mem/${shortId}`;
          gitExec(["checkout", "-b", currentBranch], { cwd: localPath });
        } else {
          if (options.pr) {
             console.warn("Warning: --pr flag ignored in direct mode");
          }
        }

        add(localPath, ["."]);
        commit(localPath, msg);

        let pushRes;
        if (config.mode === "review") {
          pushRes = gitExec(["push", "-u", "origin", currentBranch], { cwd: localPath });
        } else {
          pushRes = push(localPath, "origin", currentBranch);
        }

        if (!pushRes.success) {
           output({ success: false, command: "commit", error: { code: ExitCode.GIT_PUSH_FAILED, constant: "GIT_PUSH_FAILED", message: "Push failed", suggestion: "Check git remote or authentication" } }, options.json);
           process.exit(ExitCode.GIT_PUSH_FAILED);
        }

        let prUrl = null;
        if (config.mode === "review" && options.pr) {
           const ghCheck = Bun.spawnSync(["gh", "--version"]);
           if (ghCheck.exitCode === 0) {
              const ghRes = Bun.spawnSync(["gh", "pr", "create", "--title", `memory: ${options.reason}`, "--body", "Auto-generated memory update"], { cwd: localPath });
              if (ghRes.exitCode === 0) {
                 prUrl = ghRes.stdout.toString().trim();
              } else {
                 console.warn("Warning: gh pr create failed: " + ghRes.stderr.toString());
              }
           } else {
              console.warn("Warning: gh CLI not found. Branch pushed, create PR manually.");
           }
        }

        // We assume we want to pull commitHash from local (e.g., rev-parse HEAD)
        const hashRes = gitExec(["rev-parse", "HEAD"], { cwd: localPath });
        const commitHash = hashRes.success ? hashRes.stdout.trim() : "unknown";

        output({
          success: true,
          command: "commit",
          data: { commitHash, branch: currentBranch, pushed: true, mode: config.mode, prUrl },
          message: `Committed ${commitHash}`
        }, options.json);

      } catch (err: any) {
        let code: ExitCode = ExitCode.GENERAL_ERROR;
        if (err.message?.includes("CONFIG_INVALID")) code = ExitCode.CONFIG_INVALID;
        output({ success: false, command: "commit", error: { code, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
        process.exit(code);
      }
    });
}
