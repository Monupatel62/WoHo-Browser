# WoHo Browser UI/UX and Trusted UI Specification

> Scope: conventional browser only. AI panels, AI controls, AI providers, and AI-related UI are out of scope and must not be designed or implemented.

## Design goals
Use an original WoHo visual identity. Do not copy Chrome logos, proprietary icons, or protected assets.

## Browser chrome
Include tabs, address/search bar, navigation, downloads, bookmarks, and settings. Keep the trusted address bar separate from page title/favicon. Handle IDN homographs and long URLs carefully. Page content must never overlay or imitate trusted controls or confirmation dialogs.

## Accessibility
Provide keyboard navigation, visible focus, accessible names/roles, high contrast, text scaling, and no color-only status. Test Windows Narrator or NVDA before release.

## States and acceptance
Specify loading, offline, DNS/TLS failure, denied permission, download failure, renderer crash, and update failure. Test keyboard-only use, screen-reader workflows, HiDPI/scaling, and usability with target users. Record accessibility gaps before release.
