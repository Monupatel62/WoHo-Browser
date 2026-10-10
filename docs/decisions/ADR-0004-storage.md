# ADR-0004: Local Browser Storage

Status: Open; decide after a data-model prototype. Date: 2026-10-10.

Compare SQLite with an Electron-compatible driver, versioned JSON for simple settings, and a justified hybrid. SQLite introduces native-module rebuild and packaging considerations.

## Decision criteria
Migration safety, transactions, query needs, corruption recovery, export/deletion, native-module maintenance, and packaging.

## Requirements
- Versioned schema and tested migrations.
- Atomic writes or transactions where appropriate.
- Separate user data from cache.
- Export and deletion behavior for user-facing records.
- No passwords or API keys in plain settings files.
- Tests for interrupted writes, corruption, upgrades, and clear-history behavior.

Do not implement password storage or sync in the first storage milestone. Record the selected engine and driver after a working prototype.