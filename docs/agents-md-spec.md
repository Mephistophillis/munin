# AGENTS.md Specification

The `AGENTS.md` file defines where memory resides and how AI Agents should interact with it.

## Minimum Setup

```markdown
## External Memory
- Memory Repo: <git-url>
```

## Available Fields

- **Memory Repo** (URL) - Required. SSH or HTTPS string to your memory repo.
- **Local Path** (string) - Directory to store memory files relative to CWD. Default: `../project-memory`
- **Default Branch** (string) - Branch used for Git operations. Default: `main`
- **Mode** (direct|review) - Strategy for `munin commit`. Default: `direct`
- **Required Reads** (list) - List of files AI agent must read on start.

## Full Example

```markdown
## External Memory
- Memory Repo: https://github.com/org/memory.git
- Local Path: ./docs/memory
- Default Branch: master
- Mode: review
- Required Reads:
  - project-brief.md
  - active-context.md
```
