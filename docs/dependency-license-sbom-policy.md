# Dependency, License, and SBOM Policy

**Status:** Partially implemented; license-notice release gates remain open.

## Dependency hygiene

Application and build dependencies are pinned in `package-lock.json` (lockfile version 3); CI uses `npm ci`. Review updates, transitive packages, install scripts, native modules, and network behavior. CI runs `npm audit --json`, prints a dependency advisory summary, fails on moderate-or-higher advisories in production dependencies (`npm audit --omit=dev --audit-level=moderate`), and separately fails on high/critical advisories in the full dependency tree. Moderate build-tool advisories still require explicit triage; a passing CI run does not mean the entire dependency tree is vulnerability-free.

## SBOM evidence

CI generates a CycloneDX dependency SBOM with npm and uploads it together with the raw `npm-audit.json` report as the `woho-browser-dependency-evidence` artifact. Retention is 30 days. These are build-run evidence artifacts, not a permanent release record. For a public release, retain the exact SBOM and audit report alongside the source commit, lockfile hash, installer checksum, workflow run, and signing status.

## Vulnerability triage

Assess each advisory against the resolved package version, affected code path, whether untrusted input can reach it, and whether the package is included in the shipped application or only used by build tooling. Do not apply an unreviewed forced downgrade or override solely to make `npm audit` green. Record the decision and re-evaluate when a patched compatible version becomes available.

Previously known item: the old dependency graph included `sprintf-js@1.1.3` through the Electron builder dependency chain. The upstream advisory (GHSA-hp3w-g68c-fv3c / CVE-2026-97058) still lists affected versions through 1.1.3 with no patched `sprintf-js` release. Merged PR #130 uses `electron-builder@26.15.3` and overrides `@electron/get` to `5.1.0`; the resolved lockfile/SBOM now uses `tar@7.5.22` and contains no `sprintf-js`, `roarr`, or `global-agent` entries. Post-merge main CI confirms zero vulnerabilities.

## Licenses and third-party notices

The SBOM is not a substitute for a legal license inventory. Review direct/transitive npm licenses and Electron/Chromium, fonts, icons, codecs, and other bundled assets. Include required third-party notices in distributable packages. The project owner has not selected a project license; do not add one without approval.

## Release gate

No public production release until vulnerability triage, owner-approved project licensing, third-party notices, and retained release provenance are complete. The current Windows installer is unsigned, and signing/updater verification is not implemented.


## Latest captured npm audit evidence — post-merge main, 2026-10-12

Main commit `315ebaaa5157a8a5d1987990803572a9ea5376b5` includes the dependency remediation and the stricter full-tree audit gate.

Post-merge [CI run 38242801756](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38242801756) completed successfully and uploaded the CycloneDX SBOM and `npm-audit.json`. The audit report contains **0 total vulnerabilities** (0 low, moderate, high, or critical). The production dependency audit and the full dependency audit `npm audit --audit-level=moderate` both passed.

The post-merge SBOM resolves `electron-builder@26.15.3`, `app-builder-lib@26.15.3`, `dmg-builder@26.15.3`, `@electron/get@5.1.0`, and `tar@7.5.22`. It no longer includes `sprintf-js`, `roarr`, or `global-agent`, which removes the affected dependency chain from the current build toolchain. The stricter CI audit now fails on any moderate-or-higher finding so this risk cannot silently recur on future lockfile changes.

The upstream `sprintf-js` advisory itself remains unpatched; it is not present in the project's current resolved dependency tree. Re-review on each dependency update. License inventory, required third-party notices, owner-approved project license, installer signing, and retained release provenance remain separate release gates.
