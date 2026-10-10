# Release 0 Implementation Status

**Status:** Browser shell and first bookmarks/history milestone implemented in code. This is a development prototype, not a production-ready browser.

## Implemented in code

- Electron desktop shell with React/TypeScript browser chrome.
- Electron `WebContentsView` per tab using a dedicated persistent browser session.
- Address bar with HTTPS-by-default bare hostnames and Google search fallback.
- Back, forward, reload/stop, open/close/select tabs, find-in-page with next/previous/count/clear, and keyboard shortcuts (including Ctrl+F).
- Narrow preload API and main-process IPC sender/frame checks.
- Website renderer settings: Node integration off, context isolation on, sandbox on, web security on.
- HTTP/HTTPS-only navigation targets, denied popups, and deny-by-default site permissions.
- Versioned local JSON store for bookmarks and history, using temporary-file replacement for writes.
- Bookmark add/remove/list UI and duplicate-URL handling.
- Initial download manager: Save dialog per download, progress/status, pause/resume/cancel where supported, and reveal completed file in folder.
- Download source URLs are restricted to HTTP(S), embedded credentials are rejected, query/fragment values are not retained in UI metadata, and suggested filenames are sanitized.
- Chronological history UI, navigation from history, and clear-all history.
- Validation for saved URL schemes, URL length, embedded credentials, timestamps, schema version, record counts, and duplicate bookmark IDs.
- Corrupt/unsupported/oversized storage data is rejected without silently overwriting the original file.
- Unit tests for navigation, browser data persistence/validation, download URL/filename safety policy, and find-query validation.
- Windows CI workflow for lint, typecheck, tests, dependency audit gate, build, unsigned NSIS packaging, and installer artifact upload.
- CodeQL workflow.

## Explicitly out of scope

- No AI assistant, AI agent, AI API, model download, or AI service calls are integrated.
- No password manager or credential storage.
- No sync, private browsing, extension system, Safe Browsing integration, updater, or signed installer.
- Bookmark folders, import/export, edit/reorder/search, and selective history deletion/time filters are not implemented yet.
- Download history is in-memory only; no retry, remove-from-list, or open-after-completion controls yet.
- History stores committed HTTP(S) navigation metadata only; this is not private browsing and should be treated as sensitive profile data.

## Storage design

The first milestone uses a versioned JSON document in Electron's user-data directory. Writes use a uniquely named temporary file followed by a rename, and queued writes are serialized. Unknown schema versions and malformed data are surfaced as errors rather than silently reset. SQLite remains a future option if query volume, transaction needs, or migrations outgrow this model. Passwords and API keys must never be stored in this file.

## Verification and remaining gates

- CI and CodeQL must pass for the exact pull-request head.
- Inspect the generated unsigned Windows installer artifact; successful packaging is not proof of a clean install or correct runtime behavior.
- Launch on Windows and test initial navigation, tab switching/closing, resize, history navigation, bookmark persistence after restart, history clearing after restart, popup denial, and unsupported schemes.
- Add IPC negative tests and automated main-process navigation/permission tests.
- Complete threat-model review and dependency/license review before production release.
- Signing, update delivery, compatibility certification, and production security review are not complete.
