# Agent Integration

How to build tools for your LLM or AI agent to interact with Munin.

## General AI Protocol

1. **Start of Task**: Run `munin pull` and `munin read`.
2. **During Task**: Perform tasks, solve bugs, write code.
3. **Completion**: Use `munin update --message <msg>` to document resolutions and run `munin commit --reason <msg>`.

## Output Formats
All CLI commands support `--json` for robust programmatic consumption:
```bash
munin read --json
```

## Error Handling
Munin uses specific exit codes to signal what exactly went wrong. LLMs can easily parse stdout messages to find the `suggestion` block and run self-repair. 

## Dry Runs
AI Agents shouldn't push commits unexpectedly! Use the `--dry-run` flag in agents with lower autonomy limits:
```bash
munin commit --reason "Implemented AI Logic" --dry-run
```
