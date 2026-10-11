# WoHo Browser Feature Requirements

This document defines observable acceptance criteria. It does not mean features have been implemented.

## P0 — First usable browser
- **Launch:** application opens without an unhandled error and can close cleanly.
- **Address/search bar:** accepts a valid URL; plain text is sent to the selected search provider.
- **Navigation:** back, forward, reload, and stop behave correctly and show loading/error states.
- **HTTPS:** certificate errors are visible; there is no silent certificate bypass.
- **Tabs:** open, select, and close tabs; closing the last tab follows a documented behavior.
- **Popup handling:** unexpected windows are denied or shown through an explicit safe policy.
- **Crash recovery:** renderer crashes are surfaced in the affected tab and the user can explicitly reload it. Opt-in safe HTTP(S) URL session restore is implemented when enabled in Settings (off by default), including best-effort restore after an app crash from the last successfully saved snapshot. It restores URLs only, not form contents or guaranteed authentication state; storage failures and Windows runtime recovery still require manual verification.
- **Settings:** user can select a default search provider and manage basic startup behavior.

## P1 — Everyday productivity
- **Bookmarks:** add, edit, delete, and reopen bookmarks; data survives restart.
- **History:** list and clear records; clearing history is verified against storage.
- **Downloads:** show progress, destination, completion/failure, cancellation, and source URL; never auto-run downloads.
- **Session restore:** restore safe URLs and tab layout without restoring secrets into page scripts.
- **Keyboard access:** key navigation and focus indicators work for core controls.
- **Error handling:** offline, DNS, TLS, timeout, and provider failures have clear retry paths.

## P2 — Deferred browser improvements

Potential non-AI browser improvements must be explicitly approved, assigned a requirement ID, and given security, privacy, accessibility, and test plans before implementation. This section does not authorize new features.


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
- **R1-008:** Find-in-page and bounded per-tab zoom are implemented (Ctrl+Plus/Equals, Ctrl+Minus, Ctrl+0; zoom controls are available in Settings). Context menus currently support safe HTTP(S) link open/copy actions. Print/PDF export, fullscreen behavior, and default-browser registration are deferred: they require separate platform-specific UX, security, and Windows end-to-end validation before being exposed.

### R2 — Reserved; no current feature commitment

There are no R2 AI requirements. Any future R2 work must be a non-AI browser capability explicitly approved by the product owner before being added here.


### R3+ — Later validated features
- **R3-001:** Workspaces/tab groups and data import/export.
- **R3-002:** Extension strategy is validated before compatibility is promised.
- **R3-003:** Password management, passkeys, sync, enterprise policies, and DRM require separate security and feasibility decisions.
- AI agents and autonomous AI actions are out of scope; this is not a pending implementation item.

## Candidate performance budgets
See docs/performance-and-compatibility-budgets.md. The listed numbers are targets to validate on reference hardware, not measured performance claims.

## Scope alignment
Release mapping is R0 (feasibility/security foundation), R1 (Windows MVP), and later non-AI browser improvements only after explicit approval. Installer and default-deny permission policy are R0/R1 requirements; private browsing belongs in R1. A feature may be deferred only by recording a reason and updating the relevant release decision.


## Detailed feature acceptance IDs

These additional IDs connect the feature specifications to testable behavior. They remain proposed until release scope is approved.

### R1 — Windows MVP detail
- **R1-009 Address/search:** URL-versus-query classification is deterministic; malformed schemes cannot trigger local-file or external-app access.
- **R1-010 Navigation safety:** redirects are revalidated; unexpected popups and external protocols are denied or safely mediated.
- **R1-011 TLS:** certificate failures use browser-controlled UI and are never silently bypassed.
- **R1-012 Tab lifecycle:** loading, failure, close, crash, and safe reopen states are visible and tested.
- **R1-013 Bookmark CRUD:** add/edit/move/delete/search and folder behavior persist across restart.
- **R1-014 History deletion:** one-item, range, and full clear are verified against the actual data store and suggestion cache.
- **R1-015 Download safety:** destination, source, progress, cancellation, collision, failure, and partial-file cleanup are handled; downloaded files never auto-execute.
- **R1-016 Site permissions:** request and check handlers are installed; unknown requests default-deny; grants can be reviewed and revoked.
- **R1-017 Private session:** cookies, storage, cache, history, suggestions, permissions, and session restore are isolated according to documented engine guarantees.
- **R1-018 Settings:** values are validated, scoped, migrated, and reset according to documented semantics.
- **R1-019 Error recovery:** offline, DNS, timeout, TLS, storage, download, and renderer-crash states offer safe next steps.
- **R1-020 Accessibility:** all core browser-chrome actions are keyboard reachable with visible focus and accessible names/states.
- **R1-021 Data portability:** supported imports reject malformed/oversized files and report invalid records without crashing.
- **R1-022 Diagnostics:** default diagnostics exclude credentials, page contents, prompts, cookies, history, and filenames.
- **R1-023 Update integrity:** production update packages and metadata are verified before installation; invalid signatures fail closed.
- **R1-024 Runtime maintenance:** release process checks supported Electron/Chromium runtime status and relevant security advisories.
- **R1-025 File origin marking:** Windows download behavior documents and tests Mark-of-the-Web preservation where supported.

### R2 — No AI requirements

No AI acceptance IDs are active. AI assistant, agent, API/service, DevKit, model runtime, and AI data handling are out of scope and must not be implemented.


### R3 — Productivity and privacy (gated)
- **R3-004 Workspaces:** group/workspace create, rename, switch, move, and delete semantics are documented and tested before release.
- **R3-005 Reader view:** extracted content preserves meaningful structure and discloses incomplete extraction.
- **R3-006 Tracking protection:** filter source, update cadence, exception behavior, privacy impact, and maintenance ownership are approved before enabling.
- **R3-007 Import/export:** supported formats, limits, data categories, and deletion implications are documented.
- **R3-008 Feature gating:** extensions, sync, password management, autofill, enterprise policy, and DRM remain disabled/unpromised until separate ADRs and security reviews approve them.

### Cross-cutting verification rule
For every ID, the implementation PR must name the relevant test(s), attach or link CI evidence, note supported platform/runtime versions, and record known limitations. Mark a requirement **Verified** only after evidence is checked; documentation or a passing lint check alone is insufficient.
