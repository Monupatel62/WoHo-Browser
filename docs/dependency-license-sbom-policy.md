# Dependency, License, and SBOM Policy

**Status:** Partially implemented; license-notice release gates remain open.

## Dependency hygiene

Pin application and build dependencies through `package-lock.json`. Review updates, transitive packages, install scripts, native modules, and network behavior. CI runs `npm audit --json`, prints a dependency advisory summary, and fails on high/critical advisories. Moderate/low advisories still require explicit triage; a passing CI run does not mean the dependency tree is vulnerability-free.

## SBOM evidence

CI generates a CycloneDX dependency SBOM with npm and uploads it together with the raw `npm-audit.json` report as the `woho-browser-dependency-evidence` artifact. Retention is 30 days. These are build-run evidence artifacts, not a permanent release record. For a public release, retain the exact SBOM and audit report alongside the source commit, lockfile hash, installer checksum, workflow run, and signing status.

## Vulnerability triage

Assess each advisory against the resolved package version, affected code path, whether untrusted input can reach it, and whether the package is included in the shipped application or only used by build tooling. Do not apply an unreviewed forced downgrade or override solely to make `npm audit` green. Record the decision and re-evaluate when a patched compatible version becomes available.

Current known item: CI has reported moderate `sprintf-js` advisory entries through the `electron-builder` dependency tree (GHSA-hp3w-g68c-fv3c / CVE-2026-97058). The advisory lists affected versions through 1.1.3 and no patched version; npm suggests a breaking builder change rather than a direct safe fix. This is build-tooling exposure, not evidence that the browser's renderer directly uses `sprintf-js`. Keep this as an open triage item; do not claim it is fixed or risk-free.

## Licenses and third-party notices

The SBOM is not a substitute for a legal license inventory. Review direct/transitive npm licenses and Electron/Chromium, fonts, icons, codecs, and other bundled assets. Include required third-party notices in distributable packages. The project owner has not selected a project license; do not add one without approval.

## Release gate

No public production release until vulnerability triage, owner-approved project licensing, third-party notices, and retained release provenance are complete. The current Windows installer is unsigned, and signing/updater verification is not implemented.
