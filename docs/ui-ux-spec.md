# WoHo Browser UI/UX and Trusted UI Specification

## Design goals
Use an original WoHo visual identity. Do not copy Chrome logos, proprietary icons, or protected assets.

## Browser chrome
Include tabs, address/search bar, navigation, downloads, bookmarks, and settings. Keep the trusted address bar separate from page title/favicon. Handle IDN homographs and long URLs carefully. Page content must never overlay or imitate trusted controls or confirmation dialogs.

## AI panel
The panel is optional. Show source/context and provider before remote submission. Render output without active HTML or remote images by default. Validate links and open only after user action. Confirmations must be rendered in trusted chrome.

## Accessibility
Provide keyboard navigation, visible focus, accessible names/roles, high contrast, text scaling, and no color-only status. Test Windows Narrator or NVDA before release.

## States and acceptance
Specify loading, offline, DNS/TLS failure, denied permission, download failure, renderer crash, AI timeout, and update failure. Test keyboard-only use, screen-reader workflows, HiDPI/scaling, and usability with target users. Record accessibility gaps before release.