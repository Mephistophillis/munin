# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-04-04

### Added
- **CLI Core**: Basic commands `init`, `pull`, `read`, `update`, `commit`, `check`, `lint`.
- **Git Sync**: Support for remote memory repositories via Git.
- **Linter**: Validation of MVP file structure and frontmatter compliance.
- **Secret Scanner**: Pre-commit scanning for common sensitive patterns (API keys, etc.).
- **Smart Updates**: Support for JSON patches and marker-based text updates.
- **Automatic Indexing**: `_INDEX.md` is automatically updated on every change.
- **Standalone Binary**: Compilation support for Windows (`munin.exe`).

### Fixed
- Improved template path resolution for compiled binaries.
- Fixed linter false positives for `.git` internal directories.
- Relaxed frontmatter requirements for `README.md`.
- Added intuitive `--patch` alias for `update` command.

---
*Munin: Git-native external memory bank*
