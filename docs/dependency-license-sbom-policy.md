# Dependency, License, and SBOM Policy

Status: Proposed; select tooling with the implementation stack.

Prefer maintained packages with clear licenses and security reporting. Pin dependencies in a lockfile. Review updates, transitive packages, install scripts, native modules, and network behavior. Do not commit binaries without provenance and licensing records.

Use automated vulnerability scanning, secret scanning, and static analysis in CI. Triage by shipped exposure and exploitability; record accepted risks and an owner.

Maintain an inventory of direct/transitive licenses. Review Electron/Chromium components, fonts, icons, codecs, model runtimes, and assets. Include required notices in releases.

Generate a release SBOM in SPDX or CycloneDX when tooling is selected. Record source commit, workflow, lockfile, artifact checksum, and signature status.

No public production release until license review, third-party notices, vulnerability triage, and SBOM process are in place.