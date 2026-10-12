# Dependency, License, and SBOM Policy

**Status:** Partially implemented; license-notice release gates remain open.

## Dependency hygiene

Application and build dependencies are pinned in `package-lock.json` (lockfile version 3); CI uses `npm ci`. Review updates, transitive packages, install scripts, native modules, and network behavior. CI runs `npm audit --json`, prints a dependency advisory summary, fails on moderate-or-higher advisories in production dependencies (`npm audit --omit=dev --audit-level=moderate`), and separately fails on high/critical advisories in the full dependency tree. Moderate build-tool advisories still require explicit triage; a passing CI run does not mean the entire dependency tree is vulnerability-free.

## SBOM evidence

CI generates a CycloneDX dependency SBOM with npm and uploads it together with the raw `npm-audit.json` report as the `woho-browser-dependency-evidence` artifact. Retention is 30 days. These are build-run evidence artifacts, not a permanent release record. For a public release, retain the exact SBOM and audit report alongside the source commit, lockfile hash, installer checksum, workflow run, and signing status.

## Vulnerability triage

Assess each advisory against the resolved package version, affected code path, whether untrusted input can reach it, and whether the package is included in the shipped application or only used by build tooling. Do not apply an unreviewed forced downgrade or override solely to make `npm audit` green. Record the decision and re-evaluate when a patched compatible version becomes available.

Previously known item: CI on the old dependency graph reported moderate `sprintf-js` advisory entries through the `electron-builder` dependency tree (GHSA-hp3w-g68c-fv3c / CVE-2026-97058). The upstream advisory lists affected versions through 1.1.3 and no patched version. PR #130 removes `sprintf-js` from the candidate resolved tree by using `electron-builder@26.15.3` and overriding `@electron/get` to `5.1.0`; its generated lockfile resolves `tar@7.5.22`. Candidate CI reports zero vulnerabilities. Do not call the mitigation landed until the PR is merged and the post-merge main CI re-verifies the same result.

## Licenses and third-party notices

The SBOM is not a substitute for a legal license inventory. Review direct/transitive npm licenses and Electron/Chromium, fonts, icons, codecs, and other bundled assets. Include required third-party notices in distributable packages. The project owner has not selected a project license; do not add one without approval.

## Release gate

No public production release until vulnerability triage, owner-approved project licensing, third-party notices, and retained release provenance are complete. The current Windows installer is unsigned, and signing/updater verification is not implemented.


## Latest captured npm audit evidence — PR #130 candidate

The previous `main` audit run [38238684805](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38238684805) found **8 moderate vulnerability entries**, including CVE-2026-97058 in the transitive `sprintf-js@1.1.3` build-tool chain. An initial attempted downgrade to `electron-builder@26.5.0` was rejected because its npm audit found **8 high and 1 critical** dependency findings, including vulnerable `tar` versions. That candidate was not merged.

The accepted test candidate in [PR #130](https://github.com/Monupatel62/WoHo-Browser/pull/130) uses:

- `electron-builder@26.15.3`
- npm override `@electron/get@5.1.0`, removing the vulnerable nested downloader dependency chain
- regenerated `package-lock.json`, which resolves `tar@7.5.22` and contains no `sprintf-js`, `roarr`, or `global-agent` entries

The candidate's exact-head [CI run 38241929321](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38241929321) reported **0 vulnerabilities** during install/audit and passed the production and full dependency audits, Windows installer packaging, packaged startup smoke test, Electron fuses, checksum generation, Android tests/build, and relevant static checks. The exact-head [CodeQL run 38241929330](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38241929330) completed both JavaScript/TypeScript and Kotlin analysis successfully. The candidate is verified but is not yet merged to `main`.

The workflow now fails on moderate-or-higher findings in the full dependency tree, in addition to its production dependency audit. Post-merge main CI must confirm the clean audit once more. The separate license inventory, required third-party notices, owner-approved project license, signing, and retained release provenance remain release gates.

