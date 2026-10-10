# ADR-0003: Application Update Mechanism

Status: Open; no production updater selected. Date: 2026-10-10.

Evaluate a supported Electron updater, platform distribution mechanisms, and a custom TUF-style design only if existing mechanisms fail a documented requirement.

## Requirements
- Authenticated update metadata and package integrity verification.
- Anti-downgrade policy, channels, staged rollout, and emergency disable procedure.
- Signing keys kept out of source control and separated from routine code-signing credentials where practical.
- Clear version/status UI and safe offline behavior.
- Recovery from interrupted or failed updates.

## Release 0 tests
Test a full update round trip, invalid package rejection, downgrade rejection, interrupted download recovery, and unavailable metadata. Select the updater only after packaging and Windows support are decided. Record the final choice in a superseding ADR.