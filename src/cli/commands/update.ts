import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { applyPatchBatch, parseTextInput } from "../../core/updater.js";
import type { JsonPatch } from "../../types/cli.js";
import { output } from "../output.js";

export function registerUpdateCommand(program: Command) {
  program
    .command("update")
    .description("Update file in memory repo")
    .option("--from-json <path_or_payload>", "Path to JSON file or inline JSON string")
    .option("--patch <path>", "Alias for --from-json (deprecated: use --patch instead)")
    .option("--message <text>", "Plain-text description of changes")
    .option("--dry-run", "Show changes without writing")
    .option("--json", "JSON output")
    .action(async (options) => {
      try {
        if (options.fromJson && options.message) {
          output({ success: false, command: "update", error: { code: ExitCode.UPDATE_PARSE_ERROR, constant: "UPDATE_PARSE_ERROR", message: "--from-json and --message are mutually exclusive", suggestion: "Use only one" } }, options.json);
          process.exit(ExitCode.UPDATE_PARSE_ERROR);
        }

        const cwd = process.cwd();
        let agentsContent = "";
        try {
          agentsContent = await fs.readFile(path.resolve(cwd, "AGENTS.md"), "utf8");
        } catch {
          output({ success: false, command: "update", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const config = parseAgentsConfig(agentsContent);
        const relPath = config.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        try {
          if (!(await fs.stat(localPath)).isDirectory()) throw new Error();
        } catch {
          output({ success: false, command: "update", error: { code: ExitCode.MEMORY_REPO_NOT_FOUND, constant: "MEMORY_REPO_NOT_FOUND", message: `Memory repo not found at ${localPath}`, suggestion: "" } }, options.json);
          process.exit(ExitCode.MEMORY_REPO_NOT_FOUND);
        }

        let patches: JsonPatch[] = [];

        const source = options.patch || options.fromJson;
        if (source) {
           let jsonStr = source;
           if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
              try { jsonStr = await fs.readFile(path.resolve(cwd, jsonStr), "utf8"); } catch {}
           }
           try {
             const parsed = JSON.parse(jsonStr);
             patches = Array.isArray(parsed) ? parsed : [parsed];
           } catch {
             output({ success: false, command: "update", error: { code: ExitCode.UPDATE_PARSE_ERROR, constant: "UPDATE_PARSE_ERROR", message: "Invalid JSON", suggestion: "" } }, options.json);
             process.exit(ExitCode.UPDATE_PARSE_ERROR);
           }
        } else if (options.message) {
           patches = parseTextInput(options.message);
         } else {
            const chunks: Buffer[] = [];
            const stdin = process.stdin;
            if (stdin.isTTY) {
              output({ success: false, command: "update", error: { code: ExitCode.UPDATE_PARSE_ERROR, constant: "UPDATE_PARSE_ERROR", message: "Provide either --message or --from-json", suggestion: "" } }, options.json);
              process.exit(ExitCode.UPDATE_PARSE_ERROR);
            }
            const input = await new Promise<string>((resolve, reject) => {
              stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
              stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
              stdin.on("error", reject);
              stdin.resume();
            });
            if (!input.trim()) {
              output({ success: false, command: "update", error: { code: ExitCode.UPDATE_PARSE_ERROR, constant: "UPDATE_PARSE_ERROR", message: "Empty stdin input", suggestion: "" } }, options.json);
              process.exit(ExitCode.UPDATE_PARSE_ERROR);
            }
            patches = parseTextInput(input);
         }

        if (patches.length === 0) {
           output({ success: false, command: "update", error: { code: ExitCode.UPDATE_NO_CHANGES, constant: "UPDATE_NO_CHANGES", message: "No valid patches to apply", suggestion: "" } }, options.json);
           process.exit(ExitCode.UPDATE_NO_CHANGES);
        }

        if (options.dryRun) {
           output({
              success: true, command: "update",
              data: {
                 filesModified: [...new Set(patches.map(p => p.file))],
                 sectionsChanged: [...new Set(patches.map(p => p.section))],
                 indexUpdated: false, staged: false, dryRun: true
              },
              message: "Dry run: no changes applied"
           }, options.json);
           return;
        }

        try {
          const res = await applyPatchBatch(localPath, patches);
          output({
             success: true, command: "update",
             data: res, message: "Update completed successfully"
          }, options.json);
        } catch (err: any) {
          let code: ExitCode = ExitCode.GENERAL_ERROR;
          if (err.message?.includes("FILE_NOT_FOUND")) code = ExitCode.FILE_NOT_FOUND;
          output({ success: false, command: "update", error: { code, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
          process.exit(code);
        }

      } catch (err: any) {
         output({ success: false, command: "update", error: { code: ExitCode.GENERAL_ERROR, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
         process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
