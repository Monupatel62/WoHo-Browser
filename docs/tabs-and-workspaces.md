# Tabs, Tab Lifecycle, and Workspaces Specification

**Status:** Partially implemented. Normal tabs can be reopened in memory with Ctrl+Shift+T; private tabs are never added to the recently-closed list. Duplicate, reorder, pin, mute, and multi-window movement remain planned. Workspaces are later-release candidates unless the roadmap explicitly changes.

## Tab model
A tab has a stable internal ID, title, current URL/origin metadata, loading state, favicon state, optional audio state, last-active time, and lifecycle status. Titles and favicons are untrusted; bound their length and render safely.

## Core actions
Open, select, close, and reopen recently closed normal tabs are implemented. Ctrl+Shift+T reopens the most recently closed normal tab. The in-memory list is bounded to 10 safe HTTP(S) URLs and is cleared when the application exits; private-tab URLs are never stored or restored. Reopen creates a fresh navigation and does not restore executable page state, form contents, cookies, or authentication. Duplicate, reorder, pin, mute, and move between windows remain planned. Closing a tab cancels tab-scoped work safely; the download manager owns active download lifecycle. Last-tab behavior remains an explicit open decision.

## Loading and crashes
Show loading, loaded, failed, and crashed states distinctly. Renderer crash uses a trusted recovery surface with Reload and Close. Do not automatically replay POST requests, form submissions, or privileged actions. A tab never inherits another tab's privileges.

## Session restore
Persist only user-approved safe URLs and metadata. Do not serialize live renderer objects, tokens, cookies, or form contents into generic session files. Private tabs/windows must never enter persistent normal-profile restore data. Restore is configurable and must avoid surprise restoration of sensitive state.

## Groups and workspaces
If implemented, groups need stable IDs, user-defined labels/colors, accessible state beyond color, safe metadata storage, and deterministic move/delete semantics. Workspaces are separate tab collections; switching must not silently close or navigate tabs. Deletion explains whether tabs close or move. Sync is not implied.

## Resource management
Define limits for excessive tabs, memory pressure, background throttling, sleep/discard, media, and wake-up. Avoid discarding detectable unsaved work without warning. Show a recoverable state after memory-saving discard.

## Accessibility
Document shortcuts for tab actions. Tabs need accessible names, selected state, loading/crash state, labeled close buttons, and a keyboard alternative to drag-reorder.

## Tests
Rapid open/close, ID collisions, popup-created tabs, redirects, crashes, close during download, forced shutdown restore, private exclusion from recently-closed memory, malformed URL rejection, retention cap, corrupted session file, many tabs, groups, keyboard navigation, and screen-reader state.
