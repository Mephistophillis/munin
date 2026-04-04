import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import chalk from "chalk";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { checkFreshness } from "../../core/checker.js";
import { output } from "../output.js";

export function registerCheckCommand(program: Command) {
  program
    .command("check")
    .description("Check freshness of memory repo")
    .option("--json", "JSON output")
    .option("--stale-days <N>", "Override stale threshold days")
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        let agentsContent = "";
        try {
          agentsContent = await fs.readFile(path.resolve(cwd, "AGENTS.md"), "utf8");
        } catch {
          output({ success: false, command: "check", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const config = parseAgentsConfig(agentsContent);
        const relPath = config.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        const staleDays = options.staleDays ? parseInt(options.staleDays, 10) : 30;

        const res = await checkFreshness(localPath, staleDays);

        if (options.json) {
          output({ success: true, command: "check", data: res, message: "" }, true);
        } else {
          console.log("Memory Freshness Check");
          console.log("──────────────────────────────────────────────────────");
          for (const item of res.items) {
             let statusStr = "";
             if (item.status === "fresh") statusStr = chalk.green("✅ fresh");
             if (item.status === "needs-review") statusStr = chalk.yellow("⚠️  needs-review");
             if (item.status === "expired") statusStr = chalk.red("❌ expired");
             
             console.log(`  ${item.file.padEnd(20)} [${item.type.padEnd(15)}] verified ${item.lastVerified}  ${statusStr}`);
          }
          console.log("");
          console.log(`Total: ${res.total} | Fresh: ${res.fresh} | Needs review: ${res.needsReview} | Expired: ${res.expired}`);
        }

        if (res.needsReview > 0 || res.expired > 0) {
           process.exit(2);
        } else {
           process.exit(0);
        }

      } catch (err: any) {
        output({ success: false, command: "check", error: { code: ExitCode.GENERAL_ERROR, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
