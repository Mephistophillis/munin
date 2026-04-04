import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { ExitCode } from "../../types/errors.js";
import { parseAgentsConfig } from "../../core/agents-parser.js";
import { parseFrontmatter } from "../../core/frontmatter.js";
import { output } from "../output.js";

export function registerReadCommand(program: Command) {
  program
    .command("read [file]")
    .description("Read file from memory repo")
    .option("--json", "JSON output")
    .option("--no-frontmatter", "Exclude frontmatter from human output")
    .action(async (file, options) => {
      try {
        const cwd = process.cwd();
        const agentsPath = path.resolve(cwd, "AGENTS.md");
        let agentsContent = "";

        try {
          agentsContent = await fs.readFile(agentsPath, "utf8");
        } catch {
          output({ success: false, command: "read", error: { code: ExitCode.AGENTS_MD_NOT_FOUND, constant: "AGENTS_MD_NOT_FOUND", message: "AGENTS.md not found", suggestion: "Run init first" } }, options.json);
          process.exit(ExitCode.AGENTS_MD_NOT_FOUND);
        }

        const config = parseAgentsConfig(agentsContent);
        const relPath = config.externalMemory.localPath || "../project-memory";
        const localPath = path.resolve(cwd, relPath);

        try {
          const stat = await fs.stat(localPath);
          if (!stat.isDirectory()) throw new Error();
        } catch {
          output({ success: false, command: "read", error: { code: ExitCode.MEMORY_REPO_NOT_FOUND, constant: "MEMORY_REPO_NOT_FOUND", message: `Memory repo not found at ${localPath}`, suggestion: "Run munin init" } }, options.json);
          process.exit(ExitCode.MEMORY_REPO_NOT_FOUND);
        }

        if (file) {
           const fp = path.join(localPath, file);
           let raw = "";
           try {
              raw = await fs.readFile(fp, "utf8");
           } catch {
              output({ success: false, command: "read", error: { code: ExitCode.FILE_NOT_FOUND, constant: "FILE_NOT_FOUND", message: `File not found: ${file}`, suggestion: "Check file name" } }, options.json);
              process.exit(ExitCode.FILE_NOT_FOUND);
           }

           let frontmatter: any = {};
           let content = raw;
           try {
             const parsed = parseFrontmatter(raw);
             frontmatter = parsed.frontmatter;
             content = parsed.body.trim();
           } catch {
             // Invalid frontmatter, skip
           }

           if (options.json) {
              output({
                 success: true,
                 command: "read",
                 data: { file, frontmatter, content },
                 message: ""
              }, true);
           } else {
             if (options.frontmatter === false) {
               console.log(content);
             } else {
               console.log(`=== ${file} ===`);
               for (const [k, v] of Object.entries(frontmatter)) {
                 console.log(`${k}: ${v}`);
               }
               console.log("\n---\n");
               console.log(content);
             }
           }
        } else {
           // list directory files
           const files = await fs.readdir(localPath);
           const mdFiles = files.filter(f => f.endsWith(".md"));
           const fileData = [];
           
           for (const f of mdFiles) {
             const fp = path.join(localPath, f);
             let meta = { name: f, memoryType: "unknown", lastVerified: "unknown" };
             try {
                const raw = await fs.readFile(fp, "utf8");
                const { frontmatter } = parseFrontmatter(raw);
                meta.memoryType = frontmatter["memory-type"] || "unknown";
                meta.lastVerified = frontmatter["last-verified"] || "unknown";
             } catch {}
             fileData.push(meta);
           }

           if (options.json) {
               output({
                 success: true,
                 command: "read",
                 data: { files: fileData },
                 message: `${fileData.length} files in memory repo`
               }, true);
           } else {
               console.log(`Files in ${relPath}:`);
               for (const f of fileData) {
                 const typePad = `[${f.memoryType}]`.padEnd(25);
                 console.log(`  ${f.name.padEnd(25)}${typePad} verified ${f.lastVerified}`);
               }
           }
        }
      } catch (err: any) {
         output({ success: false, command: "read", error: { code: ExitCode.GENERAL_ERROR, constant: "ERROR", message: err.message, suggestion: "" } }, options.json);
         process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
