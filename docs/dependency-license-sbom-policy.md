# Dependency, License, and SBOM Policy

**Status:** Partially implemented; license-notice release gates remain open.

## Dependency hygiene

Application and build dependencies are pinned in `package-lock.json` (lockfile version 3); CI uses `npm ci`. Review updates, transitive packages, install scripts, native modules, and network behavior. CI runs `npm audit --json`, prints a dependency advisory summary, fails on moderate-or-higher advisories in production dependencies (`npm audit --omit=dev --audit-level=moderate`), and separately fails on high/critical advisories in the full dependency tree. Moderate build-tool advisories still require explicit triage; a passing CI run does not mean the entire dependency tree is vulnerability-free.

## SBOM evidence

CI generates a CycloneDX dependency SBOM with npm and uploads it together with the raw `npm-audit.json` report as the `woho-browser-dependency-evidence` artifact. Retention is 30 days. These are build-run evidence artifacts, not a permanent release record. For a public release, retain the exact SBOM and audit report alongside the source commit, lockfile hash, installer checksum, workflow run, and signing status.

## Vulnerability triage

Assess each advisory against the resolved package version, affected code path, whether untrusted input can reach it, and whether the package is included in the shipped application or only used by build tooling. Do not apply an unreviewed forced downgrade or override solely to make `npm audit` green. Record the decision and re-evaluate when a patched compatible version becomes available.

Current known item: CI has reported moderate `sprintf-js` advisory entries through the `electron-builder` dependency tree (GHSA-hp3w-g68c-fv3c / CVE-2026-97058). The advisory lists affected versions through 1.1.3 and no patched version; npm suggests a breaking builder change rather than a direct safe fix. This is build-tooling exposure, not evidence that the browser's renderer directly uses `sprintf-js`. Keep this as an open triage item; do not claim it is fixed or risk-free.

## Licenses and third-party notices

The SBOM is not a substitute for a legal license inventory. Review direct/transitive npm licenses and Electron/Chromium, fonts, icons, codecs, and other bundled assets. Include required third-party notices in distributable packages. The project owner has not selected a project license; do not add one without approval.

## Release gate

No public production release until vulnerability triage, owner-approved project licensing, third-party notices, and retained release provenance are complete. The current Windows installer is unsigned, and signing/updater verification is not implemented.


## Latest captured npm audit evidence — 2026-10-12 main build

The uploaded CI artifact from run `38237149171` contains an npm audit report with **8 moderate vulnerability entries and zero high/critical entries**. The report identifies the resolved `electron-builder@26.17.0` / `app-builder-lib@26.17.0` / `dmg-builder@26.17.0` toolchain in affected ranges `26.6.0 - 27.0.0-alpha.2`, and a nested `@electron/get@3.1.0` (the root copy is `5.1.0`). The advisory chain also includes `global-agent@3.0.0`, `roarr@2.15.4`, and `sprintf-js@1.1.3`.

npm's report suggests `electron-builder@26.5.0` as a fix, which is a downgrade from the current direct dependency. Do **not** apply this recommendation automatically: first confirm which advisories it actually removes, inspect the resulting lockfile and transitive graph, run the full Windows packaging/smoke/fuse checks, and verify no remaining `sprintf-js` advisory. An earlier timed-out `npm view electron-builder@26.5.0 version` query is inconclusive and does not prove that version exists or is safe; do not treat a timed-out registry query as validation.

Until this is resolved, classify the build-tool dependency audit as **open / needs remediation-or-risk-acceptance**, even though CI's current high/critical gate passes. The separate production dependency gate passes only for dependencies selected by `npm audit --omit=dev`; it does not remove the build-pipeline exposure.
