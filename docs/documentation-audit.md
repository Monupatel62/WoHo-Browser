# WoHo Browser Documentation Audit

**Audit date:** 2026-10-10  
**Audit type:** Repository structure and targeted consistency review  
**Repository status:** Documentation/specification only; no working browser implementation verified.

## Scope actually checked

The review inspected the root README, master plan, architecture, feature requirements, security model, network/content-safety specification, download/file-handling specification, feature catalog, product specification index, cross-feature acceptance matrix, release-0 spike plan, platform support, updater requirements, extension strategy, SECURITY.md, and ADR-0001 through ADR-0005. Repository directory listings and the current `main` branch were also checked.

This is **not yet a line-by-line review of every paragraph in every document**. Continue the whole-repository audit before treating documentation as complete.

## Verified repository facts

- The repository is still in the planning/specification stage. Do not claim that browser features, security controls, tests, packaging, or updates are implemented.
- `docs/` contains 38 direct files plus five ADR files under `docs/decisions/` (43 documentation files total).
- The README's local Markdown links were checked against the listed repository paths; no broken local targets were found in that check.
- No `.github/` directory or `.github/workflows/` directory was found in the repository listing. CI, dependency scanning, secret scanning, and CodeQL must not be described as configured or passing.
- No `LICENSE` file is present. ADR-0005 correctly leaves licensing open; do not add a license until the project owner chooses one.
- Electron + TypeScript + React is accepted for the Release 0 prototype only. Production framework/engine commitment remains conditional on spike evidence.
- ADR-0002 proposes Electron `WebContentsView` for the prototype; this is not evidence that it is implemented or that browser parity is complete.

## Issues found and corrections made

1. Removed the duplicate Reader view/export bullet in the master plan.
2. Replaced the outdated “empty repository” work-plan step with actions appropriate to the current documentation-first stage and the next Release 0 work.
3. Updated the master-plan status ledger: prototype framework choice is recorded accurately, production choice remains open, and CI/release automation is explicitly unverified.
4. Updated the master-plan open-decision list so it no longer treats the already-selected prototype stack as wholly undecided.
5. Clarified in the architecture document that website renderers must have Node integration disabled, context isolation enabled, and sandboxing enabled; an unsupported control requires a reviewed exception and blocks release until residual risk is addressed.
6. Removed the stale architecture wording that described framework/engine selection as wholly open; production commitment remains open, while the prototype choice is recorded in ADR-0001.

## Open decisions before production

- Exact minimum and tested Windows versions, CPU architecture, and reference hardware.
- Production framework/engine decision after Release 0 evidence.
- Updater mechanism, signing arrangement, key rotation, rollback, and emergency stop.
- Storage engine/driver and tested migration/corruption recovery.
- Project license, dependency compatibility, notices, and contributor terms.
- Safe Browsing/phishing/malware reputation provider decision; no such protection may be claimed until implemented and verified.
- Default search provider and search-suggestion privacy.
- AI provider/local-model support, credential storage, remote retention disclosures, and cost limits.
- Telemetry remains off by default unless a separately approved consent/retention policy changes that.
- Accessibility, compatibility, performance, update integrity, and security claims need implementation evidence.

## High-priority next actions

| Priority | Action | Completion evidence |
|---|---|---|
| P0 | Finish a line-by-line consistency pass across all specifications and ADRs | Contradiction/duplicate scan results and reviewed changes |
| P0 | Add CI workflows for lint/typecheck/tests, dependency and secret scanning, and static analysis | Workflow files plus passing runs on the reviewed commit |
| P0 | Start the Release 0 vertical slice only after the doc pass | Launch → HTTPS navigation → safe failure → clean close, with tests |
| P0 | Test renderer isolation, IPC authorization, permission defaults, popup/navigation policy | Automated negative tests and recorded runtime/version |
| P1 | Decide supported Windows matrix and packaging approach | Platform-support document and reproducible installer test |
| P1 | Prototype update and storage approaches; update ADRs from evidence | Test results and superseding/updated ADRs |
| P1 | Resolve licensing and third-party notices before public code distribution | Chosen license, inventory, and included notices |

## Audit rules

- Never infer implementation from a specification or a commit message.
- Mark a requirement Verified only when the implementation, tests, platform/runtime, and CI evidence are checked on a specific commit.
- Keep open decisions explicitly open; do not silently select a provider, license, or updater.
- Repeat the audit after each meaningful batch of changes and re-check all internal links.
