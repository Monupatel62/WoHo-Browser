# Bookmarks, History, and Sessions Specification

**Status:** Partially implemented. First milestone includes add/remove/list bookmarks, duplicate URL handling, chronological HTTP(S) history, open-from-history, and clear-all. Remaining items below are planned unless explicitly marked implemented.

## Bookmarks
Fields: stable ID, title, URL, folder ID, timestamps, and optional tags. Implemented: add current page, delete, list, open in current tab, and update the title for an existing URL. Planned: edit, create/rename/move/delete folders, reorder, search, new-tab opening, import/export, and robust invalid-row reporting. Deleting a folder must state whether child bookmarks are deleted. Validate URL schemes and lengths; escape titles in UI.

## History
Store only necessary metadata such as URL, title, visit timestamp, and transition type. Define treatment of private visits, internal pages, failed navigations, redirects, and file URLs. Never store passwords, form contents, or page contents as history. Implemented: chronological list, open entry, and clear all. Planned: search, time filters, remove one, remove selected, and clear range. Verify that cleared entries no longer appear in storage-backed suggestions.

## Session restore
Restore safe URLs and approved tab metadata only. Do not persist live renderer objects, authentication tokens, cookies, or form state in a generic session file. Do not replay POST requests or privileged actions. Private tabs are excluded from normal-profile session restore.

## Consistency and recovery
Use transactions for related changes. Handle duplicate IDs, missing folders, invalid URLs, interrupted writes, locked databases, migration failures, and profile corruption. Never silently reset all data after a migration error. Provide a clear recovery/backup path where feasible.

## Import/export and retention
Document formats and versioning. Parse untrusted files with limits on size, row count, encoding, nesting, and URL schemes. Report invalid rows without crashing. Warn that export files contain sensitive data and ask for destination. Do not import executable code as trusted configuration. Maintain a clear map of which clear-data action affects history, cookies, cache, permissions, downloads metadata, AI history, and sessions. Do not promise forensic secure deletion from flash storage or backups.

## Tests
Restart persistence, delete verification, malformed/oversized imports, duplicate entries, invalid schemes, folder edge cases, interrupted transactions, migrations, private isolation, and session restore after crash.


## Current implementation note

The current JSON store is version 1 and caps the file at 4 MiB, bookmarks at 5,000, and history at 1,000 entries. It validates HTTP(S) URLs and refuses URLs containing embedded credentials. Private browsing does not exist yet, so users should treat the saved history as sensitive data. No AI history or AI integration is implemented.
