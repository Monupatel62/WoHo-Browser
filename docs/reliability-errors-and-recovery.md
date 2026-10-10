# Reliability, Error States, and Recovery Specification

**Status:** Partially implemented; renderer/app crash recovery, network/TLS error UX, and several advanced recovery paths remain planned.

## Reliability goal
Fail visibly and recover safely rather than hang silently, lose data, or weaken security. Quantitative budgets are defined in the performance document and must be measured on declared hardware.

## Error categories
Define user-facing behavior for offline/network unavailable, DNS failure, connection refused/reset/timeout, TLS failure, unsupported scheme, blocked popup/permission/external protocol, interrupted download, destination unavailable, disk full, AI provider outage/invalid credential/quota/timeout/cancel, storage lock/corruption/migration failure, renderer crash, app startup failure, and updater failure. Explain what happened and the next safe action without exposing secrets, raw stack traces, sensitive URLs, or internal paths.

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
