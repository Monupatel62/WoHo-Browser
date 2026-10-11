# WoHo Browser — Windows Application Plan

**Status:** Existing prototype; release validation incomplete  
**Target:** Windows x64 first. Other Windows architectures/versions remain uncommitted until tested.  
**AI scope:** No AI features or integrations.

## 1. Product contract

The Windows app is the first full browser: native desktop window, browser chrome, independent website tabs, address/search bar, navigation controls, bookmarks/history, downloads, permissions, private tabs, settings, and local profile storage.

Current implementation uses Electron + Chromium, React/TypeScript, `WebContentsView`, a preload bridge, and typed/validated IPC. This is a prototype architecture, not proof of Chrome parity or production readiness.

## 2. Main user journeys

1. Install from a verified installer; see publisher/version information and understandable Windows warnings.
2. Launch into a predictable new-tab/start page; recover from a second launch without corrupting the profile.
3. Enter a URL or search phrase; show loading, progress, TLS/network errors, and retry behavior.
4. Open, switch, move (only if implemented), and close tabs; recover a crashed tab without silently restoring secrets.
5. Bookmark and revisit pages; search/clear history and confirm destructive actions where needed.
6. Download only through a clear destination and status flow; pause/resume/cancel only where supported; never auto-execute downloaded files.
7. Review and revoke site permissions; default-deny unknown permission types.
8. Open private tabs with isolated non-persistent storage; close them and verify their private state is discarded.
9. Change settings, restart, and verify persistence and data-clearing behavior.
10. Uninstall, reinstall, upgrade, and recover from failed upgrades according to a documented data-retention policy.

## 3. Security requirements

- Website content is untrusted and never receives Node, shell, arbitrary filesystem, or privileged IPC access.
- Keep context isolation, renderer sandboxing, web security, sender/frame/origin validation, schema/size limits, and navigation policy.
- Deny unexpected popups and dangerous/unsupported schemes; never silently bypass certificate errors.
- Use a restrictive CSP for trusted browser chrome and test that the packaged renderer actually renders.
- Treat downloads and imported files as untrusted; sanitize names and bound input sizes.
- Keep private-session data out of normal history and persistent storage.
- Restrict local internal pages/resources to known bundled assets.
- Never store signing keys, credentials, or secrets in source control or CI logs.

## 4. Release gates

### Gate W0 — Packaged runtime correctness
- [ ] Build and inspect the ASAR archive.
- [ ] Confirm `out/main/index.js`, preload entry, renderer HTML, and referenced assets are present and readable.
- [ ] Launch packaged app and verify trusted chrome DOM mounts (not merely that `did-finish-load` fires).
- [ ] Confirm first HTTPS tab loads and navigation controls work.
- [ ] Fail smoke tests on renderer console errors, blank chrome, or failed navigation.

### Gate W1 — Clean-machine functional validation
- [ ] Install on a clean supported Windows VM/device.
- [ ] Verify first launch, normal browsing, multiple tabs, bookmarks/history, downloads, permission prompts, private mode, settings, restart, and crash recovery.
- [ ] Verify screen scaling, keyboard shortcuts, focus order, screen reader basics, and common sites.
- [ ] Test offline, DNS failure, TLS error, renderer crash, interrupted download, and corrupt profile recovery.
- [ ] Test default-browser/protocol registration only if implemented and documented.

### Gate W2 — Installer lifecycle
- [ ] Verify per-user/per-machine install choice and installation directory behavior.
- [ ] Verify Start Menu/desktop shortcuts and correct app identity.
- [ ] Verify upgrade, failed upgrade recovery, downgrade policy, uninstall, reinstall, and residual-data explanation.
- [ ] Verify installer integrity and publisher signature before production distribution.
- [ ] Document whether uninstall preserves or removes profile data; ask/communicate clearly.

### Gate W3 — Production readiness
- [ ] Resolve license decision and ship required third-party notices.
- [ ] Review all direct/transitive dependencies and active advisories; document any accepted unresolved risk.
- [ ] Decide installer signing, update channel, signed metadata/package verification, anti-downgrade, rollback, and key rotation.
- [ ] Verify security-reporting contact is monitored and incident response has an owner.
- [ ] Run threat-model review and independent security review.
- [ ] Publish checksums, SBOM, provenance, release notes, supported OS versions, and known issues.

## 5. Platform support policy

Until a clean-machine matrix is tested, describe the app as a Windows prototype with automated packaging checks, not a supported production release. The minimum Windows version, architecture coverage, signing plan, update mechanism, and support window remain open decisions.

## 6. Exit criteria

Windows MVP is releasable only when all required gates have evidence. Passing unit tests, CodeQL, secret scanning, or CI packaging alone is not enough. Record the tested commit, runner/OS versions, installer hash, manual test results, and unresolved issues in the release record.
