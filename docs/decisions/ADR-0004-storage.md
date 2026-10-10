# ADR-0004: Local Browser Storage

Status: Accepted for the first browser-data milestone; revisit if query or transaction requirements grow. Date: 2026-10-10.

## Decision

Use a versioned JSON document in Electron's user-data directory for the initial bookmarks and history milestone. The document has an explicit schema version, bounded record counts and file size, HTTP(S)-only URL validation, and validated timestamps. Writes are serialized and use a same-directory temporary file followed by rename. Invalid JSON, unsupported versions, oversized files, and invalid records fail closed and are not silently overwritten.

## Why this first

The current data set is small and has no relational queries or multi-record transactions. JSON avoids native database module rebuild and packaging risk while the app is a prototype. The implementation is isolated behind `BrowserDataStore` so it can be replaced if the requirements outgrow it.

## Revisit when

- Folders, import/export, bulk deletion, or migrations require stronger transactions.
- History query/filter volume makes bounded in-memory JSON impractical.
- Crash recovery or concurrent writers require database-level guarantees.

## Requirements and exclusions

- Keep the schema version explicit and validate stored records.
- Keep user data separate from cache.
- Never silently reset corrupted or unsupported data.
- Test persistence across instances, malformed files, unsupported versions, URL validation, and clear-history behavior.
- Do not store passwords, API keys, form contents, or page contents.
- No password manager, sync, or AI data store is part of this milestone.
