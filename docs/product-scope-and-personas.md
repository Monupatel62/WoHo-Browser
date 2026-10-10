# Product Scope, Personas, and Principles

**Status:** Proposed; validate priorities with real users before treating them as proven.

## Product promise
WoHo Browser is planned as a desktop browser with dependable everyday navigation and an optional user-controlled AI workspace. Core browsing must work without AI, an account, or WoHo cloud services. Do not claim superiority over other browsers without reproducible evidence.

## Initial user groups
- **Developer/researcher:** needs documentation browsing, tab control, find-in-page, source-aware AI explanations.
- **Student/researcher:** needs readable pages, source comparison, bookmarks, notes/export, and predictable privacy.
- **Everyday desktop user:** expects search/navigation, history, downloads, print, zoom, understandable errors, and clean uninstall.
- **Privacy-conscious user:** needs transparent permissions, private sessions, local data controls, and consent before remote AI submission.
- **Future business user:** may need managed policy and auditability; not an MVP promise.

## Principles
1. Core browsing before advanced AI.
2. Web content is untrusted and cannot access privileged desktop capabilities.
3. Sensitive actions require user intent and separate permission checks.
4. State clearly what remains local and what is sent to a provider.
5. Recover safely without replaying forms or privileged actions.
6. Accessibility and keyboard operation are release requirements.
7. Keep scope maintainable; defer unsupported or costly features.
8. A roadmap item is not a capability; require tests and evidence.

## Release intent
- **R0 feasibility:** engine/platform, trust boundary, IPC, permission defaults, packaging, CI, licensing.
- **R1 Windows MVP:** navigation, tabs, bookmarks/history, downloads, basic settings, private-session isolation, error handling, accessibility, installer/uninstaller, documented update path.
- **R2 AI assistance:** user-triggered summaries/Q&A, context preview, provider controls, cancellation, source references where feasible, remote-data disclosure.
- **R3 productivity/privacy:** workspaces, reader mode, richer site controls, protection features only after maintenance design.
- **Later gated:** extensions, sync, enterprise policy, cross-platform, advanced agents, custom engine work.

## Non-goals unless approved
No custom Chromium reimplementation, Chrome parity promise, guaranteed DRM/extension compatibility, automatic cloud sync, silent page/file upload, autonomous purchasing/account changes/form submissions, hidden ads/telemetry, or unsubstantiated security claims.

## Decisions needing evidence
Target OS versions/hardware; runtime and patch owner; search defaults/locales; data storage/encryption/retention; updater/signing/rollback; reputation service and privacy/cost; AI providers/model licenses/cost; and MVP blockers versus deferrals.

## Success metrics
Measure navigation success, crash-free sessions, startup/tab-switch latency, download reliability, accessibility completion, AI source faithfulness, and time to patch critical upstream issues. Do not collect browsing URLs, page content, prompts, or filenames just to calculate metrics.

## Ready-for-implementation gate
Each R1 feature has a stable ID, user journey, edge/error behavior, security/privacy notes, accessibility behavior, test plan, and resolved decision dependencies.
