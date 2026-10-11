# WoHo Browser — Cross-Platform Product Strategy

**Status:** Proposed product plan; not an implementation claim  
**Last reviewed:** 2026-10-11  
**Binding exclusion:** No AI assistant, agent, model, AI API, AI service, AI DevKit, or AI-generated browser feature is in scope.

## 1. Product goal

Deliver a trustworthy browser experience across three distinct surfaces without pretending their technical capabilities are identical:

1. **Windows desktop:** the full desktop browser and first release target.
2. **Android:** a native mobile browser with mobile navigation, tabs, privacy controls, downloads, and Android lifecycle integration.
3. **Web:** a browser companion portal/PWA for product information and user-initiated portable-data workflows. A normal website cannot become a full browser for arbitrary URLs because it runs inside another browser's security sandbox.

The three surfaces share product principles and documented behavior, not necessarily the same UI implementation or browser engine.

## 2. Platform definitions

| Surface | Product contract | Technology direction | Release status |
|---|---|---|---|
| Windows | Full desktop browser | Existing Electron + Chromium prototype, React/TypeScript | In progress; not production-ready |
| Android | Native mobile browser | Native Android app; evaluate Android WebView versus GeckoView in a feasibility spike | Planned; no implementation claim |
| Web | Companion portal/PWA | Standard web app; separate deployment and threat model | Planned; not a full browser engine |
| macOS/Linux | Not currently committed | Separate feasibility and maintenance review | Deferred |

## 3. Why the Web surface is different

A web app cannot safely take over the host browser's address bar, browser tabs, downloads, system permissions, or arbitrary navigation. An iframe-based proxy is not equivalent to a browser and introduces severe security, privacy, compatibility, and operational risks.

The initial Web companion may provide:
- Product landing page, documentation, release notes, known issues, and support/security contact information.
- Download links to verified Windows installers and Android releases.
- User-controlled import/export helpers for supported bookmark data, processed locally in the browser where feasible.
- Release checksums, signatures/provenance links, and clear support status.
- Optional local-only PWA installation and accessibility-friendly responsive design.

It must not upload browsing history, cookies, passwords, session data, or downloaded files by default. No account or cloud sync is required for the first web release. Remote browsing/proxying, cloud profiles, and cross-device sync are explicitly deferred until separately approved architecture, threat, privacy, cost, and deletion reviews are complete.

## 4. Shared requirements across platforms

- Clear navigation state and meaningful network/TLS error handling.
- Safe URL parsing; reject unsupported or dangerous schemes by default.
- Clear distinction between normal and private browsing.
- User-initiated download handling and transparent download status.
- Permission prompts with least privilege and an easy revoke path.
- Accessible keyboard/focus behavior on desktop/web and screen-reader/touch support on Android.
- Local data ownership, documented retention, clear/delete/export controls.
- No surprise telemetry, no browsing-history collection by default, and no AI integration.
- Reproducible builds, dependency scanning, security reporting ownership, release provenance, and documented support windows.
- Feature parity is declared per capability; unsupported behavior is not represented as complete.

## 5. Data portability and sync

Initial behavior is **local-first with explicit user export/import**. Do not implement cloud sync merely to create superficial cross-platform parity. Any later sync requires an ADR covering encryption, authentication, account recovery, conflict resolution, data deletion, server-side retention, incident response, and privacy notices. Passwords, cookies, authentication tokens, and private-session state are never part of portable exports.

## 6. Engineering boundaries

- Keep the Windows Electron main process, trusted chrome, and untrusted site contents separated.
- Android must use native platform permission APIs and a reviewed web rendering component. Do not port Electron IPC code directly into Android.
- Web companion code must treat all imported files and strings as untrusted, parse them with strict size/schema limits, and avoid rendering imported HTML.
- Share requirement IDs and conformance tests where meaningful; implement platform-specific adapters rather than pretending the OS APIs are interchangeable.
- Keep platform-specific builds, secrets, signing keys, release channels, and CI jobs separate.

## 7. Delivery phases

### Phase A — Documentation and feasibility (current)
- Define platform contracts, threat boundaries, feature matrix, test matrix, and release gates.
- Inventory existing code and mark actual implementation separately from plans.
- Complete the current Windows packaged-runtime blocker before calling Windows validated.

### Phase B — Windows MVP
- Stabilize renderer loading and packaged startup smoke test.
- Verify clean install, launch, browsing, persistence, update strategy, uninstall, and reinstall on declared Windows versions.
- Resolve licensing, dependency vulnerabilities, signing/update decisions, and security-reporting ownership before public production release.

### Phase C — Android feasibility then MVP
- Prototype navigation, tabs, downloads, permission prompts, private-session isolation, and app lifecycle.
- Compare Android WebView and GeckoView against security, compatibility, licensing, update cadence, and maintenance needs.
- Decide engine in an ADR before feature implementation expands.

### Phase D — Web companion MVP
- Responsive product portal, documentation, release artifacts, checksums, status/support links, and locally processed bookmark import/export only if it can be implemented safely.
- No remote browsing, cloud profile, or sync in this phase.

### Phase E — Cross-platform quality
- Run shared behavioral tests and platform-specific test matrices.
- Add release provenance, signed artifacts where supported, privacy review, accessibility checks, and rollback/recovery evidence.

## 8. Definition of done

A platform is not “complete” because its directory exists or a build succeeds. Each release requires:
1. A reviewed scope and support matrix.
2. A clean reproducible build.
3. Unit, integration, security-boundary, accessibility, and platform-runtime tests.
4. Real installation/upgrade/uninstall tests where applicable.
5. Privacy/data-retention and dependency/license review.
6. Release artifacts with verified integrity and clear known issues.
7. A maintained security contact and incident/patch process.
8. Product status updated with commit, CI evidence, and unresolved limitations.

## 9. Non-goals

- AI, assistants, agents, models, AI APIs/services, and AI DevKit integration.
- Claiming Chrome feature parity, complete extension compatibility, or superior security without evidence.
- Browser-in-browser iframe/proxy presented as a native browser.
- Background upload of browsing data.
- Sync, password manager, remote browsing, enterprise management, DRM, or extensions until each has a separate approved specification and security review.
