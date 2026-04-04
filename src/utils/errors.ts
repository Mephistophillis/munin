import { ExitCode } from "../types/errors.js";

export interface CommandErrorResult {
  code: ExitCode;
  constant: string;
  message: string;
  suggestion: string;
}

export const ERROR_MESSAGES: Record<ExitCode, { constant: string, message: string; suggestion: string }> = {
  [ExitCode.SUCCESS]: {
    constant: "SUCCESS",
    message: "Operation completed successfully",
    suggestion: ""
  },
  [ExitCode.GENERAL_ERROR]: {
    constant: "GENERAL_ERROR",
    message: "An unexpected error occurred",
    suggestion: "Run with --verbose for more details"
  },
  [ExitCode.AGENTS_MD_NOT_FOUND]: {
    constant: "AGENTS_MD_NOT_FOUND",
    message: "AGENTS.md not found in current directory",
    suggestion: "Create AGENTS.md with ## External Memory section or specify path with --agents-md"
  },
  [ExitCode.AGENTS_MD_INVALID]: {
    constant: "AGENTS_MD_INVALID",
    message: "AGENTS.md missing required External Memory section",
    suggestion: "Add ## External Memory section with at least - Memory Repo: <url>"
  },
  [ExitCode.AGENTS_MD_PARSE_ERROR]: {
    constant: "AGENTS_MD_PARSE_ERROR",
    message: "Failed to parse AGENTS.md",
    suggestion: "Check AGENTS.md markdown syntax"
  },
  [ExitCode.MEMORY_REPO_NOT_FOUND]: {
    constant: "MEMORY_REPO_NOT_FOUND",
    message: "Memory repository not found locally",
    suggestion: "Run 'munin init' first to create or clone the memory repository"
  },
  [ExitCode.MEMORY_REPO_CLONE_FAILED]: {
    constant: "MEMORY_REPO_CLONE_FAILED",
    message: "Failed to clone memory repository",
    suggestion: "Check repository URL and authentication (SSH key or HTTPS token)"
  },
  [ExitCode.MEMORY_REPO_EMPTY]: {
    constant: "MEMORY_REPO_EMPTY",
    message: "Memory repository is empty",
    suggestion: "Run 'munin init' to populate with default templates"
  },
  [ExitCode.MEMORY_REPO_CONFLICT]: {
    constant: "MEMORY_REPO_CONFLICT",
    message: "Git conflict detected",
    suggestion: "Resolve conflicts manually and run 'munin pull' again"
  },
  [ExitCode.FILE_NOT_FOUND]: {
    constant: "FILE_NOT_FOUND",
    message: "File not found in memory repository",
    suggestion: "Run 'munin read' (without arguments) to list available files"
  },
  [ExitCode.FILE_VALIDATION_FAILED]: {
    constant: "FILE_VALIDATION_FAILED",
    message: "File validation failed",
    suggestion: "Check frontmatter schema"
  },
  [ExitCode.FILE_WRITE_FAILED]: {
    constant: "FILE_WRITE_FAILED",
    message: "Failed to write file",
    suggestion: "Check disk space and file permissions"
  },
  [ExitCode.GIT_NOT_INSTALLED]: {
    constant: "GIT_NOT_INSTALLED",
    message: "Git is not found in PATH",
    suggestion: "Install git: https://git-scm.com/downloads"
  },
  [ExitCode.GIT_AUTH_FAILED]: {
    constant: "GIT_AUTH_FAILED",
    message: "Git authentication failed",
    suggestion: "Check SSH key (~/.ssh/id_rsa) or HTTPS credential helper"
  },
  [ExitCode.GIT_PUSH_FAILED]: {
    constant: "GIT_PUSH_FAILED",
    message: "Failed to push to remote",
    suggestion: "Check network connection and remote repository access"
  },
  [ExitCode.GIT_REMOTE_ERROR]: {
    constant: "GIT_REMOTE_ERROR",
    message: "Remote repository error",
    suggestion: "Check repository URL and network connectivity"
  },
  [ExitCode.SECRET_DETECTED]: {
    constant: "SECRET_DETECTED",
    message: "Potential secret detected in content",
    suggestion: "Remove the secret or add file to .memory/config.json lint.ignore"
  },
  [ExitCode.UPDATE_NO_CHANGES]: {
    constant: "UPDATE_NO_CHANGES",
    message: "No changes to commit",
    suggestion: "Run 'munin update' first to make changes"
  },
  [ExitCode.UPDATE_PARSE_ERROR]: {
    constant: "UPDATE_PARSE_ERROR",
    message: "Failed to parse update payload",
    suggestion: "Check JSON syntax or use --message for plain text input"
  },
  [ExitCode.CONFIG_INVALID]: {
    constant: "CONFIG_INVALID",
    message: ".memory/config.json contains errors",
    suggestion: "Validate JSON syntax and check schema in docs"
  },
  [ExitCode.NETWORK_ERROR]: {
    constant: "NETWORK_ERROR",
    message: "Network error",
    suggestion: "Check internet connection and try again"
  },
  [ExitCode.LINT_ERRORS]: {
    constant: "LINT_ERRORS",
    message: "Linter found errors",
    suggestion: "Fix issues and run again"
  },
  [ExitCode.LINT_WARNINGS]: {
    constant: "LINT_WARNINGS",
    message: "Linter found warnings",
    suggestion: "Review warnings"
  }
};

export function createError(code: ExitCode, customMessage?: string): CommandErrorResult {
  const base = ERROR_MESSAGES[code] || ERROR_MESSAGES[ExitCode.GENERAL_ERROR];
  return {
    code,
    constant: base.constant,
    message: customMessage || base.message,
    suggestion: base.suggestion
  };
}
