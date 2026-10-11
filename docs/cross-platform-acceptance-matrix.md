# WoHo Browser — Cross-Platform Acceptance Matrix

**Status:** Planning and evidence-tracking template  
**Rule:** “Planned” is not “implemented”; “build passed” is not “release verified.”  
**AI scope:** Explicitly excluded on every platform.

## 1. Status vocabulary

- **Implemented in prototype:** code exists, but may not have full integration evidence.
- **Automated-tested:** relevant automated tests pass on a recorded commit.
- **Runtime-verified:** behavior was exercised in the packaged/native application.
- **Release-ready:** all applicable security, privacy, signing, accessibility, installation, and support gates pass.
- **Planned / deferred:** no implementation claim.

## 2. Platform status at the time of writing

| Area | Windows desktop | Android | Web companion |
|---|---|---|---|
| Product type | Full browser | Native mobile browser | Portal/PWA, not a full browser |
| Codebase | Electron/Chromium + React/TypeScript prototype | Not yet implemented | Not yet implemented |
| Core browsing | Prototype code exists; packaged runtime validation currently unresolved | Planned | Arbitrary-site browsing is out of scope |
| Tabs | Prototype implementation exists; runtime validation required | Planned | Host browser owns tabs |
| Bookmarks/history | Prototype implementation exists; release validation required | Planned | Optional local import/export only |
| Downloads | Prototype implementation exists; release validation required | Planned | Release artifact downloads only |
| Permissions/private mode | Prototype implementation exists; runtime/security validation required | Planned; engine spike required | No site-permission or private browser engine controls |
| CI/build | Windows CI configured; do not treat failed smoke test as success | Not configured | Not configured |
| Signing/update | Signing and authenticated updater unresolved | Signing/release-key plan unresolved | Deployment/update/cache policy unresolved |
| Production status | Not production-ready | Planned | Planned |

Update this table only with evidence from the current branch/commit and the relevant platform tests.

## 3. Shared acceptance requirements

| ID | Requirement | Windows evidence | Android evidence | Web evidence |
|---|---|---|---|---|
| XPL-001 | Accurate platform/product claims | Installer and README checked | Store listing checked | Portal status checked |
| XPL-002 | No AI code/services/dependencies | Dependency/code audit | Dependency/code audit | Dependency/code audit |
| XPL-003 | No browsing-data collection by default | Network/privacy tests | Network/privacy tests | Import tool network inspection |
| XPL-004 | Input validation and safe errors | URL/IPC tests | URL/intent/bridge tests | Import/schema/output tests |
| XPL-005 | Accessibility | Keyboard/focus/screen-reader | TalkBack/touch targets | Keyboard/screen-reader/responsive |
| XPL-006 | Dependency/license review | SBOM/notices/advisories | SBOM/notices/advisories | SBOM/notices/advisories |
| XPL-007 | Security contact and incident owner | Verified | Verified | Verified |
| XPL-008 | Release provenance/integrity | Signed installer/checksum | Signed APK/AAB/checksum | HTTPS/deployment integrity |
| XPL-009 | Documented retention/delete behavior | Profile/private data | App/private data | Import files stay local |
| XPL-010 | Known issues and support window | Release notes | Release notes | Status/known issues |

## 4. Windows-specific release matrix

- [ ] Packaged ASAR includes all runtime entries and referenced renderer assets.
- [ ] Packaged app loads actual trusted chrome and first HTTPS page.
- [ ] Clean install, first launch, restart, upgrade, failed upgrade recovery, uninstall, and reinstall pass.
- [ ] Test supported Windows versions and display scaling.
- [ ] Verify private-session cleanup, site permissions, downloads, and profile recovery.
- [ ] Installer signing, update integrity, anti-downgrade, rollback, and key custody are resolved or explicitly block release.
- [ ] License and third-party notices are included.

## 5. Android-specific release matrix

- [ ] Engine decision recorded (WebView/GeckoView).
- [ ] Minimum/target SDK and supported device/ABI matrix documented.
- [ ] Navigation, redirects, TLS errors, tabs, downloads, permissions, private isolation, and lifecycle tests pass.
- [ ] Physical device and emulator tests cover rotation, low memory, process death, offline mode, and interrupted downloads.
- [ ] TalkBack and large text tests pass.
- [ ] Signed APK/AAB, protected key custody, artifact integrity, upgrade/uninstall, privacy policy, and store-policy checks pass.

## 6. Web-specific release matrix

- [ ] Website is clearly labelled as a companion, not a full browser.
- [ ] HTTPS, CSP, security headers, dependency checks, and accessible responsive layout pass.
- [ ] Release artifact links/checksums match published release metadata.
- [ ] Bookmark import/export (if present) is locally processed and rejects malformed/oversized files.
- [ ] Network inspection confirms no browsing data or imported files are uploaded.
- [ ] Service-worker cache contains only reviewed static public assets.
- [ ] Support/security contact and incident ownership are real and monitored.

## 7. Release record template

For each platform release, record:
- Platform/version/build number:
- Source commit and tag:
- CI run IDs and conclusions:
- Security/dependency scan results:
- Artifact names, sizes, hashes, and signature/provenance:
- OS/device/browser versions tested:
- Manual test checklist and tester/date:
- Open vulnerabilities and accepted risks:
- Known issues and rollback plan:
- Support/security contact owner:
- Final release decision and approver:

Do not fill this template with assumed or invented evidence.
