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


## Fresh-main verification addendum — 2026-10-11

This addendum supersedes the older “latest verified main” SHA and workflow IDs above. The older IDs are retained as historical evidence, not current-main evidence.

- **Current main commit checked:** `6a13dfa65e357d8272f0a03b893601110f90a2ac`.
- **CI:** run [38148847281](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38148847281) passed. Steps include dependency advisory inspection, production and high/critical dependency gates, CycloneDX SBOM, lint, typecheck, unit tests, unsigned Windows packaging, packaged-app startup smoke test, Electron fuse verification, installer SHA-256 manifest, and artifact upload.
- **CodeQL:** run [38148847325](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38148847325) passed.
- **Secret scanning:** run [38148847329](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38148847329) passed.
- These are automated checks on the named commit; they do not establish clean-machine Windows install/uninstall, full site compatibility, signed updates, or production readiness.
- **Known dependency risk remains unresolved:** CVE-2026-97058 affects the dev/build dependency chain through `sprintf-js@1.1.3`; no patched version is listed in the reviewed advisory. Do not mark fixed without a verified remediation or documented risk acceptance.
- **Owner decisions remain open:** project license and third-party notices, and confirmation that private vulnerability reporting plus a monitored inbox/responsible owner are operational.
- **Scope reminder:** AI-related documents in this repository are design-only legacy references. No AI assistant, agent, API, DevKit integration, model download, or AI service is authorized or implemented in the current browser scope.

## Next audit cycle

1. Continue a file-by-file review of main-process event lifecycle, tab/session disposal, IPC validation, storage persistence, and download race/error paths.
2. For each confirmed defect, add a regression test and record exact source/test evidence.
3. Keep speculative concerns separate from confirmed defects; do not claim a bug is fixed until the regression test and exact-head CI pass.
4. Require manual Windows runtime evidence for native permissions, private-session cleanup, navigation policy, storage recovery, install, and uninstall before production sign-off.


## Follow-up audit — 2026-10-12

**Current main reviewed:** `8e5998c324062bcf3e6758645c260cbd2801fcdb`. This review expands the previous targeted audit but is still not a proof of total completeness.

### Fresh-main automated evidence

On the reviewed main SHA, the Windows CI run [38156190168](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38156190168), CodeQL run [38156190156](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38156190156), and Secret Scanning run [38156190165](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38156190165) all passed. These checks do not replace hands-on Windows tests or establish production readiness.

### Confirmed current findings

1. **Dependency update PR #113 is incompatible and currently fails installation.** Its proposed Vite 8.3.4 conflicts with `electron-vite@5.0.0`, whose peer range is `^5 || ^6 || ^7`. Exact-head CI failed at `npm ci` with `ERESOLVE`; do not merge this PR or bypass the peer check with `--force` / `--legacy-peer-deps`. Keep Vite on the compatible major until the build-tool chain has a tested Vite 8-compatible release.
2. **Moderate build-tool dependency advisory remains unresolved.** The repository's existing policy identifies CVE-2026-97058 / GHSA-hp3w-g68c-fv3c through the `electron-builder` dependency chain. It is build-time exposure, not a demonstrated renderer vulnerability, but it still affects the build pipeline. Recheck the advisory and upstream package versions before deciding remediation; do not claim this is fixed.
3. **Release blockers remain:** unsigned Windows installer, no authenticated auto-updater, no owner-approved project license or third-party notice bundle, and unverified private vulnerability-reporting/inbox ownership.
4. **Manual platform verification remains open:** clean Windows install/uninstall; tab and navigation compatibility; native permission allow/revoke; private-session cleanup on tab close and app crash; download cancellation and filesystem failures; corrupt-profile recovery and restart persistence. Current CI packaging and startup smoke are useful but do not exercise all of these.
5. **Feature scope remains incomplete:** no Safe Browsing/reputation service, extensions, sync, password manager, download retry/partial-file cleanup, bookmark folders, or general settings import/export. These are explicit gaps, not hidden assumptions.
6. **Documentation drift exists:** earlier sections refer to main SHA `269c5b57e897851727568f357a25300a2d2f46b6` and run IDs from the earlier audit cycle. Treat those as historical evidence only; this addendum is the newer main evidence. Continue refreshing this audit after merges.

### Audit limits

This pass inspected the current CI/dependency policy, navigation policy, trusted renderer and IPC helpers, renderer asset path resolver, session and permission lifecycle, download history, selected regression tests, and release documentation. It is **not** a line-by-line audit of every file, every external dependency, or all product requirements. Continue the whole-repository review by tracing each IPC handler to its renderer caller, each persistent store to corruption/concurrency tests, and each native Electron lifecycle event to a Windows runtime test.

### Next actions, in order

- [ ] Reject or replace Vite 8 dependency update PR #113 with a compatible tested toolchain set.
- [ ] Re-check current advisory metadata and the resolved `sprintf-js` chain; record whether a safe upstream fix exists.
- [ ] Add/verify regression coverage for every confirmed IPC, navigation, session-lifecycle, and storage failure.
- [ ] Run clean-machine Windows install, use, restart, upgrade, and uninstall tests; retain results tied to a commit and installer checksum.
- [ ] Resolve release-owner decisions for signing/updating, licensing/notices, and vulnerability reporting.
- [ ] Continue auditing all remaining source, tests, docs, and dependency paths; do not mark the project complete solely because CI is green.


## Dependency audit evidence clarification — 2026-10-12

Reviewing the uploaded dependency evidence artifact from CI run `38156190168` showed that the issue is broader than the previously named `sprintf-js` advisory: npm reports **8 moderate vulnerability entries**. The resolved build toolchain is `electron-builder@26.17.0`, `app-builder-lib@26.17.0`, `dmg-builder@26.17.0`, nested `@electron/get@3.1.0`, `global-agent@3.0.0`, `roarr@2.15.4`, and `sprintf-js@1.1.3`. npm proposes `electron-builder@26.5.0` as a downgrade-based fix. This recommendation has not been applied; verify the resulting complete dependency graph and full Windows build checks before considering it. A registry command timeout is inconclusive. Keep the build-tool risk open and do not describe the toolchain as vulnerability-free.


## Fresh-main security verification — 2026-10-12

This supersedes the earlier current-main reference to `8e5998c324062bcf3e6758645c260cbd2801fcdb`; that SHA remains historical evidence.

- **Main commit reviewed:** `39a4a33317e515c317fd2074c50268749a90610c`.
- **Windows CI:** [38225187086](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38225187086) passed.
- **CodeQL:** [38225187059](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38225187059) passed.
- **Secret scanning:** [38225187057](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38225187057) passed.
- PR #115 fixed a trust-validation inconsistency by rejecting username/password userinfo in the exact `woho://browser/index.html` renderer URL check and in the custom-protocol handler. Credential-bearing custom renderer URL regression tests were added; exact-head CI, CodeQL, and secret scanning passed before merge.
- The build-tool dependency risk remains open: the captured audit report contains eight moderate findings; see the dependency policy's 2026-10-12 evidence section. The failed Vite 8 Dependabot PR #113 was closed without merging because `npm ci` failed on the declared `electron-vite@5` peer range.
- PR #112's Android/Web companion foundation remains open and is under further review. Its newest commits add Android history URL redaction/migration, safe download filename handling, and host:port address parsing; do not merge until those exact-head CI, CodeQL, and secret-scan checks pass.

Automated checks above are tied to the named main commit. They do not replace the open manual Windows install/uninstall and platform compatibility gates. This is still a targeted audit, not a declaration that all files and requirements have been fully audited.

## Follow-up audit — 2026-10-12 (continuation)

### Exact-head PR verification

- PR #119 (`fix/android-preserve-corrupt-local-data`) remains open. The recorded Android CI run checked merge commit `e88e64495cb53ca5c49c48efeb031597ec86a2b7` / PR head `8cea7d769ffbcd18d671133fbd6dbbd91f190bfb`, not the current PR head `c273db806056863c7369d002735d81f14550d944`. Android tests failed: `LocalRecordsPolicyTest` reported 2 failures (`parsesValidArray`, `rejectsMalformedJsonWithoutReturningAnEmptyReplacement`). Kotlin CodeQL also failed because its build invokes the same unit-test task; JavaScript/TypeScript CodeQL passed and Gitleaks passed on that older run. These results are not exact-head clearance.
- PR #120 adds stricter JSON token validation and extends tests for malformed, non-array, trailing-content, and oversized records. It also makes Android SDK license acceptance explicit in CI and Kotlin CodeQL workflows. As of this audit pass, the connector exposes no status/workflow result for its latest head `26d7ee461270f4837b17ee6ba9583cf2bfe35066`. Keep it open until exact-head Android tests/build, Windows CI, CodeQL, and Gitleaks report success.
- PR #121 proposes `android:usesCleartextTraffic="false"` after the main manifest was found to allow cleartext traffic globally. This must be tested on supported Android/WebView versions because the product currently permits HTTP addresses. Do not merge until the HTTP compatibility decision and test results are documented.

### Additional verified security and release findings

- **Android cleartext policy:** main's `AndroidManifest.xml` sets `usesCleartextTraffic="true"`, while `BrowserUrlPolicy` accepts both HTTP and HTTPS. TLS errors are cancelled and WebView mixed content is blocked, but those controls do not disable ordinary top-level cleartext HTTP. PR #121 is the proposed policy hardening; behavior remains unverified.
- **Live dependency advisory recheck:** GitHub Advisory Database GHSA-hp3w-g68c-fv3c / CVE-2026-97058 (reviewed October 5, 2026) still marks `sprintf-js` versions through 1.1.3 affected, with no patched release listed. The lockfile resolves `sprintf-js@1.1.3` transitively through the Electron build toolchain. This is a build-pipeline dependency exposure; no evidence yet says browser renderer input directly invokes it. Keep all eight reported moderate npm audit entries open for graph-level triage, and do not force a downgrade or override without full packaging validation.
- **Security report handling:** `SECURITY.md` has no dedicated monitored inbox/contact. Enable GitHub private vulnerability reporting and verify the destination with the owner before production release; document triage owner and response targets.
- **Licensing/release integrity:** project license is unset (`license: null` and no license metadata on repository), `docs/decisions/ADR-0005-license.md` remains open, and `ADR-0003-updater.md` has no production updater selected. No GitHub releases are published. Signed Windows installer, protected signing key, authenticated updater with anti-downgrade/rollback tests, approved third-party notices, clean-machine install/uninstall/upgrade, physical Android device validation, Android signing, private-mode and permission isolation remain release blockers.
- **IPC/navigation/download/private session:** reviewed main-process IPC wrapper and sender validator (exact renderer, main frame and expected sender), URL allow-list (HTTP(S), no credentials), popup/frame/redirect guards, private session cleanup (cancel private downloads and clear storage/cache/auth), and save-dialog-gated downloads. Existing unit tests cover several isolated policies, but this is still a targeted inspection, not proof all handlers/events are fully audited. Remaining runtime evidence must cover process crash/close races, permission prompts racing with private-tab disposal, failed cache/storage clearing, duplicate/late download events, and restart/persistence behavior.

### Next loop

1. Recheck exact-head statuses for PRs #119–#121 and fix any failures before merging.
2. Trace all remaining IPC channels to renderer callers and add boundary tests for wrong sender/frame, wrong types and oversized payloads.
3. Trace every persistent store's parse/migrate/write paths for corruption, concurrent writes, and restart recovery.
4. Refresh `npm audit` / SBOM after dependency changes; review the full nested graph, not just `sprintf-js`.
5. Keep Windows clean-install/uninstall/upgrade, Android physical-device / signing / private-mode tests, security-reporting contact, license/notice, and updater integrity as release blockers until evidence is recorded.

