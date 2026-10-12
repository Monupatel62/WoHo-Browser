# WoHo Browser — Dependency Risk Register

**Last reviewed:** 2026-10-12  
**Evidence commit:** `1ef258224ee5c7c20ca6d051f09e903f1f0633df`  
**Status:** Release blocker remains open; this file records observed risk and does not claim the issue is fixed.

## DR-001 — CVE-2026-97058 in transitive build dependency

- **Severity:** Moderate (GitHub Advisory Database).
- **Affected package:** `sprintf-js <= 1.1.3`, reached transitively through `roarr`, `global-agent`, `@electron/get`, and `electron-builder`.
- **Observed in:** The CI `npm audit` report from the evidence commit above. The audit reported 8 moderate findings in this dependency chain.
- **Runtime exposure:** The package is in the development/build dependency graph, not the app's production dependency graph. CI reported zero production dependency vulnerabilities with `npm audit --omit=dev --audit-level=moderate`.
- **Advisory status at review:** The advisory lists no patched `sprintf-js` version. `npm audit fix --force` proposes downgrading `electron-builder` to 26.5.0, which is a breaking downgrade; do not apply it blindly.
- **Current mitigation:** CI retains the full dependency audit and SBOM artifact. The CI workflow has read-only repository permissions and no release-signing credentials are configured in the build job. Treat pull-request build runners and their artifacts as untrusted until validation completes.
- **Release decision:** Do not claim the build toolchain is vulnerability-free. Before distributing a production installer, re-check the advisory and dependency tree; upgrade to a verified patched dependency if available, or record a reviewed and approved mitigation/risk acceptance. Never introduce signing secrets to an untrusted PR build.
- **Verification links:** [GitHub Advisory GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), [CI run 38237149171](https://github.com/Monupatel62/WoHo-Browser/actions/runs/38237149171).

## Ongoing controls

- Keep `npm audit --omit=dev --audit-level=moderate` and `npm audit --audit-level=high` in CI.
- Retain the CycloneDX SBOM and JSON audit report as CI artifacts.
- Re-check all direct and transitive dependencies before each release.
- Keep installer signing keys and publishing credentials out of pull-request workflows.
- Record unresolved advisories, severity, reachability, mitigations, and the release decision in this register.
