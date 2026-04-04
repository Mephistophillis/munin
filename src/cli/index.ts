import { Command } from "commander";
import chalk from "chalk";
import { BRANDING } from "./output.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPullCommand } from "./commands/pull.js";
import { registerReadCommand } from "./commands/read.js";
import { registerUpdateCommand } from "./commands/update.js";
import { registerCommitCommand } from "./commands/commit.js";
import { registerCheckCommand } from "./commands/check.js";
import { registerLintCommand } from "./commands/lint.js";
import { ExitCode } from "../types/errors.js";

const program = new Command();

program
  .name("munin")
  .description("Git-native external memory bank for AI agents")
  .version("0.1.0")
  .addHelpText("before", `\n${BRANDING}\n`)
  .option("-v, --verbose", "verbose output")
  .option("-q, --quiet", "suppress non-error output")
  .option("--dry-run", "preview changes without applying them");

registerInitCommand(program);
registerPullCommand(program);
registerReadCommand(program);
registerUpdateCommand(program);
registerCommitCommand(program);
registerCheckCommand(program);
registerLintCommand(program);

program
  .command("completion")
  .description("Generate shell completion script")
  .argument("<shell>", "bash or zsh")
  .action((shell) => {
    if (shell !== "bash" && shell !== "zsh") {
      console.error(`Unsupported shell: ${shell}. Use bash or zsh.`);
      process.exit(ExitCode.GENERAL_ERROR);
    }
    
    // Using built in Commander functionality if possible, or print standard fallback
    // Since commander limits autocomplete exposure without manual setup, outputting a generic string for MVP
    if (shell === "bash") {
       console.log(`# Bash completion script for munin
# Run: eval "$(munin completion bash)"
complete -W "init pull read update commit check lint completion" munin`);
    } else if (shell === "zsh") {
       console.log(`# Zsh completion script for munin
# Run: eval "$(munin completion zsh)"
compdef _munin munin
_munin() {
  local cmds=("init" "pull" "read" "update" "commit" "check" "lint" "completion")
  compadd -a cmds
}`);
    }
  });

program.parse(process.argv);
