# WoHo Browser Documentation and Implementation Audit

**Audit date:** 2026-10-11  
**Audit type:** Targeted implementation/documentation consistency review plus regression-fix follow-up  
**Repository status:** Release 0 browser prototype implemented in code; not production-ready.

## Scope and evidence

Reviewed the current README, master plan, Release 0 implementation status, security model, privacy requirements, navigation policy, IPC trust policy, browser-data storage, download-history storage, and CI workflow configuration. This is a targeted review, not a line-by-line audit of every specification and ADR.

Evidence should always be tied to a commit and the actual check results. A successful CI run proves the checks in that workflow passed; it does not prove clean-install behavior, website compatibility, or security certification.

## Verified repository facts

- The codebase contains an Electron/Chromium shell with React/TypeScript browser chrome and `WebContentsView` tabs.
- Implemented prototype areas include navigation and tabs, HTTP(S) navigation policy, popup denial, frame navigation scheme policy, trusted-renderer and IPC sender checks, session-scoped site permissions, private tabs, bookmarks/history, URL-redacted history storage, find-in-page, downloads, persistent bounded download history, and a Windows installer build.
- `.github/workflows/ci.yml` runs on Windows and includes dependency audit, lint, typecheck, unit tests, build/package, unsigned NSIS installer upload, CycloneDX SBOM plus raw npm audit report artifacts, and (since this change) a SHA-256 manifest for the installer. The repository currently has no committed npm lockfile, so reproducible lockfile installation remains open.
- `.github/workflows/codeql.yml` configures CodeQL analysis.
- Unit tests cover URL/navigation policy, IPC sender trust, browser-data validation/migration, download history retention/removal races, permission policy/prompt deduplication, private history exclusion, and renderer trust.
- PRs #70–#73 and #75 were merged after exact-head CI and CodeQL passed. The latest verified `main` commit is `7378df81be084debba8fc2d1a1d4ace01a5d1265`; fresh-main CI run `38126010114` and CodeQL run `38126010164` both completed successfully. This is workflow evidence only, not Windows runtime or security certification.
- The app does not integrate AI assistants, AI agents, AI APIs, or AI services. Do not add those integrations as part of the current browser build.
- No project license has been selected. Do not add a license without the owner's decision.

## Implementation limits and unresolved release gates

- This is a development prototype, not a production-ready browser or a Chrome-parity claim.
- Windows runtime behavior and clean-machine install/uninstall still need manual end-to-end verification. CI packaging success is not proof that the installer launches correctly.
- Frame-navigation policy has unit coverage, but website compatibility and native Electron event behavior require runtime verification.
- Native site-permission prompt, revocation, and private-session cleanup require manual Windows/Electron testing.
- No Safe Browsing or phishing/malware reputation integration is present.
- No signed installer or auto-updater is implemented.
- No extension system, sync, password manager, or credential storage is implemented.
- Browser profile and download-history startup recovery now preserve corrupt originals and fall back to separate files; Windows runtime recovery behavior still needs manual verification.
- Bookmark JSON import/export is implemented with size, row-count, format, and URL validation. A trusted native preview reports new/update/duplicate/invalid row counts and lets users import valid rows only; row-number/reason details are shown for up to 12 skipped rows. Bookmark edit and up/down reordering are implemented; folders remain unimplemented.
- History supports local-date filtering, inclusive date-range deletion, and checkbox-based multi-select deletion of visible entries.
- Per-item removal of finished download records is implemented and does not delete files. Storage-write failures now keep records visible until durable removal succeeds; retention pruning also removes records from memory only after the stored row is deleted. Multi-select and date-range history deletion retry persistence after failed writes. Retry of downloads, automatic partial-download cleanup, and reputation scanning remain unimplemented.
- General settings import/export, bookmark folders, retry and partial-download cleanup, and other broader roadmap items remain unimplemented.
- Dependency audit output has reported moderate transitive `sprintf-js`-related advisories in the `electron-builder` dependency tree. CI fails on high/critical advisories; this change adds a CycloneDX SBOM and raw npm audit report as workflow artifacts. The moderate advisory remains open for triage and is not claimed fixed.
- Some legacy AI-related specification files remain in the repository. Treat them as out-of-scope reference material, not authorization to add AI integrations; keep the README and master plan as the current product-scope references.

## Corrections in this audit

1. Replaced stale claims that no implementation, CI, or CodeQL workflows exist.
2. Recorded the current prototype features without describing them as production verified.
3. Separated CI evidence from manual Windows/runtime verification.
4. Explicitly retained the no-AI-integration scope and the unchosen-license constraint.
5. Recorded exact post-merge `main` CI and CodeQL evidence.
6. Added regression fixes for active-session site-data clearing and retryable durable download/history deletion, including retention pruning.
7. Listed known release gates and remaining work without claiming completion.

## Next audit priorities

| Priority | Work | Required evidence |
|---|---|---|
| P0 | Continue whole-repository security/correctness review | Concrete issue, regression test, CI + CodeQL on exact PR head |
| P0 | Verify current main CI and CodeQL after each merge | Completed successful workflow runs for the exact main SHA |
| P0 | Manual Windows/Electron smoke test | Recorded OS/build, launch, navigation, tabs, permissions, downloads, restart, and uninstall results |
| P1 | Triage moderate transitive dependency advisories | Advisory paths, reachability assessment, safe upgrade/override analysis; raw audit report and CycloneDX SBOM are now CI artifacts |
| P1 | Add a committed package lockfile and switch CI to reproducible installation | Generate and review `package-lock.json`, then use `npm ci`; currently unresolved because no lockfile is committed |
| P1 | Test storage corruption/recovery and profile concurrency on Windows | Reproducible tests and preserved user data |
| P1 | Resolve license and third-party notices before distribution | Owner-approved license, inventory, and included notices |
| P1 | Keep roadmap and detailed specifications consistent with the no-AI current scope | Cross-document review and no accidental AI integration |

## Audit rules

- Never infer implementation from a specification or commit message.
- Mark a requirement verified only when code, tests, and the relevant runtime evidence are checked on a specific commit.
- Do not claim Safe Browsing, anonymity, Chrome parity, production readiness, signed updates, or Windows runtime verification without evidence.
- Preserve user data when files are malformed or unsupported; do not silently reset storage.
- Keep the current build free of AI service, assistant, agent, and API integration.
- Repeat this audit after meaningful changes and re-check internal Markdown links.
