# WoHo Browser — Android Application Plan

**Status:** Planned; no Android implementation or release is claimed  
**AI scope:** No AI features, services, models, agents, or AI SDKs.

## 1. Goal

Build a native Android mobile browser, not a WebView wrapper around the Windows desktop app. It should provide reliable mobile browsing, touch-friendly tabs, address/search, bookmarks/history, downloads, site permissions, private browsing, settings, and Android lifecycle behavior.

## 2. Engine feasibility decision

Before committing to an engine, prototype and compare:

- **Android System WebView:** smaller integration surface and platform-managed updates; behavior follows the installed WebView provider and Android version.
- **GeckoView:** browser-focused embeddable engine with its own integration and update/compatibility responsibilities.

Evaluate supported Android API levels, security patch cadence, site compatibility, media playback, downloads, permission mediation, private-session isolation, licensing, binary size, performance, accessibility, and long-term maintenance. Record the result in a new ADR. Do not select based on convenience alone and do not claim Chromium parity without tests.

## 3. Proposed MVP capabilities

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

## 4. Security and privacy requirements

- No JavaScript bridge that exposes filesystem, intents, account tokens, or privileged native methods to arbitrary web pages.
- If any native bridge is necessary, expose a tiny origin-restricted API with strict schema validation and regression tests.
- Reject dangerous schemes and malformed URLs; external protocol handoff must be explicit and allowlisted.
- Never ignore TLS/certificate errors or provide a bypass button without a separately reviewed security policy.
- Treat file downloads and content URIs as untrusted; use Android scoped storage and user-mediated access.
- Request Android permissions only when the user initiates a feature that needs them. Explain purpose and honor denial.
- Prevent normal/private data mixing; verify private session storage/cache/cookies/service workers are discarded on closure to the extent supported by the engine.
- Do not collect browsing history or page content remotely by default; no forced account or cloud sync.
- Protect local profile data with platform-appropriate storage permissions; do not store passwords/cookies in application logs or exports.

## 5. Implementation sequence

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

## 6. Required test matrix

Test minimum supported and current Android versions on both emulator and physical devices. Include low-memory devices, different screen sizes, dark/light mode, rotation, offline/DNS/TLS failures, renderer crash, background/foreground, process kill, interrupted download, permission denial/revocation, private-session closure, corrupt storage, and app upgrade.

## 7. Explicitly deferred

Cloud sync, accounts, password manager, extensions, ad/tracker blocking, remote browsing, desktop profile import, and enterprise policy management are not part of the first Android MVP. Each requires separate feasibility, privacy, threat, and acceptance specifications.

## 8. Definition of done

A successful Gradle build alone is not an Android release. Require automated tests, engine-specific integration tests, manual device coverage, a signed artifact with signing credentials stored securely, permission/privacy review, Android distribution-policy review, release notes, and a maintained vulnerability-reporting path.
