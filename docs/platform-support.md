# Platform Support Matrix

**Status:** Windows prototype and initial Android/Web foundations exist in code; no production platform support is claimed.  
**Binding constraint:** AI features and integrations are out of scope.

## Product surfaces

| Platform | Intended product | Current evidence | Status |
|---|---|---|---|
| Windows x64 | Full desktop browser | Electron/Chromium + React/TypeScript prototype; packaged renderer startup smoke test passed in Windows CI, but clean-machine and release validation remain | In progress; not production-ready |
| Windows ARM64 | Full desktop browser if validated | No declared support matrix | Not committed |
| Android | Native mobile browser | Native Kotlin Android System WebView foundation with URL policy tests; device/runtime validation remains | Prototype foundation; not production-ready |
| Web | Responsive companion portal/PWA, documentation and optional local data tools | Static HTML/CSS/JS companion and local bookmark tools with Node tests/build checks; deployment and browser matrix remain | Prototype foundation; not a full browser engine |
| Linux | Desktop browser | No committed packaging/support matrix | Deferred |
| macOS | Desktop browser | No committed build/signing/QA matrix | Deferred |

## Product contract

- **Windows** is the first full browser target and remains the active implementation.
- **Android** uses a native Kotlin application and currently has a WebView feasibility prototype. WebView versus GeckoView remains a production engine decision; the Electron desktop app is not portable to Android as-is.
- **Web** means a companion website/PWA. A normal website cannot replace the host browser or safely browse arbitrary URLs with native browser privileges. Do not describe an iframe or proxy as a full browser.
- Platform feature parity is not assumed. Mark each feature as supported, unsupported, or deferred with evidence.

## Decisions required before release

### Windows
Minimum/tested Windows versions, CPU architecture, per-user/per-machine installation, signing/SmartScreen plan, installer/update mechanism, default-browser/protocol registration, data retention on uninstall, upgrade/rollback behavior, and support window.

### Android
Engine and version, minimum/target SDK, ABI/device coverage, permission policy, private-session isolation, signing-key custody, store compliance, upgrade/uninstall behavior, and support window.

### Web
Hosting/deployment, CSP/security headers, supported browser matrix, accessibility baseline, static asset/cache policy, artifact links/checksums, and whether safe local-only bookmark import/export is included. No server-side browsing data or file uploads by default.

## Support rule

A platform becomes supported only after its build, runtime, installation/deployment, security, privacy, accessibility, and release test matrix passes. Current Android/Web code is an initial foundation, not a release claim. A directory, mockup, CI build, or document is not proof of implementation. See [cross-platform strategy](cross-platform-product-strategy.md), [Windows plan](windows-application-plan.md), [Android plan](android-application-plan.md), [Web plan](web-application-plan.md), and [acceptance matrix](cross-platform-acceptance-matrix.md).
