# Bookmarks, History, and Sessions Specification

**Status:** Partially implemented. First milestone includes add/remove/list bookmarks, duplicate URL handling, chronological HTTP(S) history, open-from-history, per-entry history deletion, and clear-all. Remaining items below are planned unless explicitly marked implemented.

## Bookmarks
Fields: stable ID, title, URL, folder ID, timestamps, and optional tags. Implemented: add current page, edit title and URL, delete, list, reorder by moving entries up/down, open in current or new tab, update the title for an existing URL, and versioned JSON import/export with size/row/URL validation and transactional merge. Editing validates HTTP(S) URLs, rejects duplicate URLs, preserves the bookmark ID and creation timestamp, and updates the modified timestamp. Export warns that saved URLs may be sensitive. Import uses a trusted native preview with row-level invalid/duplicate reporting; the user can cancel or import only validated rows. Planned: create/rename/move/delete folders. Case-insensitive title/URL search is implemented in the Bookmarks panel. Deleting a folder must state whether child bookmarks are deleted. Validate URL schemes and lengths; escape titles in UI.

## History
Store only necessary metadata such as URL, title, visit timestamp, and transition type. Define treatment of private visits, internal pages, failed navigations, redirects, and file URLs. Never store passwords, form contents, or page contents as history. Implemented: chronological list, open entry in current or new tab, remove one entry, multi-select deletion of visible entries, clear all, local-date filtering, and inclusive date-range deletion. Additional retention controls remain planned. Case-insensitive title/URL search is implemented in the History panel. Verify that cleared entries no longer appear in storage-backed suggestions.

## Session restore
Implemented as an explicit opt-in setting, off by default. When enabled, up to 50 normal-tab HTTP(S) URLs are saved locally and reopened on startup; private tabs are excluded. The store validates schemes, URL length, count, and embedded credentials, and corrupt session files are preserved while a separate recovery file is used. URLs may still contain sensitive query values, so the Settings panel discloses this before enabling restore. Only URLs are restored: cookies are not exported by this feature, and POST requests or privileged actions are never replayed. Full Windows restart/crash runtime testing remains outstanding.

## Consistency and recovery
Use transactions for related changes. Handle duplicate IDs, missing folders, invalid URLs, interrupted writes, locked databases, migration failures, and profile corruption. Never silently reset all data after a migration error. Provide a clear recovery/backup path where feasible.

## Import/export and retention
Document formats and versioning. Parse untrusted files with limits on size, row count, encoding, nesting, and URL schemes. Report invalid rows without crashing. Warn that export files contain sensitive data and ask for destination. Do not import executable code as trusted configuration. Maintain a clear map of which clear-data action affects history, cookies, cache, permissions, downloads metadata, AI history, and sessions. Do not promise forensic secure deletion from flash storage or backups.

## Tests
Restart persistence, delete verification, malformed/oversized imports, duplicate entries, invalid schemes, folder edge cases, interrupted transactions, migrations, private isolation, and session restore after crash.


## Current implementation note

The current JSON store is version 1 and caps the file at 4 MiB, bookmarks at 500, history at 500 entries, and saved URLs at 2,048 characters. It validates HTTP(S) URLs and refuses URLs containing embedded credentials. Private tabs use isolated non-persistent sessions and are excluded from normal history; users should still treat saved normal-profile history as sensitive data. No AI history or AI integration is implemented.
