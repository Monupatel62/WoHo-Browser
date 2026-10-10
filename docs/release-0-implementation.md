# Release 0 Implementation Status

**Status:** Initial code scaffold and browser navigation vertical slice committed on `feat/release-0-browser-prototype`. This is not yet a production-ready browser.

## Implemented in this branch (code present; runtime verification pending)

- Electron desktop shell with React/TypeScript browser chrome.
- Electron `WebContentsView` per tab using a dedicated browser session.
- Address bar with HTTPS-by-default bare hostnames and Google search fallback.
- Back, forward, reload/stop, open tab, close tab, and select tab controls, including Ctrl+R and Escape shortcuts.
- Narrow preload API and main-process IPC sender/frame checks.
- Website renderer settings: Node integration off, context isolation on, sandbox on, web security on.
- HTTP/HTTPS-only navigation targets and denied popup windows.
- Site permission request/check handlers default to deny.
- Unit tests for address parsing and allowed protocols.
- Windows CI workflow for typecheck, tests, and application build.

## Not implemented / not yet verified

- No local build or test run has been executed by this change authoring environment. CI must run against the branch and failures must be fixed.
- CI now attempts to create an unsigned Windows NSIS installer and upload it as a short-lived workflow artifact. Successful packaging and clean install/uninstall must be verified from the run; it is not signed.
- No updater, Safe Browsing/phishing reputation integration, download manager, bookmarks/history UI, private sessions, extension system, sync, or AI assistant yet.
- No security audit, compatibility certification, or production security claim.
- Permission requests are denied globally in this first slice; there is no user-facing per-site permission manager yet.
- The default search provider is currently Google and must be documented as a configurable setting before MVP.

## Local development

Requirements: Node.js 24 LTS (Electron 44 embeds Node 24) and npm.

```bash
npm install
npm run typecheck
npm test
npm run dev
```

Build the app bundles with `npm run build`. On Windows, build an unsigned development installer with `npm run package:win`. Signing, update delivery, and production release are deliberately not configured.

## Release 0 acceptance gates

1. CI typecheck, tests, and build pass on the branch.
2. Launch the desktop app on Windows and confirm initial HTTPS navigation works.
3. Confirm tab selection/close, history navigation, reload, resizing, and popup denial.
4. Add negative tests for IPC sender rejection and unsupported schemes.
5. Verify packaged runtime paths and test clean install/uninstall before calling the installer usable.
6. Complete threat-model review before exposing additional capabilities.
