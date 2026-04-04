# Progress Tracking

## Phase 1
- [x] Project initialization (`package.json`, `tsconfig.json`)
- [x] Base types
- [x] Agents parser (`agents-parser.ts`)
- [x] Frontmatter parser
- [x] Markdown utilities
- [x] CLI scaffold
- [x] Parser tests

## Phase 2
- [x] **2.1. git-exec** — Wrapper for `Bun.spawnSync("git")`
- [x] **2.2. git-ops** — Commands `status`, `fetch`, `pull`, `clone`, `init`
- [x] **2.8. conflict.ts** — Conflict detection (`status.conflicted`)
- [x] **2.3. file-templates** — Generation of 5 files + `_INDEX.md`
- [x] **2.4. memory-repo** — Memory repository initialization, validation, clone
- [x] **2.5. init command** — Init logic assembled into CLI command
- [x] **2.6. pull command** — Update logic with ahead/behind handling
- [x] **2.7. integration tests** — Git repository operation tests

## Phase 3
- [x] **3.1. read command** — `munin read [file]` command (with listing)
- [x] **3.2. updater.ts (JSON-patch)** — `applyPatchBatch` + rollback snapshot
- [x] **3.3. updater.ts (Text input)** — `parseTextInput` with inline markers
- [x] **3.4. update command** — `munin update` command (`--from-json`, `--message`, `--dry-run`)
- [x] **3.5. frontmatter update** — Auto-generated `modified` field
- [x] **3.6. index-builder.ts** — Auto-generation and truncation (`...`) of hook strings for `_INDEX.md`
- [x] **3.7. Unit tests** — Tests for updater and index-builder
- [x] **3.8. Integration tests** — E2E update mechanism testing with rollbacks

## Phase 4
- [x] **4.4. Secret pre-scan** — API key and password detection (scanner)
- [x] **4.5. Config loader** — `AGENTS.md` and `.memory/config.json` merging
- [x] **4.3. Commit message formatter** — Auto-formatting `memory: update after <reason>`
- [x] **4.1. commit command (direct)** — Direct commit to master with scanner
- [x] **4.2. commit command (review)** — Short-id branch generation and PR via GitHub CLI
- [x] **4.6. Integration tests** — Secret scanning and commit verification (no mocks)
- [x] **4.7. E2E smoke test** — Full scenario in `e2e-smoke.test.ts`

## Phase 5
- [x] **5.1. checker.ts** — Freshness check (default 30 days) by `last-verified`/`expires` fields
- [x] **5.3. linter.ts** — Processor with 12 strict validation rules from Appendix B
- [x] **5.2. check command** — `munin check` command registration and UI
- [x] **5.5. lint command** — `munin lint` command registration and UI
- [x] **5.6. Unit tests** — Linter rules and Checker tests
- [x] **5.7. Integration tests** — Linter repository operation tests

## Phase 6
- [x] **6.1. Error factory** — Standardized error format and suggestions
- [x] **6.2. --dry-run flag** — Global flag across all update commands
- [x] **6.3. Logger and --verbose / --quiet** — Logging levels for UI
- [x] **6.4. Autocomplete** — `munin completion` for zsh and bash
- [x] **6.5. Documentation** — `README.md` creation
- [x] **6.6-6.8. Articles** — Guides `getting-started`, `agents-md-spec`, `agent-integration`
- [x] **6.9. Examples** — Configuration sets in `examples/` folder

## Phase 7
- [x] **7.1. Extended tests** — Integration testing for `read` and `check` commands
- [x] **7.2. Error Scenarios** — Mock scenarios for error dictionary verification
- [x] **7.3. Cross-platform** — GitHub Actions CI (`.github/workflows/ci.yml`)
- [x] **7.5. Performance tests** — 100+ file initialization benchmark (2 sec limit)
- [x] **7.6. Load tests** — JSON batch 50+ items
