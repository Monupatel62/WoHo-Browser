# Platform Support Matrix

**Status:** Product direction proposed; only Windows has an existing code prototype. No production platform support is claimed.  
**Binding constraint:** AI features and integrations are out of scope.

## Product surfaces

| Platform | Intended product | Current evidence | Status |
|---|---|---|---|
| Windows x64 | Full desktop browser | Electron/Chromium + React/TypeScript prototype and Windows CI; packaged renderer startup has an unresolved failure in the current security PR | In progress; not production-ready |
| Windows ARM64 | Full desktop browser if validated | No declared support matrix | Not committed |
| Android | Native mobile browser | No Android app implementation verified | Planned; engine feasibility required |
| Web | Responsive companion portal/PWA, documentation and optional local data tools | No deployed companion implementation verified | Planned; not a full browser engine |
| Linux | Desktop browser | No committed packaging/support matrix | Deferred |
| macOS | Desktop browser | No committed build/signing/QA matrix | Deferred |

## Product contract

- **Windows** is the first full browser target and remains the active implementation.
- **Android** requires a native application and an explicit engine decision (Android WebView versus GeckoView). The Electron desktop app is not portable to Android as-is.
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

A platform becomes supported only after its build, runtime, installation/deployment, security, privacy, accessibility, and release test matrix passes. A directory, mockup, CI build, or document is not proof of implementation. See [cross-platform strategy](cross-platform-product-strategy.md), [Windows plan](windows-application-plan.md), [Android plan](android-application-plan.md), [Web plan](web-application-plan.md), and [acceptance matrix](cross-platform-acceptance-matrix.md).
