import { status } from "./git-ops.js";

export function detectConflicts(cwd: string): string[] {
  const stat = status(cwd);
  return stat.conflicted;
}
