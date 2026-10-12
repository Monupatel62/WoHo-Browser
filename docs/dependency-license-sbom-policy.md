# Dependency, License, and SBOM Policy

**Status:** Partially implemented; license-notice release gates remain open.

## Dependency hygiene

Application and build dependencies are pinned in `package-lock.json` (lockfile version 3); CI uses `npm ci`. Review updates, transitive packages, install scripts, native modules, and network behavior. CI runs `npm audit --json`, prints a dependency advisory summary, fails on moderate-or-higher advisories in production dependencies (`npm audit --omit=dev --audit-level=moderate`), and separately fails on moderate-or-higher advisories in the full dependency tree. A passing CI run is evidence for the resolved lockfile on that commit; re-run the checks after every dependency change.

## SBOM evidence

CI generates a CycloneDX dependency SBOM with npm and uploads it together with the raw `npm-audit.json` report as the `woho-browser-dependency-evidence` artifact. Retention is 30 days. These are build-run evidence artifacts, not a permanent release record. For a public release, retain the exact SBOM and audit report alongside the source commit, lockfile hash, installer checksum, workflow run, and signing status.

## Vulnerability triage

Assess each advisory against the resolved package version, affected code path, whether untrusted input can reach it, and whether the package is included in the shipped application or only used by build tooling. Do not apply an unreviewed forced downgrade or override solely to make `npm audit` green. Record the decision and re-evaluate when a patched compatible version becomes available.

Previously known item: the old dependency graph included `sprintf-js@1.1.3` through the Electron builder dependency chain. The upstream advisory (GHSA-hp3w-g68c-fv3c / CVE-2026-97058) still lists affected versions through 1.1.3 with no patched `sprintf-js` release. Merged PR #130 uses `electron-builder@26.15.3` and overrides `@electron/get` to `5.1.0`; the resolved lockfile/SBOM now uses `tar@7.5.22` and contains no `sprintf-js`, `roarr`, or `global-agent` entries. Post-merge main CI confirms zero vulnerabilities.

## Licenses and third-party notices

CI runs `npm run notices` to generate `THIRD-PARTY-NOTICES.txt` and `THIRD-PARTY-LICENSE-INVENTORY.json` from the installed npm tree. The notices file is copied into the Windows application's resources and both generated files are retained with the Windows installer artifact. Electron's distribution license files, including Chromium's bundled HTML notices when present, are incorporated in the generated report.

The inventory intentionally records packages whose license expression or text is missing/unclear instead of pretending the report is legally complete. Review `packagesRequiringManualReview` and every `unresolved` entry before production distribution. Also check notices/assets outside npm package roots. The generator is a technical inventory, not legal advice or a license approval.

The project owner has not selected a project license; do not add a LICENSE file without owner approval. Required third-party notices and the owner-selected project license remain production-release gates.

## Release gate

No public production release until vulnerability triage, owner-approved project licensing, third-party notices, and retained release provenance are complete. The current Windows installer is unsigned, and signing/updater verification is not implemented.


## Latest captured npm audit evidence — post-merge main, 2026-10-12

Main commit `315ebaaa5157a8a5d1987990803572a9ea5376b5` includes the dependency remediation and the stricter full-tree audit gate.

Post-merge [CI run 38242801756](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38242801756) completed successfully and uploaded the CycloneDX SBOM and `npm-audit.json`. The audit report contains **0 total vulnerabilities** (0 low, moderate, high, or critical). The production dependency audit and the full dependency audit `npm audit --audit-level=moderate` both passed.

The post-merge SBOM resolves `electron-builder@26.15.3`, `app-builder-lib@26.15.3`, `dmg-builder@26.15.3`, `@electron/get@5.1.0`, and `tar@7.5.22`. It no longer includes `sprintf-js`, `roarr`, or `global-agent`, which removes the affected dependency chain from the current build toolchain. The stricter CI audit now fails on any moderate-or-higher finding so this risk cannot silently recur on future lockfile changes.

The upstream `sprintf-js` advisory itself remains unpatched; it is not present in the project's current resolved dependency tree. Re-review on each dependency update. License inventory, required third-party notices, owner-approved project license, installer signing, and retained release provenance remain separate release gates.
