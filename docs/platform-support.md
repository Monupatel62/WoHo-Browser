# Platform Support Matrix

Status: Proposed; verify against the selected Electron version before advertising support.

| Platform | Initial commitment | Notes |
|---|---|---|
| Windows x64 | Release 0 target | Exact minimum version remains open |
| Windows ARM64 | Not committed | Evaluate build/dependency support |
| Linux | Deferred | Packaging, sandbox, desktop integration, updates |
| Android | Separate future product | Electron desktop architecture is not portable |
| macOS | Not planned yet | Demand, signing, notarization, and QA required |

Before Windows release, decide minimum/tested Windows versions, architecture, per-user versus per-machine install, installer/update technology, signing/SmartScreen plan, default-browser registration, protocol/file associations, and clean-install/upgrade/rollback/uninstall behavior.

A platform is supported only after it has a documented test matrix and a tested installer/update path.