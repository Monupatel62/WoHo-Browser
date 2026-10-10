# Reliability, Error States, and Recovery Specification

**Status:** Partially implemented. Renderer-process crashes and main-frame navigation failures now produce trusted browser-chrome feedback with a user-triggered reload action. Common DNS, offline, timeout, refused-connection, and certificate failures receive safe messages; user-cancelled navigations are ignored. Optional normal-tab URL restore is implemented and off by default. Full Windows runtime verification remains outstanding.

## Reliability goal
Fail visibly and recover safely rather than hang silently, lose data, or weaken security. Quantitative budgets are defined in the performance document and must be measured on declared hardware.

## Error categories
Define user-facing behavior for offline/network unavailable, DNS failure, connection refused/reset/timeout, TLS failure, unsupported scheme, blocked popup/permission/external protocol, interrupted download, destination unavailable, disk full, AI provider outage/invalid credential/quota/timeout/cancel, storage lock/corruption/migration failure, renderer crash, app startup failure, and updater failure. Explain what happened and the next safe action without exposing secrets, raw stack traces, sensitive URLs, or internal paths.

## Navigation failure feedback
Implemented in code: main-frame navigation failures are surfaced in browser chrome with a reload action. Aborted navigations are ignored; certificate/TLS failures explicitly state that the connection was blocked and do not offer a bypass. Unknown failures use a generic message and do not display raw URLs, stack traces, or internal paths. The underlying Chromium error page may still be visible in the content view. Windows/Electron runtime checks remain required.

## Retry rules
Retries must be bounded and understandable. Do not automatically repeat form submissions, paid AI requests, file writes, or external launches. Cancel stale retries when the tab/request changes. Backoff must prevent request storms.

## Crash recovery
Detect renderer/app crash and present trusted recovery UI. Restore only safe URLs and approved metadata; never replay POSTs or privileged actions. Corrupt session data must not prevent a clean window from opening. Preserve safe backups where possible. Never restore private tabs into normal browsing. Prevent crash loops from repeatedly reopening the same broken page without user choice.

## Storage failures
Implemented: browser profile JSON and download-history corruption/unsupported-version recovery preserve the original file, show a warning, and switch to a separate recovery file (or a uniquely named fallback if that file is also unreadable). Unit tests cover preserving malformed data and selecting a fallback. Still planned: forced disk-full/write-failure testing, backup strategy, user-driven data export/recovery, and Windows runtime verification. Do not silently discard bookmarks/history/settings.

## Updater failures
Signature validation, rollback, partial-download cleanup, offline behavior, disk-full, and failed launch after update follow the update/signing specification. Never silently install an unsigned or unverified update.

## Diagnostics
Default diagnostics are minimal and local. User-triggered reports preview contents. Redact tokens, authorization headers, cookies, secret-like query values, local paths, prompts, and page content. Never attach the profile database automatically.

## Tests
Forced renderer crash, shutdown during writes, disk full, corrupt database, migration failure, network transitions, retry race, app relaunch loop, updater failure, private recovery, diagnostics redaction.
