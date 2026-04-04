import { gitExec } from "./git-exec.js";
import type { GitExecResult } from "./git-exec.js";

export interface GitStatusResult {
  clean: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicted: string[];
}

export function clone(url: string, targetPath: string, branch?: string): GitExecResult {
  const args = ["clone"];
  if (branch) {
    args.push("-b", branch);
  }
  args.push(url, targetPath);
  return gitExec(args);
}

export function init(path: string): GitExecResult {
  return gitExec(["init"], { cwd: path });
}

export function status(cwd: string): GitStatusResult {
  const res = gitExec(["status", "--porcelain"], { cwd });
  const result: GitStatusResult = {
    clean: true,
    staged: [],
    unstaged: [],
    untracked: [],
    conflicted: [],
  };

  if (!res.success) return result;

  const lines = res.stdout.split("\n").filter(Boolean);
  for (const line of lines) {
    if (line.length < 3) continue;
    const x = line[0];
    const y = line[1];
    const file = line.substring(3).trim();

    if (x === "?" && y === "?") {
      result.untracked.push(file);
    } else if (
      (x === "U" && y === "U") ||
      (x === "A" && y === "A") ||
      (x === "D" && y === "U") ||
      (x === "U" && y === "D") ||
      (x === "D" && y === "D") ||
      (x === "A" && y === "U") ||
      (x === "U" && y === "A")
    ) {
      result.conflicted.push(file);
    } else {
      if (x !== " " && x !== "?") {
        result.staged.push(file);
      }
      if (y !== " " && y !== "?") {
        result.unstaged.push(file);
      }
    }
  }

  result.clean =
    result.staged.length === 0 &&
    result.unstaged.length === 0 &&
    result.untracked.length === 0 &&
    result.conflicted.length === 0;

  return result;
}

export function fetch(cwd: string, remote: string = "origin"): GitExecResult {
  return gitExec(["fetch", remote], { cwd });
}

export function pull(cwd: string, branch: string = "main"): GitExecResult {
  return gitExec(["pull", "origin", branch], { cwd });
}

export function push(cwd: string, remote: string = "origin", branch: string = "main"): GitExecResult {
  return gitExec(["push", remote, branch], { cwd });
}

export function add(cwd: string, files: string[]): GitExecResult {
  return gitExec(["add", ...files], { cwd });
}

export function commit(cwd: string, message: string): GitExecResult {
  return gitExec(["commit", "-m", message], { cwd });
}

export function branch(cwd: string, name: string): GitExecResult {
  return gitExec(["branch", name], { cwd });
}

export function checkout(cwd: string, ref: string): GitExecResult {
  return gitExec(["checkout", ref], { cwd });
}

export function getCurrentBranch(cwd: string): string {
  const res = gitExec(["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  if (res.success) {
    return res.stdout.trim();
  }
  return "main";
}

export function getAheadBehind(cwd: string, remote: string = "origin", branch: string = "main"): { ahead: number; behind: number } {
  const res = gitExec(["rev-list", "--left-right", "--count", `${remote}/${branch}...HEAD`], { cwd });
  if (res.success) {
    const parts = res.stdout.trim().split(/\s+/);
    if (parts.length === 2) {
      return { behind: parseInt(parts[0], 10), ahead: parseInt(parts[1], 10) };
    }
  }
  return { ahead: 0, behind: 0 };
}

export function isRepo(path: string): boolean {
  const res = gitExec(["rev-parse", "--is-inside-work-tree"], { cwd: path });
  return res.success;
}

export function hasRemote(cwd: string, remoteName: string = "origin"): boolean {
  const res = gitExec(["remote"], { cwd });
  if (res.success) {
    return res.stdout.split("\n").some(line => line.trim() === remoteName);
  }
  return false;
}
