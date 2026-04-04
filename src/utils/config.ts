import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Mode, AgentsConfig } from "../types/agents.js";
import { DEFAULT_MODE, DEFAULT_BRANCH } from "../types/agents.js";

export interface LintConfig {
  ignore: string[];
  staleThresholdDays: number;
  maxIndexLines: number;
  maxIndexLineLength: number;
  secretPatterns: string[];
}

export interface DistillationConfig {
  enabled: boolean;
  threshold: number;
}

export interface ResolvedConfig {
  mode: Mode;
  defaultBranch: string;
  localPath: string;
  memoryRepoUrl: string;
  requiredReads: string[];
  lint: LintConfig;
  distillation: DistillationConfig;
}

const DEFAULT_SECRET_PATTERNS = [
  "api_key",
  "password",
  "token",
  "secret",
  "private_key",
];

export async function loadConfig(memoryRepoPath: string, agentsConfig: AgentsConfig): Promise<ResolvedConfig> {
  const configPath = path.join(memoryRepoPath, ".memory", "config.json");
  
  let configJson: any = {};
  try {
    const raw = await fs.readFile(configPath, "utf8");
    configJson = JSON.parse(raw);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      throw new Error(`CONFIG_INVALID: Failed to parse .memory/config.json: ${err.message}`);
    }
  }

  const resolved: ResolvedConfig = {
    mode: configJson.mode ?? agentsConfig.externalMemory.mode ?? DEFAULT_MODE,
    defaultBranch: configJson.defaultBranch ?? agentsConfig.externalMemory.defaultBranch ?? DEFAULT_BRANCH,
    localPath: agentsConfig.externalMemory.localPath || "../project-memory",
    memoryRepoUrl: agentsConfig.externalMemory.memoryRepo,
    requiredReads: agentsConfig.requiredReads,
    lint: {
      ignore: configJson.lint?.ignore ?? [],
      staleThresholdDays: configJson.lint?.staleThresholdDays ?? 90,
      maxIndexLines: configJson.lint?.maxIndexLines ?? 100,
      maxIndexLineLength: configJson.lint?.maxIndexLineLength ?? 150,
      secretPatterns: configJson.lint?.secretPatterns ?? DEFAULT_SECRET_PATTERNS,
    },
    distillation: {
      enabled: configJson.distillation?.enabled ?? false,
      threshold: configJson.distillation?.threshold ?? 10,
    }
  };

  if (configJson.mode && agentsConfig.externalMemory.mode && configJson.mode !== agentsConfig.externalMemory.mode) {
    resolved.mode = configJson.mode;
  }

  return resolved;
}
