# Product Scope, Personas, and Principles

**Status:** Current scope decision. WoHo Browser is a conventional desktop web browser; AI features are not part of the product or roadmap.

> **Binding scope rule:** Do not add an AI assistant, AI agent, AI API/service, AI DevKit, model runtime, AI UI, AI data flow, or AI-related dependency to WoHo Browser. Older AI documents are archived design references only and do not authorize implementation. Any change requires a new, explicit product-owner decision.

## Product promise

WoHo Browser focuses on dependable everyday navigation, tabs, bookmarks, local history, downloads, private sessions, site permissions, clear errors, and user-controlled local data. It does not require an account or WoHo cloud services.

## Initial user groups

- **Developer/researcher:** documentation browsing, tabs, find-in-page, bookmarks, downloads, and testing websites.
- **Student/researcher:** readable pages, bookmarks, local history, and predictable privacy.
- **Everyday desktop user:** search/navigation, tabs, downloads, zoom, understandable errors, and clean uninstall.
- **Privacy-conscious user:** transparent permissions, private sessions, and local-data controls.
- **Future business user:** may need managed policy and auditability; not an MVP promise.

## Principles

1. Reliable everyday browsing before advanced or optional features.
2. Web content is untrusted and cannot access privileged desktop capabilities.
3. Sensitive actions require user intent and separate permission checks.
4. Explain what data is stored locally and how it is deleted.
5. Recover safely without replaying forms or privileged actions.
6. Accessibility and keyboard operation are release requirements.
7. Keep scope maintainable; defer unsupported or costly features.
8. A roadmap item is not a capability; require tests and evidence.

## Release intent

- **R0 feasibility:** engine/platform, trust boundary, IPC, permission defaults, packaging, CI, licensing.
- **R1 Windows MVP:** navigation, tabs, bookmarks/history, downloads, basic settings, private-session isolation, error handling, accessibility, installer/uninstaller, documented update path.
- **Later browser improvements:** workspaces, reader mode, richer site controls, protection features, extensions, sync, enterprise policy, and cross-platform support only after separate feasibility and security decisions. No AI features are planned.

## Non-goals

No AI assistant/agent/API/service, model runtime, custom Chromium reimplementation, Chrome parity promise, guaranteed DRM/extension compatibility, automatic cloud sync, silent page/file upload, autonomous purchasing/account changes/form submissions, hidden ads/telemetry, or unsubstantiated security claims.

## Decisions needing evidence

Target OS versions/hardware; runtime and patch owner; search defaults/locales; data storage/encryption/retention; updater/signing/rollback; reputation service and privacy/cost; and MVP blockers versus deferrals.

## Success metrics

Measure navigation success, crash-free sessions, startup/tab-switch latency, download reliability, accessibility completion, and time to patch critical upstream issues. Do not collect browsing URLs, page content, or filenames just to calculate metrics.

## Ready-for-implementation gate

Each in-scope feature needs a stable requirement ID, user journey, edge/error behavior, security/privacy notes, accessibility behavior, test plan, and resolved decision dependencies.
