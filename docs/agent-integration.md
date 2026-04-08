# Agent Integration Guide

Complete reference for AI agents on when and how to use Munin for maximum effectiveness.

---

## 1. Why Agents Need Memory

AI coding agents are stateless. Every new session starts blind — no recall of past decisions, no awareness of project conventions, no accumulated knowledge. Each conversation wastes tokens re-explaining context that should already be known.

Munin solves this with a simple contract:

1. **Read** memory at session start — load project context, decisions, open questions.
2. **Write** memory as you learn — record observations, decisions, task progress.
3. **Commit** memory when done — push to git so the next session inherits everything.

Memory lives in a separate git repository as structured markdown files with validated YAML frontmatter. Every change is tracked, diffable, and reversible.

---

## 2. Session Lifecycle

Follow this sequence in every session. Skipping steps degrades the quality of memory over time.

### Phase 1: Boot — Load Context

Run these commands **before** writing any code:

```bash
munin pull
munin read
```

- `munin pull` — syncs local memory with remote. Fetches updates from other agents or team members.
- `munin read` — lists all memory files with summaries. Use `munin read <file>` to read a specific file.

**What to read first:**
1. `active-context.md` — current focus, recent changes, open questions. This is your starting point.
2. `project-brief.md` — goals, tech stack, constraints. Read this if you're unfamiliar with the project.
3. `tasks.md` — what's active, what's blocked, what's done.

**After reading**, you should have a mental model of:
- What the project does and how it's structured
- What was worked on recently
- What decisions were made and why
- What tasks are in progress or blocked

### Phase 2: Work — Record Observations

As you work, record meaningful observations. Not everything — only things that would help a future session.

**When to update memory:**

| Trigger | What to record | Where |
|---------|---------------|-------|
| You discover a project convention | `"Project uses dependency injection, not service locators"` | `active-context.md` → Recent Changes |
| You make an architectural decision | `"Chose PostgreSQL over MongoDB for relational data integrity"` | `decisions.md` → Recent Decisions |
| You start or finish a task | `"Completed user authentication module"` | `tasks.md` → Active/Completed |
| You hit a blocker | `"External API rate-limits at 100 req/min, need caching strategy"` | `active-context.md` → Open Questions |
| You resolve an open question | `"Decided on Redis for API response caching"` | `active-context.md` → Recent Changes + `decisions.md` |
| A milestone is reached | `"v0.2.0 feature-complete"` | `progress.md` → Milestones |
| Project constraints change | `"Must support Node 18+, dropped Node 16"` | `project-brief.md` → Constraints |

**Default update (quick append to active-context.md):**
```bash
munin update --message "Discovered that auth tokens expire after 24h, refresh logic needed"
```
This appends to `active-context.md` → `Recent Changes` section.

### Phase 3: Commit — Persist to Git

When you've completed meaningful work or accumulated several updates:

```bash
munin commit --reason "Implemented refresh token rotation"
```

This stages all changes, runs a secret scan, commits, and pushes to the remote memory repository.

**Commit frequently.** Each commit should represent one logical unit of memory update. Prefer small, focused commits over large dumps.

### Phase 4: Validate — Periodic Health Checks

Run these periodically (e.g., at session end, or every few sessions):

```bash
munin check
munin lint
```

- `munin check` — identifies stale content (files not verified recently, expired entries).
- `munin lint` — validates frontmatter schema, detects secrets, checks file structure.

Fix any issues before committing.

---

## 3. Update Syntax Reference

### 3.1 Simple Text Append (default)

Appends content to `active-context.md` → `Recent Changes`:

```bash
munin update --message "Switched from REST to tRPC for type-safe API calls"
```

### 3.2 Target a Specific File and Section

Use inline meta-markers to control where content goes:

```bash
munin update --message "[file:decisions.md][section:Recent Decisions]Chose tRPC over REST for end-to-end type safety. REST would require duplicate type definitions."
```

Available meta-markers:

| Marker | Purpose | Default |
|--------|---------|---------|
| `[file:<name>]` | Target memory file | `active-context.md` |
| `[section:<name>]` | Target section within file | `Recent Changes` |
| `[action:replace]` | Replace section instead of appending | `append` |

### 3.3 Multiple Patches in One Command

Separate patches with blank lines. Each block can target a different file/section:

```bash
munin update --message "[file:active-context.md][section:Recent Changes]Completed payment integration with Stripe
[file:tasks.md][section:Completed]Payment integration (Stripe webhook handling, retry logic, idempotency keys)
[file:active-context.md][section:Open Questions]Should we add support for PayPal or stick with Stripe only?"
```

### 3.4 Replace a Section

Use `[action:replace]` to overwrite a section instead of appending:

```bash
munin update --message "[file:active-context.md][section:Current Focus][action:replace]Refactoring auth module to support OAuth2"
```

This is useful for updating `Current Focus` when priorities change, or refreshing `Open Questions` when some are resolved.

### 3.5 JSON Patch (programmatic)

For structured updates from tools and scripts:

```bash
munin update --from-json '{
  "file": "tasks.md",
  "section": "Active",
  "action": "append",
  "content": "- [ ] Add rate limiting to API endpoints"
}'
```

Or from a file:

```bash
munin update --from-json patches.json
```

Batch multiple patches as a JSON array:

```bash
munin update --from-json '[
  {"file": "active-context.md", "section": "Recent Changes", "action": "append", "content": "Added rate limiting middleware"},
  {"file": "tasks.md", "section": "Completed", "action": "append", "content": "Rate limiting implementation"}
]'
```

### 3.6 Dry Run

Preview changes without applying them:

```bash
munin update --message "[file:decisions.md][section:Recent Decisions]Test entry" --dry-run
```

Always use `--dry-run` when uncertain about update syntax or target section names.

---

## 4. Memory Files — What to Write Where

### `project-brief.md`
**Type:** `project-architecture` | **Update frequency:** Rare (once at init, then on major changes)

Contains the high-level project description. Fill during `munin init`, update only when fundamentals change:
- **Overview** — what the project is, who uses it, what problem it solves
- **Goals** — measurable objectives
- **Tech Stack** — languages, frameworks, databases, infrastructure
- **Constraints** — browser support, Node version, deployment targets, compliance requirements

### `active-context.md`
**Type:** `workflow` | **Update frequency:** Every session

The most frequently updated file. This is your working memory:
- **Current Focus** — what's being worked on right now. Replace (don't append) when focus shifts.
- **Recent Changes** — chronological log of notable changes. Append here by default.
- **Open Questions** — unresolved issues, unknowns, things to investigate. Remove when resolved.

### `decisions.md`
**Type:** `decision` | **Update frequency:** When architectural or design decisions are made

Record every non-trivial decision with rationale:
- What was decided
- What alternatives were considered
- Why this option was chosen
- What trade-offs were accepted

Format: `"Decided X over Y because Z. Trade-off: W."`

### `tasks.md`
**Type:** `session` | **Update frequency:** As tasks change state

Track task lifecycle:
- **Active** — currently in progress
- **Completed** — done, with brief description of what was done

Move tasks between sections as they progress. Don't accumulate stale active tasks.

### `progress.md`
**Type:** `retro` | **Update frequency:** At milestones or blockers

High-level progress tracking:
- **Milestones** — major achievements (version releases, feature completions)
- **Blockers** — things preventing progress, with enough context for the next agent to act on

---

## 5. Best Practices

### Do

- **Record decisions, not code.** Memory stores *why*, not *what*. The codebase already shows what. Write `"Chose Redis for caching because the project needs sub-ms latency and TTL support"`, not the implementation details.
- **Update `Current Focus` when priorities shift.** The next agent needs to know where you left off, not where you started.
- **Close open questions.** When you resolve something from Open Questions, remove it and record the resolution in Recent Changes or Decisions.
- **Be honest about confidence.** Use frontmatter `confidence: low` for unverified observations, `high` for confirmed facts.
- **Commit atomically.** One topic per commit. `"memory: update after implementing auth"` is good. `"memory: various updates"` is useless.
- **Run `munin pull` at session start.** Always. Other agents or humans may have pushed updates.
- **Use `--dry-run` when uncertain.** Especially with `action:replace` — it's destructive.

### Don't

- **Don't duplicate the README.** Memory is for agent-specific context (decisions, conventions, gotchas), not project documentation.
- **Don't dump raw code.** Code belongs in the codebase. Memory is prose.
- **Don't append endlessly to `Current Focus`.** Replace it. It should always reflect the single current priority.
- **Don't record trivial facts.** `"Changed variable name from x to y"` is noise. `"Database uses UTC timestamps, always convert to local on display"` is signal.
- **Don't skip `munin check`**. Stale memory is worse than no memory — it creates false confidence.

---

## 6. Error Recovery

Munin uses specific exit codes. When a command fails, read the `Suggestion` field in the output and follow the recovery path:

| Exit Code | Constant | Meaning | Agent Action |
|-----------|----------|---------|-------------|
| 0 | SUCCESS | Completed | Continue |
| 1 | GENERAL_ERROR | Unexpected failure | Read error message, retry once, report if persistent |
| 10 | AGENTS_MD_NOT_FOUND | No AGENTS.md in project | Create AGENTS.md with `## External Memory` section |
| 11 | AGENTS_MD_INVALID | Missing required fields | Fix AGENTS.md — ensure `- Memory Repo: <url>` is present |
| 12 | AGENTS_MD_PARSE_ERROR | Syntax error in AGENTS.md | Fix markdown syntax |
| 20 | MEMORY_REPO_NOT_FOUND | Memory repo missing locally | Run `munin init` |
| 21 | MEMORY_REPO_CLONE_FAILED | Can't clone remote repo | Check URL and git credentials |
| 22 | MEMORY_REPO_EMPTY | Repo exists but has no files | Run `munin init` to populate templates |
| 23 | MEMORY_REPO_CONFLICT | Merge conflicts detected | Resolve conflicts manually, then `munin pull` |
| 30 | FILE_NOT_FOUND | Referenced file doesn't exist | Check file name with `munin read` |
| 40 | GIT_NOT_INSTALLED | Git not in PATH | Install git |
| 41 | GIT_AUTH_FAILED | Authentication failure | Check SSH keys or HTTPS credentials |
| 42 | GIT_PUSH_FAILED | Push rejected | Pull first, resolve conflicts, retry |
| 50 | SECRET_DETECTED | Secret pattern found in content | Remove the secret before committing |
| 60 | UPDATE_NO_CHANGES | Nothing to commit | No action needed |
| 61 | UPDATE_PARSE_ERROR | Invalid JSON or malformed input | Fix syntax, use `--dry-run` to validate |
| 70 | CONFIG_INVALID | `.memory/config.json` is broken | Fix JSON syntax |
| 80 | NETWORK_ERROR | Network failure | Retry after checking connection |

All commands support `--json` flag for machine-readable output:

```bash
munin read --json
munin lint --json
munin check --json
```

---

## 7. Modes: Direct vs Review

### Direct Mode (default, solo dev)

Changes are committed and pushed directly to the default branch:

```bash
munin commit --reason "Added caching strategy to decisions"
# → commits to main, pushes immediately
```

Use when:
- You're the only agent or person writing to memory
- The project is personal or solo-developed
- Speed matters more than review

### Review Mode (teams)

Changes are committed to a branch and optionally submitted as a PR:

```bash
munin commit --reason "Added caching strategy to decisions" --pr
# → creates branch mem/<short-id>, pushes, opens PR via gh CLI
```

Use when:
- Multiple agents or humans share the memory repo
- You need approval before memory changes go live
- Compliance or audit requirements exist

Configure mode in `AGENTS.md`:

```markdown
## External Memory
- Memory Repo: https://github.com/org/memory.git
- Mode: review
```

Or override per-repo in `.memory/config.json`.

---

## 8. Complete Session Example

A reference workflow for a typical agent session:

```bash
# 1. Boot — load context
munin pull
munin read active-context.md
munin read tasks.md

# 2. Work — record a discovery
munin update --message "Found that user emails are case-sensitive in DB, causing duplicate accounts"

# 3. Work — log a decision
munin update --message "[file:decisions.md][section:Recent Decisions]Emails will be normalized to lowercase before DB insert. Migration needed for existing records."

# 4. Work — update task status
munin update --message "[file:tasks.md][section:Active]Fix email case-sensitivity causing duplicate accounts
[file:tasks.md][section:Completed]Investigated duplicate account reports (root cause: case-sensitive email comparison)"

# 5. Work — update focus
munin update --message "[file:active-context.md][section:Current Focus][action:replace]Fixing email normalization in auth service"

# 6. Validate before commit
munin check
munin lint

# 7. Commit and push
munin commit --reason "Documented email normalization decision and task progress"

# 8. Resolve an open question
munin update --message "[file:active-context.md][section:Open Questions][action:replace]Should we add support for PayPal or stick with Stripe only?
[file:active-context.md][section:Recent Changes]Resolved: sticking with Stripe only for MVP, PayPal can be added later if needed"
munin commit --reason "Resolved payment provider question"
```

---

## 9. Advanced: AGENTS.md Configuration

Full configuration reference:

```markdown
## External Memory
- Memory Repo: https://github.com/org/project-memory.git
- Local Path: ./docs/memory
- Default Branch: main
- Mode: direct

### Required Reads
- active-context.md
- tasks.md
- decisions.md

### Update Triggers
- start of work
- after architectural decision
- when task status changes
- at session end

### Commit Policy
- memory: update after <reason>

### Forbidden Actions
- never delete files without replacing them
- never store raw code snippets longer than 5 lines
- never modify project-brief.md without human approval
```

- **Required Reads** — files the agent must read at session start. If empty, defaults to `[_INDEX.md, active-context.md]`.
- **Update Triggers** — events that should prompt the agent to update memory.
- **Commit Policy** — format for commit messages. Default: `memory: update after <reason>`.
- **Forbidden Actions** — constraints on what the agent should not write to memory.
