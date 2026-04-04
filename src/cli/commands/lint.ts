import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import chalk from "chalk";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { lintMemoryRepo } from "../../core/linter.js";
import { loadConfig } from "../../utils/config.js";
import { output } from "../output.js";

export function registerLintCommand(program: Command) {
  program
    .command("lint")
    .description("Lint memory repo structure")
    .option("--json", "JSON output")
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        let agentsContent = "";
        try {
          agentsContent = await fs.readFile(path.resolve(cwd, "AGENTS.md"), "utf8");
        } catch {
          output({ success: false, command: "lint", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const config = parseAgentsConfig(agentsContent);
        const relPath = config.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        const loadedConf = await loadConfig(localPath, config);
        const res = await lintMemoryRepo(localPath, loadedConf.lint);

        if (options.json) {
          output({ success: true, command: "lint", data: res, message: "" }, true);
        } else {
          console.log("Memory Repo Lint");
          console.log("──────────────────────────────────────────────────────");
          if (res.results.length === 0) {
            console.log(chalk.green("✨ No issues found"));
          } else {
            for (const item of res.results) {
               const color = item.level === "error" ? chalk.red : chalk.yellow;
               console.log(`${color(`[${item.level.toUpperCase()}]`)} ${item.file} (${item.rule}): ${item.message}`);
            }
          }
          console.log("");
          console.log(`Errors: ${res.errors} | Warnings: ${res.warnings}`);
        }

        if (res.errors > 0) process.exit(ExitCode.LINT_ERRORS);
        if (res.warnings > 0) process.exit(ExitCode.LINT_WARNINGS);
        process.exit(0);

      } catch (err: any) {
        output({ success: false, command: "lint", error: { code: ExitCode.GENERAL_ERROR, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
