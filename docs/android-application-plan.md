# WoHo Browser — Android Application Plan

**Status:** Initial native WebView foundation implemented in the development branch; device/runtime validation and release gates remain open  
**AI scope:** No AI features, services, models, agents, or AI SDKs.

## 1. Goal

Build a native Android mobile browser, not a WebView wrapper around the Windows desktop app. It should provide reliable mobile browsing, touch-friendly tabs, address/search, bookmarks/history, downloads, site permissions, private browsing, settings, and Android lifecycle behavior.

## 2. Engine feasibility decision

The initial Android shell uses Android System WebView as a feasibility spike only. This is not a production engine decision. Before expanding the implementation or advertising support, compare:

- **Android System WebView:** smaller integration surface and platform-managed updates; behavior follows the installed WebView provider and Android version.
- **GeckoView:** browser-focused embeddable engine with its own integration and update/compatibility responsibilities.

Evaluate supported Android API levels, security patch cadence, site compatibility, media playback, downloads, permission mediation, private-session isolation, licensing, binary size, performance, accessibility, and long-term maintenance. Record the result in a new ADR. Do not select based on convenience alone and do not claim Chromium parity without tests.

## 3. Initial implementation status

The current development foundation includes HTTP/HTTPS address/search validation, multiple tabs, back/forward/reload, local bookmarks and bounded local history with a clear-history action; history URLs have query strings and fragments stripped before persistence, including legacy entries migrated at startup, visible HTTP-versus-HTTPS status, and downloads through Android DownloadManager. WebView file/content access is disabled, mixed content is blocked, Safe Browsing is enabled, no native JavaScript bridge is exposed, and TLS errors are cancelled.

Malformed or oversized bookmark/history stores are treated as unreadable rather than silently replaced; the recovery warning now offers a user-selected raw backup export. The Android document-picker flow still requires physical-device verification.

Not yet implemented or release-verified: private browsing with proven cookie/cache isolation, custom site-permission UI/revocation, settings UI, bookmark import/export, full error/recovery UX, complete TalkBack/accessibility review, supported-device matrix, signing, and production release. The build and unit-test results must be taken from the exact implementation PR, not inferred from this document.

## 4. Proposed MVP capabilities

- First-run explanation and safe default home/new-tab page.
- URL/search field with validated HTTP/HTTPS navigation and clear loading state.
- Back, forward, reload, stop, page progress, and recoverable error states.
- Tab switcher with create/close/switch behavior and a documented last-tab policy.
- Bookmarks: add, edit, remove, list, and reopen.
- History: list, search/filter if supported, clear all/range, and verify deletion.
- Downloads: user-visible source, progress, destination, completion/failure, cancellation where supported, and no automatic execution.
- Site permission prompts for supported capabilities with deny-by-default behavior and revocation controls.
- Private tabs/sessions with explicit isolation and cleanup behavior; do not assume incognito behavior without tests.
- Settings: default search provider, startup/home behavior, privacy/data clearing, downloads, appearance, and supported accessibility options.
- Share/open-in flows using Android intents with validated URLs and safe external-app handling.
- Predictable behavior on rotation, background/foreground, process death, low memory, and OS recreation.
- TalkBack support, large text, touch targets, dark/light theme, and keyboard/external input where relevant.

## 5. Security and privacy requirements

- No JavaScript bridge that exposes filesystem, intents, account tokens, or privileged native methods to arbitrary web pages.
- If any native bridge is necessary, expose a tiny origin-restricted API with strict schema validation and regression tests.
- Reject dangerous schemes and malformed URLs; external protocol handoff must be explicit and allowlisted.
- Never ignore TLS/certificate errors or provide a bypass button without a separately reviewed security policy.
- Treat file downloads and content URIs as untrusted; use Android scoped storage and user-mediated access.
- Request Android permissions only when the user initiates a feature that needs them. Explain purpose and honor denial.
- Prevent normal/private data mixing; verify private session storage/cache/cookies/service workers are discarded on closure to the extent supported by the engine.
- Do not collect browsing history or page content remotely by default; no forced account or cloud sync.
- Protect local profile data with platform-appropriate storage permissions; do not store passwords/cookies in application logs or exports.

## 6. Implementation sequence

### A0 — Engine and platform spike
- Create a minimal Android project and build on a pinned JDK/Gradle/Android Gradle Plugin toolchain.
- Load common HTTPS sites and test navigation, redirects, downloads, TLS failures, permissions, media, and renderer crashes.
- Compare WebView and GeckoView with written evidence and an ADR.
- Define minimum/target SDK policy, ABI coverage, app ID, signing and release-key custody before publishing.

### A1 — Secure shell
- Implement navigation and URL policy, tabs, lifecycle, safe error UI, and permission mediation.
- Add tests for URL validation, scheme rejection, external intents, and bridge restrictions.

### A2 — Local browser data
- Add bookmarks, history, settings, download records, clear-data controls, and migration/recovery tests.
- Define retention and export/delete behavior before adding persistent fields.

### A3 — Private browsing and downloads
- Prove normal/private storage separation with integration tests and device tests.
- Validate download destinations, content URIs, cancellation, app restarts, and partial-file cleanup.

### A4 — Accessibility and release
- Complete TalkBack, large font, contrast, touch-target, rotation, process-death, and supported-device testing.
- Produce signed APK/AAB through protected release credentials; verify artifact hashes and install/upgrade/uninstall behavior.
- Publish privacy policy, support contact, release notes, minimum OS, permissions rationale, and known limitations.

## 7. Required test matrix

Test minimum supported and current Android versions on both emulator and physical devices. Include low-memory devices, different screen sizes, dark/light mode, rotation, offline/DNS/TLS failures, renderer crash, background/foreground, process kill, interrupted download, permission denial/revocation, private-session closure, corrupt storage, and app upgrade.

## 8. Explicitly deferred

Cloud sync, accounts, password manager, extensions, ad/tracker blocking, remote browsing, desktop profile import, and enterprise policy management are not part of the first Android MVP. Each requires separate feasibility, privacy, threat, and acceptance specifications.

## 9. Definition of done

Before public release, complete automated tests, physical-device checks, privacy review, distribution-policy review, release notes, and verify that the security-reporting contact is monitored.

## Cleartext HTTP policy

WoHo Browser is intended to navigate to user-requested HTTP and HTTPS websites, so the Android manifest currently enables cleartext traffic for WebView navigation. This is a deliberate compatibility tradeoff, not a claim that HTTP is secure. The browser labels HTTP pages as **Not secure**, blocks mixed content, and cancels TLS certificate errors. HTTPS should be preferred whenever the destination supports it.

Do not change `android:usesCleartextTraffic` to `false` as a blanket hardening change without first changing the product contract and proving that normal HTTP browsing still works on supported Android/WebView versions. Physical-device testing must cover HTTP and HTTPS navigation, redirects, mixed content, and TLS failures before release.
