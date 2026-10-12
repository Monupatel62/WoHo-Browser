# WoHo Browser — Dependency Risk Register

**Last reviewed:** 2026-10-12  
**Candidate evidence commit:** `5b629e8b14c4010a19de034fcaba2f3bfa7e8b33`  
**Status:** Candidate remediation verified on PR #130; the changes are not yet merged to `main`.

## DR-001 — CVE-2026-97058 in transitive build dependency

- **Advisory severity:** Moderate (GitHub Advisory Database).
- **Affected package:** `sprintf-js <= 1.1.3`. The previous dependency graph reached it through `roarr` and `global-agent` in the Electron packaging toolchain.
- **Previous evidence:** Main CI run [38238684805](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38238684805) reported 8 moderate vulnerability entries, including this advisory.
- **Candidate remediation:** Pin `electron-builder@26.15.3`, override `@electron/get` to `5.1.0`, and keep the regenerated npm lockfile. The candidate lockfile resolves `tar@7.5.22` and no longer contains `sprintf-js`, `roarr`, `global-agent`, or nested `@electron/get@3.1.0`.
- **Verification:** [PR #130 CI run](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38241929321) reported zero vulnerabilities from npm audit; the production dependency audit, full dependency audit, Windows packaging, packaged startup smoke test, Electron fuses, checksum generation, Android tests/build, CodeQL (JavaScript/TypeScript and Kotlin), and secret scan all passed at that head.
- **Release status:** This removes the affected package from the candidate resolved tree; it does not mean the upstream `sprintf-js` advisory has been patched. Re-run the full audit after any dependency change and verify the package remains absent. The candidate should not be considered landed until PR #130 and its post-merge main checks pass.

## Ongoing controls

- Fail CI on any moderate-or-higher vulnerability in the complete dependency tree and separately audit production dependencies.
- Retain the CycloneDX SBOM and JSON audit report as CI artifacts.
- Re-check direct and transitive dependencies before every release.
- Keep installer signing keys and publishing credentials out of pull-request workflows.
- Record unresolved advisories, severity, reachability, mitigations, and the release decision in this register.

## References

- [GitHub Advisory GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- [PR #130 — dependency remediation](https://github.com/Monupatel62/WoHo-Browser/pull/130)
