# WoHo Browser Feature Requirements

This document defines observable acceptance criteria. It does not mean features have been implemented.

## P0 — First usable browser
- **Launch:** application opens without an unhandled error and can close cleanly.
- **Address/search bar:** accepts a valid URL; plain text is sent to the selected search provider.
- **Navigation:** back, forward, reload, and stop behave correctly and show loading/error states.
- **HTTPS:** certificate errors are visible; there is no silent certificate bypass.
- **Tabs:** open, select, and close tabs; closing the last tab follows a documented behavior.
- **Popup handling:** unexpected windows are denied or shown through an explicit safe policy.
- **Crash recovery:** a renderer crash does not silently grant extra privileges; the user can restore safe tab URLs.
- **Settings:** user can select a default search provider and manage basic startup behavior.

## P1 — Everyday productivity
- **Bookmarks:** add, edit, delete, and reopen bookmarks; data survives restart.
- **History:** list and clear records; clearing history is verified against storage.
- **Downloads:** show progress, destination, completion/failure, cancellation, and source URL; never auto-run downloads.
- **Session restore:** restore safe URLs and tab layout without restoring secrets into page scripts.
- **Keyboard access:** key navigation and focus indicators work for core controls.
- **Error handling:** offline, DNS, TLS, timeout, and provider failures have clear retry paths.

## P2 — AI assistant
- AI actions require a user gesture.
- User can inspect context before remote submission.
- Provider and privacy/cost information are visible.
- Responses show source excerpts or page references where feasible.
- Timeouts, cancellation, oversized responses, and provider failures are handled.
- AI text cannot invoke privileged APIs directly.
- Sensitive actions always require a separate permission check and confirmation.

## P3 — Advanced features
- Workspaces/tab groups, reader view, data import/export.
- Configurable tracking protection after filter-update policy is defined.
- Extension support only after compatibility and security requirements are tested.
- Sync only after encryption, account recovery, conflict resolution, and deletion semantics are designed.
- Enterprise policy controls only after a real target-customer need is validated.

## Acceptance evidence
Every feature needs tests for normal behavior, invalid input, denial/failure behavior, restart behavior where relevant, and security boundaries. Link test names and CI runs in the implementation PR.


## Requirement IDs and release mapping
These IDs are the source of truth for acceptance tracking. A requirement is not complete until implementation and test evidence exist.

### R0 — Feasibility and security foundation
- **R0-001:** Launch a desktop shell and close cleanly.
- **R0-002:** Open an HTTPS URL and handle network/TLS errors without bypassing certificate validation.
- **R0-003:** Separate trusted browser chrome from untrusted website content using the selected view model.
- **R0-004:** Enforce URL-scheme and navigation policy; deny unexpected popups.
- **R0-005:** Install permission request/check handlers and default-deny unknown requests.
- **R0-006:** Validate privileged IPC sender, schema, size, and operation.
- **R0-007:** Package a development build and record installer/update feasibility.
- **R0-008:** Establish lint, type-check, test, and dependency/secret scanning in CI.

### R1 — Windows MVP
- **R1-001:** Back/forward/reload/stop and address/search bar work.
- **R1-002:** Multiple tabs, switching, close, and renderer-crash recovery work.
- **R1-003:** Bookmarks and history persist and support deletion.
- **R1-004:** Downloads show source, destination, progress, cancellation, and errors; no automatic execution.
- **R1-005:** Private browsing uses a non-persistent session and does not write private visits to normal history.
- **R1-006:** Settings include default search provider and basic startup behavior.
- **R1-007:** Installer, uninstall, version display, and documented update behavior work on the declared Windows matrix.
- **R1-008:** Find-in-page, zoom, print/PDF, context menus, fullscreen behavior, and default-browser registration are evaluated and either implemented or explicitly deferred with reasons.

### R2 — User-controlled AI
- **R2-001:** AI requests require explicit user action.
- **R2-002:** Show context/provider before remote submission.
- **R2-003:** Render output safely without active HTML or remote images by default.
- **R2-004:** Apply timeout, cancellation, response-size, and cost/rate limits.
- **R2-005:** AI responses cannot call privileged APIs or perform actions directly.

### R3+ — Later validated features
- **R3-001:** Workspaces/tab groups and data import/export.
- **R3-002:** Extension strategy is validated before compatibility is promised.
- **R3-003:** Password management, passkeys, sync, enterprise policies, and DRM require separate security and feasibility decisions.
- **R4-001:** Autonomous agent actions remain blocked until the agent security design is reviewed.

## Candidate performance budgets
See docs/performance-and-compatibility-budgets.md. The listed numbers are targets to validate on reference hardware, not measured performance claims.

## Scope alignment
Master-plan release names map to R0/R1/R2/R3/R4 above. Installer and default-deny permission policy are R0/R1 requirements; private browsing belongs in R1. A feature may be deferred only by recording a reason and updating the relevant release decision.
