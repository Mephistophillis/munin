# Getting Started

This guide teaches you how to use Munin for saving knowledge and notes as an AI agent (or a human working with one).

## 1. Installation

You can run Munin using bunx:
```bash
bunx munin init
```

## 2. Configuration

Create `AGENTS.md` in the root of your target project:

```markdown
## External Memory
- Memory Repo: https://github.com/your-org/memory-repo.git
```

## 3. Initialization

Run `munin init`.
This will clone or create a local memory folder (`../project-memory` by default) and generate 5 default MVP templates:
- `project-brief.md`
- `active-context.md`
- `decisions.md`
- `tasks.md`
- `progress.md`

## 4. Updates

When working on code or learning new things, you can commit text updates:
```bash
munin update --message "- [2026-04-03] Added authentication feature"
```

This appends the log to the Recent Changes section of `active-context.md`.

## 5. Review & Push

Commit changes back to external storage:
```bash
munin commit --reason "Added authentication"
```

## 6. Keeping Memory Clean

Run checks regularly to ensure memory isn't filled with junk:
```bash
munin lint
munin check
```
