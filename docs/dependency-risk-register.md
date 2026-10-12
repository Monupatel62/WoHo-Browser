# WoHo Browser — Dependency Risk Register

**Last reviewed:** 2026-10-12  
**Verified main commit:** `315ebaaa5157a8a5d1987990803572a9ea5376b5`  
**Status:** DR-001 is resolved for the current lockfile and was re-verified after merge.

## DR-001 — CVE-2026-97058 in transitive build dependency

- **Upstream advisory:** Moderate, GHSA-hp3w-g68c-fv3c / CVE-2026-97058. It still lists `sprintf-js <= 1.1.3` as affected and no patched `sprintf-js` release.
- **Previous exposure:** The old Electron packaging dependency tree included `sprintf-js@1.1.3` through `roarr` and `global-agent`; main CI run [38238684805](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38238684805) reported 8 moderate findings.
- **Resolution:** The resolved build tree now pins `electron-builder@26.15.3`, overrides `@electron/get` to `5.1.0`, and resolves `tar@7.5.22`. The current lockfile/SBOM no longer contains `sprintf-js`, `roarr`, `global-agent`, or nested `@electron/get@3.1.0`.
- **Post-merge evidence:** [Main CI run 38242801756](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38242801756) completed successfully. Its uploaded npm audit report has **0 total vulnerabilities** (0 moderate, high, or critical). The stricter full-tree `npm audit --audit-level=moderate` and production dependency audit passed.
- **Build/security validation:** Windows installer packaging, packaged startup smoke, Electron fuse verification, checksum generation, Android tests/build, JavaScript/TypeScript CodeQL, Kotlin CodeQL, and secret scanning all passed on the post-merge main commit.
- **Regression control:** CI fails on any moderate-or-higher vulnerability in the entire dependency tree. Re-run audit/SBOM checks on every dependency or lockfile update.

The upstream advisory itself is not marked patched; the project-level exposure is resolved because the affected package is absent from the currently resolved dependency tree. Re-open this risk if `sprintf-js` or its affected chain is reintroduced.
  
## References

- [GitHub Advisory GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- [Merged remediation PR #130](https://github.com/Monupatel62/WoHo-Browser/pull/130)
- [Post-merge main CI run](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38242801756)
