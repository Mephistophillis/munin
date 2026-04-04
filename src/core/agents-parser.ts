import type { AgentsConfig, Mode } from "../types/agents.js";
import { DEFAULT_REQUIRED_READS, DEFAULT_MODE, DEFAULT_BRANCH } from "../types/agents.js";

export class AgentsParseError extends Error {
  constructor(public message: string, public code: number) {
    super(message);
  }
}

export function parseAgentsConfig(content: string): AgentsConfig {
  const lines = content.split(/\r?\n/);
  const memorySectionStartIndex = lines.findIndex(line => line.trim() === "## External Memory");

  if (memorySectionStartIndex === -1) {
    throw new AgentsParseError("Section '## External Memory' not found", 11); // AGENTS_MD_INVALID
  }

  const memorySectionLines: string[] = [];
  for (let i = memorySectionStartIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      break;
    }
    memorySectionLines.push(line);
  }

  const config: AgentsConfig = {
    externalMemory: {
      memoryRepo: "",
      localPath: undefined,
      defaultBranch: DEFAULT_BRANCH,
      mode: DEFAULT_MODE,
    },
    requiredReads: [],
    updateTriggers: [],
    commitPolicy: [],
    forbiddenActions: [],
  };

  let currentSubsection = "root";

  for (const line of memorySectionLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      currentSubsection = trimmed.substring(4).trim();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const item = trimmed.substring(2).trim();
      
      if (currentSubsection === "root") {
        const colonIndex = item.indexOf(":");
        if (colonIndex !== -1) {
          const key = item.substring(0, colonIndex).trim();
          const value = item.substring(colonIndex + 1).trim();

          if (key === "Memory Repo") config.externalMemory.memoryRepo = value;
          else if (key === "Local Path") config.externalMemory.localPath = value;
          else if (key === "Default Branch") config.externalMemory.defaultBranch = value;
          else if (key === "Mode") {
            if (["direct", "review", "append-only"].includes(value)) {
              config.externalMemory.mode = value as Mode;
            } else {
              config.externalMemory.mode = "direct";
            }
          }
        }
      } else if (currentSubsection === "Required Reads") {
        config.requiredReads.push(item);
      } else if (currentSubsection === "Update Triggers") {
        config.updateTriggers.push(item);
      } else if (currentSubsection === "Commit Policy") {
        config.commitPolicy.push(item);
      } else if (currentSubsection === "Forbidden Actions") {
        config.forbiddenActions.push(item);
      }
    }
  }

  if (!config.externalMemory.memoryRepo) {
    throw new AgentsParseError("'Memory Repo' is required in '## External Memory' section", 11);
  }

  if (config.externalMemory.localPath && config.externalMemory.localPath.startsWith("/")) {
    throw new AgentsParseError("'Local Path' must be relative", 11);
  }

  if (!config.externalMemory.localPath) {
    const repo = config.externalMemory.memoryRepo;
    const parts = repo.split("/");
    const lastPart = parts[parts.length - 1];
    const derivedName = lastPart.replace(/\.git$/, "");
    config.externalMemory.localPath = `../${derivedName}`;
  }

  if (config.requiredReads.length === 0) {
    config.requiredReads = [...DEFAULT_REQUIRED_READS];
  }
  if (config.updateTriggers.length === 0) {
    config.updateTriggers = ["start of work"];
  }
  if (config.commitPolicy.length === 0) {
    config.commitPolicy = ["memory: update after <reason>"];
  }

  return config;
}
