# Settings, Import/Export, and Data Portability

**Status:** Planned.

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
Candidate initial support: bookmarks and selected settings. History, passwords, extensions, cookies, and full profiles require separate decisions. Preview included categories/counts before applying. Validate format/version, encoding, size, row count, nesting, URL schemes, duplicate IDs, and paths. Report invalid rows without crashing. Apply transactionally or report partial imports clearly. Do not import executable extensions, preload scripts, certificates, or privileged policies from untrusted files.

Export files can contain sensitive data: warn, ask for destination, and avoid shared/public default directories. Do not overwrite current data without confirmation and a recoverable backup where feasible. No remote upload occurs as part of import/export.

## Reset and profile lifecycle
“Reset settings,” “clear browsing data,” “delete AI conversations,” and “remove profile” are different actions. Each must explain what remains. Profile deletion cannot target arbitrary webpage-supplied paths. Migration failure must not silently destroy the only copy.

## Version and diagnostics
Show app version, engine/runtime version where appropriate, update channel, release notes, and security policy. Default diagnostic bundles exclude credentials, page content, prompts, cookies, history, and file names. Expanded diagnostics preview contents and require opt-in.

## Tests
Defaults, validation, malformed imports, migration rollback, unknown future keys, duplicates, path traversal, export privacy, cancel mid-import, reset distinctions, and accessibility.
