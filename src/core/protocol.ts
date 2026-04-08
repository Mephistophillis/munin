const AGENT_PROTOCOL = `## Agent Memory Protocol

Rules for working with Munin external memory. Follow this in every session.

### Session Lifecycle

1. **Boot:** \`munin pull\` then \`munin read\`
2. **Work:** \`munin update --message "..."\` to record observations
3. **Commit:** \`munin commit --reason "..."\` to persist changes
4. **Validate:** \`munin check\` and \`munin lint\` periodically

### Update Syntax

Default (appends to active-context.md → Recent Changes):
\`\`\`
munin update --message "Discovered X about the auth flow"
\`\`\`

Target specific file and section with inline markers:
\`\`\`
munin update --message "[file:decisions.md][section:Recent Decisions]Chose X over Y because Z"
\`\`\`

| Marker | Purpose | Default |
|--------|---------|---------|
| \`[file:<name>]\` | Target memory file | active-context.md |
| \`[section:<name>]\` | Target section | Recent Changes |
| \`[action:replace]\` | Replace section instead of append | append |

Multiple patches — separate with blank lines:
\`\`\`
munin update --message "[file:active-context.md][section:Recent Changes]Completed auth
[file:tasks.md][section:Completed]Auth module"
\`\`\`

JSON patch: \`munin update --from-json '{"file":"tasks.md","section":"Active","action":"append","content":"- [ ] New task"}'\`

Dry run (preview without writing): \`munin update --message "..." --dry-run\`

### Memory Files

| File | Type | When to update |
|------|------|---------------|
| project-brief.md | Goals, stack, constraints | Once at init, rarely after |
| active-context.md | Current focus, recent changes, open questions | Every session |
| decisions.md | Architecture and design decisions with rationale | When a non-trivial choice is made |
| tasks.md | Active and completed tasks | As tasks change state |
| progress.md | Milestones and blockers | At milestones or blockers |

### What to Record

- Decisions with rationale ("Chose X over Y because Z")
- Discovered conventions and constraints
- Task state changes (started, completed, blocked)
- Resolved open questions
- Blockers with enough context for the next agent

### What NOT to Record

- Raw code (code belongs in the codebase)
- Content that duplicates README or docs
- Trivial facts ("renamed variable x to y")
- Anything without long-term value for future sessions

### Error Recovery

| Code | Meaning | Action |
|------|---------|--------|
| 10 | AGENTS.md not found | Create AGENTS.md with \`## External Memory\` and \`- Memory Repo: <url>\` |
| 20 | Memory repo missing | Run \`munin init\` |
| 23 | Merge conflicts | Resolve manually, then \`munin pull\` |
| 50 | Secret detected | Remove secret before committing |
| 61 | Parse error in update | Fix syntax, use \`--dry-run\` to validate |
| 42 | Push failed | \`munin pull\` first, resolve conflicts, retry |
`;

export function getAgentProtocol(): string {
  return AGENT_PROTOCOL;
}

export function hasProtocolSection(content: string): boolean {
  return content.includes("## Agent Memory Protocol");
}

export async function injectProtocol(agentsMdPath: string): Promise<boolean> {
  const { readFile, writeFile } = await import("node:fs/promises");
  let content: string;
  try {
    content = await readFile(agentsMdPath, "utf8");
  } catch {
    return false;
  }

  if (hasProtocolSection(content)) {
    return false;
  }

  const trimmed = content.trimEnd();
  const updated = trimmed + "\n\n" + AGENT_PROTOCOL;

  await writeFile(agentsMdPath, updated, "utf8");
  return true;
}
