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
- Dependency installation and vulnerability scanning. `package-lock.json` is committed and CI uses `npm ci` for reproducible dependency installation.
- Secret scanning and static analysis.
- Build and package smoke tests, including launching the packaged Windows app until the chrome renderer loads and initial tab navigation starts; generate a SHA-256 manifest for the unsigned Windows installer.
- Relevant Windows end-to-end tests.
- License inventory and third-party notices check.

## Test layers
1. Unit: URL validation, settings migration, navigation/permission policies, download retention, and storage validation.
2. Integration: IPC boundaries, tabs, sessions, downloads, permissions, storage.
3. Automated packaged-app smoke: launch the unpacked packaged executable in an isolated profile and verify the chrome renderer loads and initial tab navigation starts. This is not a substitute for manual end-to-end testing.
4. End-to-end: install, launch, navigate, tab operations, errors, restart, uninstall.
5. Security: malicious origins, forged IPC, unsafe protocols, download abuse, renderer CSP, and update integrity.
6. Compatibility: common sites, redirects, authentication, media, scaling, keyboard navigation.
7. Release: clean-machine install, version display, update, failed-update recovery, uninstall.

## Release checklist
- [ ] Version and release notes match the built artifact.
- [ ] All required CI checks pass on the release commit.
- [ ] No known critical/high issue is left unexplained and accepted.
- [ ] Security and privacy review completed.
- [ ] Installer and uninstaller tested on a clean supported Windows environment.
- [ ] Signed draft-release workflow passes with a trusted Windows certificate and owner-controlled Android keystore; Authenticode, APK/AAB signature verification, and SHA-256 manifests match the release artifacts.
- [ ] Update package signature/integrity verification tested; a production updater is not implemented yet.
- [ ] User data migration and rollback/recovery tested.
- [ ] License notices included.
- [ ] Download size and minimum system requirements documented.
- [ ] Known limitations published.
- [ ] Release artifact checksum and provenance recorded. CI generates `release/SHA256SUMS.txt` for the unsigned Windows test installer. The tag-triggered signed draft-release workflow generates fresh checksums for signed artifacts; retain those with the matching workflow run and artifact.

## Incident and rollback
Document how to stop a release, disable a broken update channel, publish a fixed build, communicate an incident, and preserve relevant evidence. Do not store signing keys in the repository or CI logs.

## Evidence ledger
For each release record commit SHA, version, workflow run, test results, artifact names and checksums, signing status, supported OS, and known issues.
