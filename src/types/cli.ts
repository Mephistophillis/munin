import type { Frontmatter } from "./memory.js";

export type UpdateAction = "append" | "replace";

export interface JsonPatch {
  file: string;
  section: string;
  action: UpdateAction;
  content: string;
}

export interface CommandError {
  code: number;
  constant: string;
  message: string;
  suggestion: string;
}

export interface CommandResult<T> {
  success: true;
  command: string;
  data: T;
  message: string;
}

export interface CommandErrorResult {
  success: false;
  command: string;
  error: CommandError;
}

export type CliOutput<T> = CommandResult<T> | CommandErrorResult;

export interface InitResult {
  memoryRepo: string;
  branch: string;
  filesCreated: string[];
  commitHash: string;
}

export interface PullResult {
  branch: string;
  ahead: number;
  behind: number;
  updated: boolean;
}

export interface ReadResult {
  file: string;
  frontmatter: Frontmatter;
  content: string;
}

export interface UpdateResult {
  filesModified: string[];
  sectionsChanged: string[];
  indexUpdated: boolean;
  staged: boolean;
}

export interface CommitResult {
  commitHash: string;
  branch: string;
  pushed: boolean;
  mode: string;
  prUrl: string | null;
}

export interface CheckItem {
  file: string;
  type: string;
  lastVerified: string;
  status: "fresh" | "needs-review" | "expired";
}

export interface CheckResult {
  total: number;
  fresh: number;
  needsReview: number;
  expired: number;
  items: CheckItem[];
}

export interface LintIssue {
  rule: string;
  level: "error" | "warning";
  file: string;
  message: string;
}

export interface LintResult {
  errors: number;
  warnings: number;
  results: LintIssue[];
}
