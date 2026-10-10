# Bookmarks, History, and Sessions Specification

**Status:** Planned.

## Bookmarks
Fields: stable ID, title, URL, folder ID, timestamps, and optional tags. Required actions: add current page, edit, delete, create/rename/move/delete folders, reorder, search, open in current/new tab, import/export, and handle duplicates/invalid rows. Deleting a folder must state whether child bookmarks are deleted. Validate URL schemes and lengths; escape titles in UI.

## History
Store only necessary metadata such as URL, title, visit timestamp, and transition type. Define treatment of private visits, internal pages, failed navigations, redirects, and file URLs. Never store passwords, form contents, or page contents as history. Provide chronological list, search, time filters, remove one, remove selected, clear range, and clear all. Verify that cleared entries no longer appear in storage-backed suggestions.

## Session restore
Restore safe URLs and approved tab metadata only. Do not persist live renderer objects, authentication tokens, cookies, or form state in a generic session file. Do not replay POST requests or privileged actions. Private tabs are excluded from normal-profile session restore.

## Consistency and recovery
Use transactions for related changes. Handle duplicate IDs, missing folders, invalid URLs, interrupted writes, locked databases, migration failures, and profile corruption. Never silently reset all data after a migration error. Provide a clear recovery/backup path where feasible.

## Import/export and retention
Document formats and versioning. Parse untrusted files with limits on size, row count, encoding, nesting, and URL schemes. Report invalid rows without crashing. Warn that export files contain sensitive data and ask for destination. Do not import executable code as trusted configuration. Maintain a clear map of which clear-data action affects history, cookies, cache, permissions, downloads metadata, AI history, and sessions. Do not promise forensic secure deletion from flash storage or backups.

## Tests
Restart persistence, delete verification, malformed/oversized imports, duplicate entries, invalid schemes, folder edge cases, interrupted transactions, migrations, private isolation, and session restore after crash.
