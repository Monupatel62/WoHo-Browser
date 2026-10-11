# WoHo Browser

WoHo Browser is a WoHoTech desktop browser focused on dependable browsing and privacy-conscious design. AI assistant and AI integrations are explicitly out of scope; the application does not call AI services.

## Project status

**Release 0 prototype in progress.** The Electron/Chromium shell, navigation and IPC security controls, bookmarks and redacted local history, isolated private tabs, session-scoped site permissions, bounded persistent download history, find-in-page, bounded per-tab zoom, recently-closed normal-tab recovery, clear-site-data controls, and Windows packaging CI are implemented in code. Main and feature-branch CI/CodeQL are run through GitHub Actions; Windows runtime and independent security review remain outstanding.

## Start here
- [Product specification index](docs/product-specification-index.md)
- [Documentation audit and remaining gaps](docs/documentation-audit.md)
- [Exhaustive feature catalog](docs/feature-catalog.md)
- [Master product plan](docs/WOHO_BROWSER_MASTER_PLAN.md)
- [Release 0 feasibility spike](docs/release-0-spike-plan.md)
- [Release 0 implementation status](docs/release-0-implementation.md)
- [Feature requirements](docs/feature-requirements.md)
- [Architecture](docs/architecture.md)

## Detailed feature specifications
- [Product scope and personas](docs/product-scope-and-personas.md)
- [Window and navigation](docs/window-and-navigation.md)
- [Address bar and search](docs/address-bar-and-search.md)
- [Tabs and workspaces](docs/tabs-and-workspaces.md)
- [Bookmarks, history, and sessions](docs/bookmarks-history-sessions.md)
- [Downloads and file handling](docs/downloads-and-file-handling.md)
- [Site permissions and private browsing](docs/site-permissions-and-private-browsing.md)
- [Network security and content safety](docs/network-security-and-content-safety.md)
- [Settings and import/export](docs/settings-import-export.md)
- [Reliability, errors, and recovery](docs/reliability-errors-and-recovery.md)
- [Accessibility and localization](docs/accessibility-localization.md)
- [Cross-feature acceptance matrix](docs/cross-feature-acceptance-matrix.md)

## Security and privacy

The app enforces a single running instance to prevent concurrent processes from overwriting the same local profile JSON stores; a second launch focuses the existing window.
- [Security model](docs/security-model.md)
- [Threat model](docs/threat-model.md)
- [IPC contract](docs/ipc-contract.md)
- [Privacy requirements](docs/privacy.md)
- [Data model and retention](docs/data-model-and-retention.md)
- [Telemetry policy](docs/telemetry-policy.md)

## Product and release engineering
- [UI/UX and trusted UI](docs/ui-ux-spec.md)
- [Platform support matrix](docs/platform-support.md)
- [Extension strategy](docs/extension-strategy.md)
- [Update and signing requirements](docs/update-and-signing.md)
- [Testing and release gates](docs/testing-and-release.md)
- [Performance and compatibility budgets](docs/performance-and-compatibility-budgets.md)
- [Dependency, license, and SBOM policy](docs/dependency-license-sbom-policy.md)
- [Incident response and CVE policy](docs/incident-response-and-cve-policy.md)

## Business validation
- [Competitive analysis](docs/competitive-analysis.md)
- [Monetization and validation](docs/monetization-and-validation.md)

## Architecture decisions
- [ADR-0001: Engine and platform](docs/decisions/ADR-0001-engine-and-platform.md)
- [ADR-0002: Tab view model](docs/decisions/ADR-0002-tab-view-model.md)
- [ADR-0003: Updater](docs/decisions/ADR-0003-updater.md)
- [ADR-0004: Storage](docs/decisions/ADR-0004-storage.md)
- [ADR-0005: License](docs/decisions/ADR-0005-license.md)

## Contribution and security
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Development setup

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run dev
```

Build bundles with `npm run build`. On Windows, `npm run package:win` creates an unsigned development installer. Signing and auto-updates are not configured.

## Initial stack
Electron + TypeScript + React is selected for the Release 0 prototype only. The final production decision depends on the feasibility spike. This does not promise full Chrome extension compatibility, DRM, sync, or Chrome feature parity.

## Important
This project intentionally excludes AI assistant features and AI service integrations. The browser prototype has CI-based build/package verification, but a clean Windows install and runtime behavior must still be tested before calling the product verified. Do not treat the product as production-ready until security review, tests, packaging, update verification, and release checks are complete. A project license has not yet been selected; see ADR-0005.
