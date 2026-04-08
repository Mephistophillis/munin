import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { initMemoryRepo } from "../../core/memory-repo.js";
import { injectProtocol } from "../../core/protocol.js";
import { isGitInstalled } from "../../git/git-exec.js";
import { output } from "../output.js";

export function registerInitCommand(program: Command) {
  program
    .command("init")
    .description("Initialize memory repository")
    .option("--agents-md <path>", "Path to AGENTS.md", "AGENTS.md")
    .option("--dry-run", "Show what will be done without doing it")
    .option("--json", "JSON output")
    .action(async (options) => {
      try {
        if (!isGitInstalled()) {
          output({ success: false, command: "init", error: { code: ExitCode.GIT_NOT_INSTALLED, constant: "GIT_NOT_INSTALLED", message: "Git is not installed", suggestion: "Install git" } }, options.json);
          process.exit(ExitCode.GIT_NOT_INSTALLED);
        }

        const cwd = process.cwd();
        const agentsPath = path.resolve(cwd, options.agentsMd);
        let agentsContent = "";

        try {
          agentsContent = await fs.readFile(agentsPath, "utf8");
        } catch {
          output({ success: false, command: "init", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: `File not found: ${options.agentsMd}`, suggestion: "Create AGENTS.md in the project root" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        let config;
        try {
          config = parseAgentsConfig(agentsContent);
        } catch (e: any) {
          const code = e.code || ExitCode.AGENTS_MD_PARSE_ERROR;
          output({ success: false, command: "init", error: { code, constant: code === ExitCode.AGENTS_MD_INVALID ? "AGENTS_MD_INVALID" : "AGENTS_MD_PARSE_ERROR", message: e.message, suggestion: "Check AGENTS.md syntax" } }, options.json);
          process.exit(code);
        }

        const projectName = path.basename(cwd);
        const result = await initMemoryRepo(config, cwd, projectName, { dryRun: options.dryRun });

        let protocolInjected = false;
        if (!options.dryRun) {
          protocolInjected = await injectProtocol(agentsPath);
        }

        output({
          success: true,
          command: "init",
          data: { ...result, protocolInjected, dryRun: options.dryRun },
          message: options.dryRun ? "Dry run: no changes applied" : "Memory repository initialized"
        }, options.json);
      } catch (err: any) {
        let code: ExitCode = ExitCode.GENERAL_ERROR;
        if (err.message.includes("MEMORY_REPO_NOT_FOUND")) code = ExitCode.MEMORY_REPO_NOT_FOUND;
        if (err.message.includes("MEMORY_REPO_CLONE_FAILED")) code = ExitCode.MEMORY_REPO_CLONE_FAILED;

        output({
          success: false,
          command: "init",
          error: { code, constant: "ERROR", message: err.message, suggestion: "Read error details" }
        }, options.json);
        process.exit(code);
      }
    });
}
