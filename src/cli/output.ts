import chalk from "chalk";
import type { CliOutput, CommandError, CommandErrorResult } from "../types/cli.js";

export const BRANDING = chalk.cyan.bold("𓅫  MUNIN");

export function output<T>(result: CliOutput<T>, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  if (result.success) {
    formatHuman(result);
  } else {
    const errResult = result as CommandErrorResult;
    const errorStr = formatError(errResult.error);
    console.error(errorStr);
  }
}

export function formatHuman<T>(result: CliOutput<T>): void {
  if (!result.success) return;
  console.log(`\n${BRANDING}\n`);
  console.log(chalk.green(`Success: ${result.command}`));
  console.log(result.data);
}

export function formatError(error: CommandError): string {
  return `\n${BRANDING}\n\n` +
         chalk.red(`Error [${error.constant}]: ${error.message}\n`) + 
         chalk.yellow(`Suggestion: ${error.suggestion}`);
}
