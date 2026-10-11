# Settings, Import/Export, and Data Portability

**Status:** Partially implemented. A validated local settings store and UI support selecting Google, Bing, or DuckDuckGo as the default search provider, configuring an HTTP(S) home/new-tab URL, and opting into restoration of up to 50 normal-tab URLs on startup. Session restore is off by default and private tabs are excluded. General settings import/export remains planned.

## Settings contract
Every setting requires a default, type/range, persistence scope (global/profile/session), immediate or restart-required effect, migration behavior, and reset behavior. Do not display settings without implementation. Reject unknown keys, invalid types, oversized strings, malformed URLs, unsupported provider templates, and out-of-range values. Corrupt settings should fall back safely and be reported.

## Initial settings groups
- Startup: home/new-tab, restore safe tabs, crash-reopen behavior.
- Search: default provider, local/remote suggestion toggles and disclosure.
- Appearance: light/dark/system, zoom defaults, density if supported.
- Downloads: destination behavior, ask-before-save, notifications, list retention.
- Privacy: clear-data categories, private-mode explanation, optional diagnostics consent.
- Site controls: per-origin permission review/revocation.
- AI: enable/disable, provider/model, context preview, retention, usage/cost notices.
- Accessibility: text scaling, reduced motion, keyboard behavior, contrast support.
- Advanced: reset settings, profile location info, version/build, diagnostic export.

## Import/export
Implemented: bookmarks-only JSON import/export with format/version validation, a 1 MiB file limit, at most 500 entries, HTTP(S)-only URLs, embedded-credential rejection, and URL deduplication. Before import, a trusted native dialog previews counts for new and updated bookmarks, duplicate rows, and invalid rows. The user can cancel or import only validated rows; invalid and duplicate rows are skipped with row-number/reason reporting (up to 12 rows shown, with the remaining count disclosed). A 500-bookmark capacity overflow blocks the import without changing current bookmarks. Export asks for a destination and warns that saved URLs may be sensitive. General settings import/export remains planned. History, passwords, extensions, cookies, and full profiles require separate decisions. Do not import executable extensions, preload scripts, certificates, or privileged policies from untrusted files.

Export files can contain sensitive data: warn, ask for destination, and avoid shared/public default directories. Do not overwrite current data without confirmation and a recoverable backup where feasible. No remote upload occurs as part of import/export.

## Reset and profile lifecycle
“Reset settings,” “clear browsing data,” “delete AI conversations,” and “remove profile” are different actions. Each must explain what remains. Profile deletion cannot target arbitrary webpage-supplied paths. Migration failure must not silently destroy the only copy.

## Version and diagnostics
Show app version, engine/runtime version where appropriate, update channel, release notes, and security policy. Default diagnostic bundles exclude credentials, page content, prompts, cookies, history, and file names. Expanded diagnostics preview contents and require opt-in.

## Tests
Defaults, validation, malformed imports, migration rollback, unknown future keys, duplicates, path traversal, export privacy, cancel mid-import, reset distinctions, and accessibility.
