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
