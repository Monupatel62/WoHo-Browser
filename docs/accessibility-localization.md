# Accessibility, Localization, and Input Specification

**Status:** Planned. Accessibility is a release requirement.

## Keyboard and focus
Every core action must be reachable without a pointer: address bar, tabs, navigation, menus, downloads, settings, permission prompts, AI panel, dialogs, and recovery screens. Focus order is predictable and never disappears behind overlays. Shortcuts are documented and do not unexpectedly conflict with OS/browser conventions.

## Dialogs and status
Every modal has an accessible name, initial focus, logical tab order, safe Escape behavior, and focus restoration. Destructive confirmations identify scope. Permission/certificate prompts are browser-controlled, not page-rendered. Loading/completion announcements avoid excessive repetition.

## Semantics and screen readers
Buttons, tabs, address field, menus, progress, toggles, and status messages expose meaningful roles/names/states. Icon-only controls have labels. Tab selection/loading/crash and download progress are programmatically exposed. Color alone cannot communicate status or group membership.

## Visual accessibility
Support text scaling/zoom, adequate contrast, non-color status indicators, reduced motion, clear error text, and narrow-window layouts. Avoid flashing content. Test light/dark/high-contrast settings where supported.

## Web content boundary
The browser cannot guarantee every site is accessible, but its chrome, prompts, menus, and error screens must be tested. Reader mode, if added, must preserve headings/lists/links and disclose incomplete extraction.

## Localization and international input
Keep user-visible strings separate from logic. Use locale-aware date/time/number formatting and a defined fallback language. URLs, paths, and protocol identifiers are not translated. Test IME composition, Unicode search, keyboard layouts, paste/selection, IDNs, and RTL if supported. Do not truncate important security identity details.

## Acceptance
Keyboard-only smoke tests, screen-reader checks on declared Windows versions, scaling/contrast, focus regression tests, localization audit, and accessibility review before release. Known gaps must be documented.
