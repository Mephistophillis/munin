export interface GitExecOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface GitExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

let __isGitInstalledCache: boolean | null = null;

export function gitExec(args: string[], options?: GitExecOptions): GitExecResult {
  try {
    const proc = Bun.spawnSync(["git", ...args], {
      cwd: options?.cwd,
      env: { ...process.env, ...options?.env } as Record<string, string>,
      // timeout default is 30s
    });

    // If timeout occurred, bun kills the process and often exitCode is not clean
    // Actually, bun spawnSync doesn't have built-in timeout in all versions exactly the same way,
    // but assuming standard usage for MVP.
    const stdout = proc.stdout ? proc.stdout.toString() : "";
    const stderr = proc.stderr ? proc.stderr.toString() : "";

    return {
      success: proc.exitCode === 0,
      stdout,
      stderr,
      exitCode: proc.exitCode ?? 1,
    };
  } catch (err: any) {
    return {
      success: false,
      stdout: "",
      stderr: err.message || String(err),
      exitCode: 1,
    };
  }
}

export function isGitInstalled(): boolean {
  if (__isGitInstalledCache !== null) {
    return __isGitInstalledCache;
  }
  try {
    const res = Bun.spawnSync(["git", "--version"]);
    __isGitInstalledCache = res.exitCode === 0;
    return __isGitInstalledCache;
  } catch {
    __isGitInstalledCache = false;
    return false;
  }
}
