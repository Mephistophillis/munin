# Munin

![Munin Logo](docs/images/logo.png)

> Git-native external memory bank for AI agents.

## Install

```bash
npm install -g munin
# or
bunx munin init
```

## Quick Start

1. Add `External Memory` section to `AGENTS.md`
2. Run `munin init`
3. Done — agents can now read/write memory

### Commands

| Command | Description |
|---------|-------------|
| `munin init` | Initialize memory repository |
| `munin pull` | Sync with remote |
| `munin read [file]` | Read file or list all files |
| `munin update` | Update memory files via JSON-patch or text messages |
| `munin commit --reason <msg>` | Commit and push changes |
| `munin check` | Check content freshness |
| `munin lint` | Validate repository structure and secrets |

### Example AGENTS.md

```markdown
## External Memory
- Memory Repo: https://github.com/my-org/my-project-memory.git
```

### Modes

- **direct** — auto-push to main branch (solo dev)
- **review** — branch + PR (team environments)

## Configuration

Configuration can be customized via `.memory/config.json`.

## License

MIT
