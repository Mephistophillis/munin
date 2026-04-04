export type MemoryType =
  | "project-architecture"
  | "workflow"
  | "debugging-tip"
  | "user-preference"
  | "codebase-pattern"
  | "decision"
  | "session"
  | "retro"
  | "snapshot";

export type Confidence = "high" | "medium" | "low";

export interface Frontmatter {
  "memory-type": MemoryType;
  project: string;
  confidence: Confidence;
  "last-verified": string;
  expires?: string;
  source?: string;
  created: string;
  modified: string;
}

export interface IndexFrontmatter {
  "memory-type": "index";
  "memory-scope": string;
  "max-lines": number;
  "max-line-length": number;
  created: string;
  modified: string;
}

export interface MemoryFile {
  frontmatter: Frontmatter;
  content: string;
}
