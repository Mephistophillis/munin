const EMBEDDED_TEMPLATES = new Map<string, string>([
  ["project-brief.md", `---
memory-type: project-architecture
project: <project-name>
confidence: high
last-verified: YYYY-MM-DD
created: YYYY-MM-DDTHH:mm:ss.sss+03:00
modified: YYYY-MM-DDTHH:mm:ss.sss+03:00
---

# Project Brief

## Overview
What is this project about?

## Goals

## Tech Stack

## Constraints
`],
  ["active-context.md", `---
memory-type: workflow
project: <project-name>
confidence: high
last-verified: YYYY-MM-DD
created: YYYY-MM-DDTHH:mm:ss.sss+03:00
modified: YYYY-MM-DDTHH:mm:ss.sss+03:00
---

# Active Context

## Current Focus

## Recent Changes

## Open Questions
`],
  ["decisions.md", `---
memory-type: decision
project: <project-name>
confidence: high
last-verified: YYYY-MM-DD
created: YYYY-MM-DDTHH:mm:ss.sss+03:00
modified: YYYY-MM-DDTHH:mm:ss.sss+03:00
---

# Decisions

## Recent Decisions
`],
  ["tasks.md", `---
memory-type: session
project: <project-name>
confidence: high
last-verified: YYYY-MM-DD
created: YYYY-MM-DDTHH:mm:ss.sss+03:00
modified: YYYY-MM-DDTHH:mm:ss.sss+03:00
---

# Tasks

## Active

## Completed
`],
  ["progress.md", `---
memory-type: retro
project: <project-name>
confidence: high
last-verified: YYYY-MM-DD
created: YYYY-MM-DDTHH:mm:ss.sss+03:00
modified: YYYY-MM-DDTHH:mm:ss.sss+03:00
---

# Progress

## Milestones

## Blockers
`],
  ["_INDEX.md", `---
memory-type: index
memory-scope: <project-name>
max-lines: 100
max-line-length: 150
created: YYYY-MM-DD
modified: YYYY-MM-DD
---

# Index: <project-name>

- [Project Brief](project-brief.md) — overview, goals, stack, constraints
- [Active Context](active-context.md) — current focus, recent changes, open questions
- [Decisions](decisions.md) — architecture decisions log
- [Tasks](tasks.md) — active, completed, deferred tasks
- [Progress](progress.md) — milestones, recent progress, blockers
`],
]);

const TEMPLATE_FILES = [
  "project-brief.md",
  "active-context.md",
  "decisions.md",
  "tasks.md",
  "progress.md",
  "_INDEX.md",
];

export async function generateTemplates(projectName: string, date: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const parsedDate = new Date(date);
  let shortDate = date;
  if (!Number.isNaN(parsedDate.getTime())) {
    shortDate = parsedDate.toISOString().split("T")[0];
  }

  for (const filename of TEMPLATE_FILES) {
    let content = EMBEDDED_TEMPLATES.get(filename);
    if (!content) continue;

    content = content.replaceAll("<project-name>", projectName);
    content = content.replaceAll("YYYY-MM-DDTHH:mm:ss.sss+03:00", date);
    content = content.replaceAll("YYYY-MM-DD", shortDate);

    result.set(filename, content);
  }

  return result;
}
