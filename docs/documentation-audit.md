# WoHo Browser Documentation and Implementation Audit

**Audit date:** 2026-10-11  
**Audit type:** Targeted implementation/documentation consistency review plus regression-fix follow-up  
**Repository status:** Release 0 browser prototype implemented in code; not production-ready.

## Scope and evidence

Reviewed the current README, master plan, Release 0 implementation status, security model, privacy requirements, navigation policy, IPC trust policy, browser-data storage, download-history storage, and CI workflow configuration. This is a targeted review, not a line-by-line audit of every specification and ADR.

Evidence should always be tied to a commit and the actual check results. A successful CI run proves the checks in that workflow passed; it does not prove clean-install behavior, website compatibility, or security certification.

## Verified repository facts

- The codebase contains an Electron/Chromium shell with React/TypeScript browser chrome and `WebContentsView` tabs.
- Implemented prototype areas include navigation and tabs, HTTP(S) navigation policy, popup denial, frame navigation scheme policy, trusted-renderer and IPC sender checks, session-scoped site permissions, private tabs, bookmarks/history, URL-redacted history storage, find-in-page, bounded per-tab zoom, recently closed normal-tab recovery, downloads, persistent bounded download history, and a Windows installer build.
- `.github/workflows/ci.yml` runs on Windows and includes dependency audit, lint, typecheck, unit tests, build/package, unsigned NSIS installer upload, CycloneDX SBOM plus raw npm audit report artifacts, and (since this change) a SHA-256 manifest for the installer. The repository includes a generated npm lockfile and CI uses `npm ci`; fresh-main CI, CodeQL, and secret scanning all passed on `269c5b57e897851727568f357a25300a2d2f46b6` after the `actions/checkout@7`, `setup-node@7`, `upload-artifact@7`, and `@types/node` updates.
- `.github/workflows/codeql.yml` configures CodeQL analysis. `.github/dependabot.yml` schedules weekly npm and GitHub Actions dependency updates. `.github/workflows/secret-scan.yml` runs pinned Gitleaks full-history scanning on push, pull request, weekly schedule, and manual dispatch. The workflow completed successfully on PR #91 head `7dbc3157432fa86be07dacafc77e85e45342cd6a`, PR #100 head `146832338d2c1bc7cbdc095968564d72f5d3e9a5`, PR #102 head `2f1385c5cba452e57a37389a90c1ab335dae9f00`, and fresh main `269c5b57e897851727568f357a25300a2d2f46b6`; operational ownership and handling future findings still need confirmation. GitHub-hosted account-level scanning, if enabled, is not inferable from repository files.
- Unit tests cover URL/navigation policy, IPC sender trust, browser-data validation/migration, download history retention/removal races, permission policy/prompt deduplication, private history exclusion, and renderer trust.
- PRs #70–#73, #75–#87, #89, #91, #92, #95, #97, #98, #100–#104 were merged after their exact-head checks passed. PR #89 added weekly Dependabot schedules; PR #91 added Gitleaks; PR #100 removed nonexistent Dependabot labels; PR #101/#103/#104 refreshed audit evidence; PR #102 upgraded Gitleaks to v3; PR #95 upgraded actions/checkout to v7; PRs #92/#97/#98 updated @types/node and GitHub Actions. Latest verified main `269c5b57e897851727568f357a25300a2d2f46b6`: CI run `38138809136`, CodeQL `38138809134`, and Secret Scanning `38138809115` all passed. PR #85 fixed browser-data migration writer injection, and PR #87 made session-restore disabling clear saved URLs before persisting the disabled setting. The Windows CI run passed lint, typecheck, tests, packaging, packaged-app startup smoke test, Electron fuse verification, and installer checksum generation. This is workflow evidence only, not full Windows runtime or security certification.
- The app does not integrate AI assistants, AI agents, AI APIs, or AI services. Do not add those integrations as part of the current browser build.
- No project license has been selected and no `LICENSE`/third-party `NOTICE` release bundle is present. Do not add a project license without the owner's decision.
- `SECURITY.md` exists, but private vulnerability reporting and a monitored inbox still need owner verification before public release.

## Implementation limits and unresolved release gates

- This is a development prototype, not a production-ready browser or a Chrome-parity claim.
- Windows runtime behavior and clean-machine install/uninstall still need manual end-to-end verification. CI launches the packaged executable with an isolated profile and waits for the chrome renderer to load and initial tab navigation to start; this is stronger than packaging-only evidence but is not a substitute for manual install, website compatibility, restart, and uninstall testing.
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
- The repository's CI has CodeQL and npm dependency auditing, and `.github/dependabot.yml` schedules weekly npm and GitHub Actions updates. The Gitleaks workflow passed on PR #100, PR #102, and fresh main `269c5b57e897851727568f357a25300a2d2f46b6`; verify GitHub Private Vulnerability Reporting and monitored inbox ownership before public distribution. Configure a monitored owner and response process for future findings.
- `SECURITY.md` is present, but the repository explicitly says GitHub Private Vulnerability Reporting and a monitored inbox are not yet confirmed. This is an operational release gate, not a missing document.
- Dependency audit on `8dd35fa6105eee747a9bbaaaeb23d6c2a3215529` reports eight moderate findings in the `electron-builder` build-tool dependency tree, including CVE-2026-97058 (`sprintf-js` 1.1.3 via `roarr`/`global-agent`/`@electron/get`). The advisory says affected versions are `<=1.1.3` and lists no patched version. The dependency is marked dev-only in `package-lock.json` and is not a production dependency shipped by the app, but it still runs in the build pipeline. CI now separately enforces zero moderate-or-higher advisories in production dependencies and continues to fail on high/critical findings across the full dependency tree. The moderate build-tool advisory remains unresolved; do not describe it as fixed or risk-free, and avoid an untested `electron-builder` downgrade or unreviewed fork while no upstream patch is available.
- Some legacy AI-related specification files remain in the repository. Treat them as out-of-scope reference material, not authorization to add AI integrations; keep the README and master plan as the current product-scope references.

## Corrections in this audit

1. Replaced stale claims that no implementation, CI, or CodeQL workflows exist.
2. Recorded the current prototype features without describing them as production verified.
3. Separated CI evidence from manual Windows/runtime verification.
4. Explicitly retained the no-AI-integration scope and the unchosen-license constraint.
5. Recorded exact post-merge `main` CI and CodeQL evidence.
6. Added regression fixes for active-session site-data clearing and retryable durable download/history deletion, including retention pruning.
7. Added an automated packaged-app startup smoke test while retaining manual Windows end-to-end verification as an open release gate.
8. Added a committed npm lockfile and switched CI to `npm ci`; exact-head and fresh-main checks passed.
9. Scoped Site permissions controls to the active tab session, including isolated private-session decisions.
10. Listed known release gates and remaining work without claiming completion.
11. Recorded page zoom and recently closed normal-tab recovery after PRs #82–#83.
12. Added a separate production-dependency audit gate while retaining the full development/build dependency audit report.
13. Updated dependency policy and audit evidence after PR #84 merged; the remaining build-tool advisory is explicitly still open.
14. Fixed the injected-writer bypass during history URL-redaction migration in PR #85 and added failure/retry regression coverage.
15. Made disabling session restore clear persisted URLs before writing the disabled setting in PR #87.\n16. Added weekly npm and GitHub Actions dependency update schedules; updates still require CI/CodeQL review before merge.
17. Added a pinned Gitleaks workflow for push, pull-request, scheduled, and manual full-history secret scans; fresh-main scan and PR #100/#102 scans passed, while operational alert ownership remains to be confirmed.

## Next audit priorities

| Priority | Work | Required evidence |
|---|---|---|
| P0 | Continue whole-repository security/correctness review | Concrete issue, regression test, CI + CodeQL on exact PR head; do not call this targeted pass a complete repository audit |
| P0 | Verify current main CI, CodeQL, and secret scan after each merge | On main SHA `269c5b57e897851727568f357a25300a2d2f46b6`, CI run `38138809136`, CodeQL run `38138809134`, and secret scan run `38138809115` all passed |
| P0 | Manual Windows/Electron end-to-end test | Record OS/build, installer install/uninstall, navigation, tabs, permissions, downloads, restart, and data-recovery results; automated packaged startup smoke is not sufficient |
| P1 | Verify secret scanning and monitored private vulnerability reporting | Weekly npm and GitHub Actions Dependabot updates are configured; Gitleaks workflow is added, while its scan checks passed but private reporting/inbox monitoring remain release gates |
| P1 | Triage moderate transitive dependency advisories | CVE-2026-97058 remains a build-tool risk with no upstream patched version listed in checked advisory; use raw audit/SBOM artifacts, assess reachability and re-check upstream before changes |
| Done | Lockfile-based reproducible installation | `package-lock.json` v3 committed in PR #77; CI uses `npm ci`; exact-head and fresh-main CI/CodeQL passed on the lockfile and follow-up code commits |
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


## Follow-up audit — 2026-10-11 evening

- Fresh `main` commit `269c5b57e897851727568f357a25300a2d2f46b6` passed CI (`38138809136`), CodeQL (`38138809134`), and Gitleaks (`38138809115`). This verifies repository checks only.
- Reviewed Dependabot PRs #93, #94, and #96. Vite 8 conflicts with `electron-vite@5`'s declared Vite peer range (`^5 || ^6 || ^7`); `@vitejs/plugin-react@6` requires Vite 8, so it cannot be applied independently to Vite 7; TypeScript 7 PR fails CI. Do not merge these dependency-only PRs until a compatible, tested toolchain set is available.
- CVE-2026-97058 remains open: the reviewed GitHub advisory (updated 2026-10-05) lists `sprintf-js <=1.1.3` as affected and no patched version. It is in the development/build dependency tree, not listed as a shipped production dependency. That reduces shipped-runtime exposure but does not make the build pipeline risk-free. No dependency override, fork, or downgrade is justified without compatibility tests and source review.
- Release gates unchanged: manual Windows install/navigation/permission/private-tab/download/restart/data-recovery/uninstall tests; signed installer and authenticated update mechanism; owner-selected project license and third-party notices; private vulnerability-reporting setup and named monitored inbox/response owner. These require real-machine testing or owner decisions and cannot be claimed complete from CI.
