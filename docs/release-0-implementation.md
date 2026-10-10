# Release 0 Implementation Status

**Status:** Browser shell and first bookmarks/history milestone implemented in code. This is a development prototype, not a production-ready browser.

## Implemented in code

- Electron desktop shell with React/TypeScript browser chrome.
- Electron `WebContentsView` per tab using a dedicated persistent browser session.
- Address bar with HTTPS-by-default bare hostnames and Google search fallback.
- Back, forward, reload/stop, open/close/select tabs, find-in-page with next/previous/count/clear, and keyboard shortcuts (including Ctrl+F).
- Narrow preload API and main-process IPC sender/frame checks.
- Website renderer settings: Node integration off, context isolation on, sandbox on, web security on.
- HTTP/HTTPS-only main-frame navigation, explicit subframe navigation policy (HTTP(S), inherited-origin `about:blank`/`about:srcdoc`, and web-origin `blob:` only), and denied popups. Right-clicking a valid HTTP(S) link offers Open Link in New Tab and Copy Link Address; new tabs inherit private mode. Allowlisted site permissions (media, geolocation, notifications, clipboard-read) use a native trusted prompt; decisions last for the app session and can be reset by clearing site data. Unknown permissions remain denied.
- Versioned local JSON store for bookmarks and history, using temporary-file replacement for writes.
- Session-only Site permissions panel to review decisions, block previously allowed capabilities, and forget decisions; unsupported capabilities remain denied.
- Private tabs with unique non-persistent Electron sessions, isolated cookies/storage/cache/permission decisions, a private-mode indicator and Ctrl+Shift+N shortcut; private visits are excluded from normal history and private downloads are not listed in normal download history.
- Bookmark add/remove/list UI, duplicate-URL handling, and versioned JSON bookmark import/export with bounded input, URL validation, transactional merge, and a warning before exporting potentially sensitive URLs.
- User-confirmed clear-site-data action for cookies, website storage, and cache; history and bookmarks remain separate.
- Initial download manager: each download is paused until the Save dialog returns a destination; progress/status, pause/resume/cancel where supported, and reveal completed file in folder.
- Bounded persistent normal-profile download history (up to 100 records), with query/fragment redaction, interrupted-state recovery after restart, a “Clear finished” action, and per-item removal of finished records without deleting saved files. Private downloads are excluded from the normal store.
- Startup recovery for corrupt or unsupported browser profile data and download-history files: the original file is preserved, a warning is shown, and the browser can continue using a separate recovery file (with a uniquely named fallback if the recovery file is also unreadable).
- Download source URLs are restricted to HTTP(S), embedded credentials are rejected, query/fragment values are not retained in UI metadata, and suggested filenames are sanitized.
- Chronological history UI, navigation from history, search, local-date filtering, individual deletion, inclusive date-range deletion, and clear-all history.
- Validation for saved URL schemes, URL length, embedded credentials, timestamps, schema version, record counts, duplicate bookmark/history/download IDs, and empty persisted IDs.
- Corrupt/unsupported/oversized storage data is rejected without silently overwriting the original file.
- Unit tests for navigation and context-menu link policy, browser data persistence/validation and URL-redaction migration, individual history deletion, saved-entry search, persistent download-history validation/retention/removal races, browser-data startup recovery fallback, download URL/filename safety policy, find-query validation, site permission origin/allowlist policy and prompt deduplication, exact renderer trust, IPC sender/main-frame authorization, frame navigation scheme policy, and private-tab history exclusion through WebContents destruction.
- Windows CI workflow for lint, typecheck, tests, dependency audit gate, build, unsigned NSIS packaging, and installer artifact upload.
- CodeQL workflow.

## Explicitly out of scope

- No AI assistant, AI agent, AI API, model download, or AI service calls are integrated.
- No password manager or credential storage.
- No sync, extension system, Safe Browsing integration, updater, or signed installer.
- Bookmark and history title/URL search plus individual history deletion are implemented. Bookmark folders, bookmark editing/reordering, import preview/per-row import reporting, history multi-select deletion and additional retention controls are not implemented yet.
- Download history is persisted locally and bounded; retry, open-after-completion, reputation scanning, and automatic partial-file cleanup are not implemented yet.
- History stores committed HTTP(S) navigation metadata only; this is not private browsing and should be treated as sensitive profile data.

## Storage design

The first milestone uses a versioned JSON document in Electron's user-data directory. Writes use a uniquely named temporary file followed by a rename, and queued writes are serialized. Unknown schema versions and malformed data are surfaced as errors rather than silently reset. SQLite remains a future option if query volume, transaction needs, or migrations outgrow this model. Passwords and API keys must never be stored in this file.

## Verification and remaining gates

- CI and CodeQL must pass for the exact pull-request head.
- Permission UI behavior has CI coverage through build/typecheck and permission-origin policy tests, but end-to-end native permission prompt/revocation behavior still needs Windows runtime testing.
- Private browsing has automated tests for history exclusion while a private tab is closing; Electron session isolation, on-disk cleanup, private download destination behavior, and Windows runtime behavior still require manual verification.
- Inspect the generated unsigned Windows installer artifact; successful packaging is not proof of a clean install or correct runtime behavior.
- Launch on Windows and test initial navigation, tab switching/closing, resize, history navigation, bookmark persistence after restart, history clearing after restart, popup denial, and unsupported schemes.
- IPC negative tests now cover trusted WebContents, main-frame-only calls, and renderer URL boundaries. Main-process end-to-end navigation and native permission prompt/revocation tests still need Windows runtime coverage.
- Complete threat-model review and dependency/license review before production release.
- Signing, update delivery, compatibility certification, and production security review are not complete.
