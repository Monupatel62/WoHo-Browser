# WoHo Browser — Product Specification Index

**Status:** Planning only. This index and the linked specifications describe proposed behavior, not implemented features.

## Reading order
1. [Master Product Plan](WOHO_BROWSER_MASTER_PLAN.md): vision and release boundaries.
2. [Feature Requirements](feature-requirements.md): requirement IDs and acceptance tracking.
3. [Feature Catalog](feature-catalog.md): complete inventory of proposed product areas.
4. Individual specifications below: user journeys, states, edge cases, privacy, and tests.
5. [Architecture](architecture.md), [Security Model](security-model.md), [Threat Model](threat-model.md), and [IPC Contract](ipc-contract.md): cross-cutting constraints.
6. ADRs: unresolved choices must be decided explicitly before implementation depends on them.

## Cross-platform plans and readiness

- [Cross-platform product strategy](cross-platform-product-strategy.md): platform boundaries, delivery phases, shared constraints.
- [Windows application plan](windows-application-plan.md): existing prototype and release gates.
- [Android application plan](android-application-plan.md): native app feasibility, security, features, and device matrix.
- [Web application plan](web-application-plan.md): companion/PWA scope and local-only data portability.
- [Cross-platform acceptance matrix](cross-platform-acceptance-matrix.md): shared and platform-specific release evidence.

## Feature specifications
- [Product scope and personas](product-scope-and-personas.md)
- [Window and navigation](window-and-navigation.md)
- [Address bar and search](address-bar-and-search.md)
- [Tabs and workspaces](tabs-and-workspaces.md)
- [Bookmarks, history, and sessions](bookmarks-history-sessions.md)
- [Downloads and file handling](downloads-and-file-handling.md)
- [Site permissions and private browsing](site-permissions-and-private-browsing.md)
- [Network security and content safety](network-security-and-content-safety.md)
- [Settings and import/export](settings-import-export.md)
- [Reliability and recovery](reliability-errors-and-recovery.md)
- [Accessibility and localization](accessibility-localization.md)
- [Cross-feature acceptance matrix](cross-feature-acceptance-matrix.md)

## Global requirement language
- **MUST:** release-blocking unless a reviewed ADR records a narrow exception and risk acceptance.
- **SHOULD:** expected default; exceptions need rationale and tests.
- **MAY:** optional capability, not a promise.
- **Open decision:** no implementation should assume a final answer yet.
- **Deferred:** intentionally excluded from the named release.

## Definition of done for every feature
Document its user value, entry points, default behavior, all visible states, input validation, persistence, deletion, privacy implications, permission boundary, keyboard/screen-reader behavior, failure/recovery behavior, platform differences, acceptance tests, and requirement IDs. Completion requires implementation plus passing test/security evidence and an updated status; a document alone never proves implementation.

## Archived planning references

AI assistant, AI broker, agent, and DevKit documents are historical design references only. AI features are out of scope and must not be implemented.

## Current repository status
The repository contains a working browser prototype with implemented navigation, tabs, bookmarks/history, private sessions, permissions, downloads, settings, and automated CI checks. It is not production-ready; consult docs/documentation-audit.md for evidence and outstanding release gates.
