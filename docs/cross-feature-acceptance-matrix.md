# Cross-Feature Acceptance and Edge-Case Matrix

**Status:** Test inventory only; not evidence that tests exist or pass.

## Required test dimensions
| Dimension | Questions |
|---|---|
| Normal flow | Does the user complete the task with correct visible state? |
| Invalid input | Are malformed URLs, files, settings, and IDs rejected safely? |
| Denial | Does permission denial fail closed without error loops? |
| Network | What happens offline, on timeout, TLS failure, and reconnect? |
| Concurrency | What if the user closes, switches, retries, or repeats during a pending action? |
| Persistence | Does only the intended state survive restart? |
| Deletion | Does deletion cover every documented store and no unrelated category? |
| Private session | Is private data isolated and non-persistent as promised? |
| Crash/recovery | Can failure happen without privilege escalation or silent data loss? |
| Accessibility | Do keyboard, focus, accessible names/state, scaling, and screen readers work? |
| Privacy | Are URLs, page contents, credentials, and filenames excluded from telemetry by default? |
| Security | Can untrusted page or renderer content reach privileged functions without validation? |
| Platform | Does behavior match the declared OS/version matrix? |
| Upgrade | Does user data survive supported upgrades and failed migrations? |

## Required adversarial scenarios
- Website spoofs browser chrome, permission prompt, or certificate warning.
- Redirect reaches unsupported scheme or local resource.
- Title/favicon/filename contains markup, controls, path separators, or extreme length.
- Popup storm or rapid navigation exhausts resources.
- Renderer sends malformed, oversized, unauthorized, or replayed IPC.
- Private tab is closed and normal profile is checked for leaked history or session data.
- Download is canceled while completing, app exits mid-write, or destination disappears.
- Profile database is corrupted during migration.
- Update has invalid signature, interrupted transfer, or downgrade attempt.
- History is cleared while tabs or other local UI state still reference prior data.
- Accessibility focus becomes trapped in a permission/recovery dialog.

## Traceability fields
Every requirement record should include ID, release, user value, priority, source document, status, test names, latest CI run, security review status, and known limitations. Suggested statuses: Proposed, Approved, In progress, Implemented, Verified, Deferred, Rejected. Implemented without evidence is not Verified.

## Release gates
Do not release with unresolved critical security issues, an end-of-life runtime, unproven update integrity, untested data-deletion promises, or release-blocking accessibility defects in core navigation. Exceptions require written risk acceptance with owner, rationale, scope, expiry/review date, and mitigation.

## Minimum per-feature tests
Navigation: URL parsing, redirects, unsupported scheme, certificate, external protocol, popup.
Tabs: close/reopen, crash, restore, private isolation, resource pressure.
Bookmarks/history: CRUD, deletion, corrupt storage, import/export, migration.
Downloads: traversal, collision, cancel race, disk full, Mark-of-the-Web, open confirmation.
Permissions: unknown capability, denial, grant, revocation, private profile, spoofed origin.
Settings: validation, defaults, reset, migration rollback, invalid import.
Updates: signature, interrupted update, rollback/recovery, unsupported runtime block.
Accessibility: keyboard-only flow, focus, screen-reader state, zoom/scaling, reduced motion.
