# WoHo Browser Testing and Release Gates

## Status definitions
- **Proposed:** designed but not implemented.
- **In progress:** code exists but required evidence is incomplete.
- **Verified:** implementation, tests, and evidence have been checked on the stated commit.
- **Blocked:** a named dependency or failure prevents completion.

Never mark a feature verified based only on a successful compile.

## Continuous integration
Required checks should include:
- Formatting/lint and TypeScript checks.
- Unit and integration tests.
- Dependency lockfile validation and vulnerability scanning.
- Secret scanning and static analysis.
- Build and package smoke tests.
- Relevant Windows end-to-end tests.
- License inventory and third-party notices check.

## Test layers
1. Unit: URL validation, settings migration, policy decisions, AI limits.
2. Integration: IPC boundaries, tabs, sessions, downloads, permissions, storage.
3. End-to-end: install, launch, navigate, tab operations, errors, restart, uninstall.
4. Security: malicious origins, forged IPC, prompt injection, unsafe protocols, download abuse, update integrity.
5. Compatibility: common sites, redirects, authentication, media, scaling, keyboard navigation.
6. Release: clean-machine install, version display, update, failed-update recovery, uninstall.

## Release checklist
- [ ] Version and release notes match the built artifact.
- [ ] All required CI checks pass on the release commit.
- [ ] No known critical/high issue is left unexplained and accepted.
- [ ] Security and privacy review completed.
- [ ] Installer and uninstaller tested on a clean supported Windows environment.
- [ ] Update package signature/integrity verification tested.
- [ ] User data migration and rollback/recovery tested.
- [ ] License notices included.
- [ ] Download size and minimum system requirements documented.
- [ ] Known limitations published.
- [ ] Release artifact checksum and provenance recorded.

## Incident and rollback
Document how to stop a release, disable a broken update channel, publish a fixed build, communicate an incident, and preserve relevant evidence. Do not store signing keys in the repository or CI logs.

## Evidence ledger
For each release record commit SHA, version, workflow run, test results, artifact names and checksums, signing status, supported OS, and known issues.
