# Update and Signing Design Requirements

Status: Requirements only; implementation mechanism remains open.

The updater can replace executable code and is part of the trusted computing base. Separate repository access, build credentials, code-signing credentials, and update metadata keys where practical.

## Required
- Signed artifacts and authenticated update metadata.
- Integrity verification before installation.
- Anti-downgrade policy with documented emergency exception.
- Staged rollout, release channels, and emergency kill switch.
- Safe behavior for invalid, expired, missing, or unreachable metadata.
- Recovery from interrupted downloads and failed installs.
- Key rotation and compromise response.
- Record source commit, workflow, artifact checksum, version, and signature status.

## Release 0 tests
Install clean build; update to a higher version; reject modified/invalid package; reject unauthorized downgrade; interrupt and recover; simulate unavailable metadata; verify uninstall and user-data behavior.

Choose the mechanism after packaging and Windows support are decided. Never store signing keys in the repository or logs.