export type Mode = "direct" | "review" | "append-only";

export interface ExternalMemoryConfig {
  memoryRepo: string;
  localPath?: string;
  defaultBranch?: string;
  mode?: Mode;
}

export interface AgentsConfig {
  externalMemory: ExternalMemoryConfig;
  requiredReads: string[];
  updateTriggers: string[];
  commitPolicy: string[];
  forbiddenActions: string[];
}

export const DEFAULT_REQUIRED_READS = [
  "project-brief.md",
  "active-context.md",
  "decisions.md",
  "tasks.md",
  "progress.md",
];

export const DEFAULT_MODE: Mode = "direct";
export const DEFAULT_BRANCH = "main";
