# WoHo Browser — Master Product Plan
> **Status:** Release 0 implementation in progress
> **Binding scope decision (2026-10-11):** WoHo Browser is a conventional browser. AI assistant, AI agent, AI API/service, AI DevKit, model runtime, and all AI features are out of scope and are not planned. Older AI sections below are superseded by this notice and must not be used as implementation requirements.
> **Repository:** https://github.com/Monupatel62/WoHo-Browser
> **Product owner:** WoHoTech
> **Document rule:** Keep this file as the living source of truth. Add decisions, verified implementation status, risks, and roadmap changes here as the project evolves. Never mark a feature complete without code, tests, and evidence.
## 1. Product vision
WoHo Browser is a privacy-conscious desktop web browser built under the WoHoTech brand. The first goal is a dependable Windows browser with reliable navigation, tabs, downloads, and user-controlled privacy. AI assistant, AI agent, AI API, and AI service integrations are outside the current product scope. Later releases may expand to Linux, Android, managed business deployments, and deeper browser-engine work.
The product should make everyday browsing work reliably and keep users in control of saved data, site permissions, downloads, and privacy. The current build does not include AI features or AI service calls.
### Product principles
- Useful before flashy: navigation, tabs, downloads, recovery, and updates must work before optional advanced features.
- Security first: web content is untrusted and must never gain privileged access to the desktop.
- User control: explicit permissions for file access, downloads, automation, microphone, camera, and other sensitive capabilities.
- Privacy by design: explain what data leaves the device; avoid collecting browsing history by default.
- Evidence-based releases: every completed claim must be backed by tests and a reproducible build.
- Open and maintainable: document upstream components, licenses, update policy, and third-party dependencies.
- Accessible and practical: keyboard navigation, readable UI, clear error states, and localization considered from the start.
## 2. Target users and problems
### Initial users
1. Everyday users who need reliable web navigation and downloads.
2. Students and researchers who need bookmarks, history, and organized browsing.
3. Developers who research documentation and test web applications.
4. Power users and small businesses that may later need managed settings and privacy controls.
### Problems to solve
- Too many tabs and repeated context switching.
- Unreliable or unclear navigation, download, and recovery behavior.
- Weak control over saved browsing data and website permissions.
- Unclear private-browsing and download-retention behavior.
- Lack of accessible, keyboard-friendly controls and transparent errors.
### Initial positioning
A Chromium-based desktop browser with familiar navigation, reliable downloads, clear permissions, and transparent local-data controls. Do not claim it is faster, safer, or more private than Chrome until measured evidence supports that claim.
## 3. Scope and release strategy
### Release 0 — Technical proof
- Confirm platform, engine, packaging, and licensing choices.
- Create a minimal app shell and architecture decisions.
- Prove navigation to common HTTPS websites.
- Prove safe handling of renderer-to-main-process communication.
- Set up linting, type checks, tests, CI, dependency scanning, and release artifacts.
### Release 1 — Reliable Windows browser (MVP)
- Browser window, address/search bar, back/forward, reload, stop, home.
- Multiple tabs, tab close/reopen, loading indicators, and crash recovery.
- Bookmarks and browsing history stored locally.
- Downloads UI with progress, destination choice, failure states, and open-folder action.
- Basic settings, default search provider selection, startup behavior.
- Clear certificate/network error screens; HTTPS status visibility.
- Keyboard shortcuts, accessible focus behavior, responsive layouts.
- Installer, uninstall support, version display, and documented update process.
### Release 2 — Reliable browsing and privacy
- User-visible settings for home page, search provider, startup behavior, and appearance.
- Session restore and clear recovery behavior after a renderer or app crash.
- Bookmark import/export and editing, plus history filters and range deletion.
- Clear, tested site-permission revocation and private-session cleanup.
- Download retry/removal controls and safe cleanup of partial files.
- Accessibility, localization, and common-site compatibility testing.
- No AI assistant, agent, API, model, or AI service integration.
### Release 3 — Productivity and privacy
- Tab groups/workspaces and session restore.
- Reader view and export of user-selected notes.
- Tracking/ad blocking only after a maintainable filter-update, privacy, exception, and filter-maintenance design is approved.
- Richer site controls and validated privacy features beyond the Release 1 private-session baseline.
- Import/export of bookmarks and other supported user data.
Permission request/check handlers and a tested non-persistent private session are foundation/MVP requirements, not features deferred to this release.
### Release 4 — Advanced browser controls
- Optional tab groups and workspace profiles after session isolation is verified.
- Site-specific content and permission controls with clear reset behavior.
- Stronger download safety UX and recoverable failure handling.
- Enterprise policy controls only after a threat model and maintenance plan are approved.
- No AI-driven browsing actions or background automation in the current product scope.
### Release 5 — Business and cross-platform expansion
- Managed policies and enterprise configuration.
- Optional centralized deployment and support.
- Linux support after Windows is stable.
- Android investigation as a separate product track; desktop architecture must not be assumed portable.
- Sync only after threat modeling, encryption design, account recovery, and data retention decisions.
- Chromium engine customization only if product requirements justify the cost of maintaining a fork.
## 4. Technical direction
### Proposed starting point
Electron + TypeScript + React is selected for the Release 0 feasibility prototype only, as recorded in ADR-0001. Electron is a practical route to a desktop shell but is not a custom Chromium fork. The production commitment remains conditional on the Release 0 spike; compare relevant alternatives only to the extent needed to validate packaging, security controls, licensing, compatibility, and maintenance capacity.
### Suggested application boundaries
- Main process: application lifecycle, windows, trusted system integration, updates, and permission mediation.
- Renderer: browser chrome UI and settings; treat all webpage content as untrusted.
- Web contents/session layer: tab lifecycle, navigation policy, downloads, certificates, and per-session permissions.
- Search boundary: explicit search-provider selection and search-suggestion privacy. AI broker and AI service calls are out of scope.
- Storage layer: versioned local settings, bookmarks, history, and workspace metadata.
- Update service: signed release metadata and a documented rollback/recovery plan.
- Telemetry: off by default unless a clear, minimal, consent-based policy is approved.
### Repository structure proposal
    README.md
    SECURITY.md
    CONTRIBUTING.md
    LICENSE                 # Add only after choosing a license
    docs/
      WOHO_BROWSER_MASTER_PLAN.md
      architecture.md
      security-model.md
      privacy.md
      threat-model.md
      decisions/
      testing-and-release.md
    apps/
      desktop/
    packages/
      browser-ui/
      shared/
    tests/
      unit/
      integration/
      e2e/
    .github/
      workflows/
This is a proposed structure, not a claim that these directories already exist. Choose a monorepo layout only if it helps; avoid empty scaffolding without a working vertical slice.
## 5. Security requirements
Security is a release gate, not a later polish task.
- Keep Electron nodeIntegration disabled for web content.
- Enable context isolation and sandboxing wherever supported.
- Use a narrow, typed preload API; never expose unrestricted Node.js APIs to pages.
- Validate every IPC message, including sender origin/frame, payload schema, size, and permitted operation.
- Deny unexpected navigation, new windows, custom protocols, and permission requests by default; allow only deliberate, tested cases.
- Never execute code or shell commands taken from a webpage or downloaded file.
- Treat all web content as untrusted. It must not override browser security policy or gain privileged desktop access.
- Keep secrets out of renderer storage, logs, crash reports, and repository history.
- Apply request timeouts, response-size limits, concurrency limits, and cancellation.
- Use HTTPS by default and never silently bypass certificate errors.
- Handle downloads as untrusted files. Show source, destination, file type, and warnings where appropriate.
- Use signed application updates and verify update integrity. Never run an unsigned update payload.
- Avoid collecting browsing history or page contents remotely by default.
- Maintain a threat model and security reporting instructions before public release.
Security controls must be verified against the chosen framework version and official documentation; this list is a baseline, not a security certification.
## 6. AI features — out of scope
WoHo Browser will not ship an AI assistant, AI agent, AI API/service integration, AI DevKit integration, model runtime, AI panel, or AI-related data flow. No AI-related dependency or UI should be added. Older AI design documents are archived references only; they are not requirements or roadmap commitments.
## 7. Privacy and user data
Document each data category, storage location, purpose, retention period, export path, and deletion behavior before shipping:
- Settings and preferences.
- Bookmarks.
- History.
- Download metadata.
- Crash diagnostics, if any.
- Sync data, if added later.
Private browsing must not promise invisibility to websites, networks, employers, or internet providers. Clearly explain its actual local-data behavior. Do not market it as anonymous browsing.
## 8. UX and design direction
- Clean, modern interface with light and dark themes.
- Address bar combines URL entry and search without confusing the two.
- Tabs show loading, audio, and crash states where supported.
- Show the active domain clearly before sensitive operations.
- Give browser-controlled, accessible permission prompts with deny by default and clearly documented allow/remember semantics. Do not promise allow-once or allow-for-session until the selected engine supports the exact behavior and tests verify it.
- Use clear empty, loading, offline, error, and retry states.
- Support keyboard-first use and accessible contrast.
- Avoid copying Chrome branding, icons, or protected visual assets. Create original WoHo Browser identity.
## 9. Monetization hypotheses
Monetization should follow user trust and product usefulness. Validate willingness to pay before building payment infrastructure.
1. Free core browser: basic browsing at no charge.
2. Business edition: centrally managed settings, deployment help, and support.
3. Custom deployments: paid configuration for organizations.
4. Support contracts: response-time commitments and maintenance for business customers.
Do not depend on advertising or selling browsing history. Do not imply revenue is likely until customer interviews, pilots, or paid commitments support it.
## 10. Quality strategy and release gates
### Automated checks
- Formatting, lint, TypeScript checks, unit tests.
- IPC schema and authorization tests.
- Navigation and origin-policy tests.
- Download and permission tests.
- Integration tests for tab lifecycle, session restore, and storage migration.
- End-to-end tests on supported Windows versions.
- Dependency and secret scanning; CodeQL or an equivalent static-analysis tool.
- Build/package smoke tests and installer/uninstaller tests.
### Manual release checks
- Install, launch, update, rollback/recovery, and uninstall on a clean Windows environment.
- Open common websites and handle redirects, downloads, media, and authentication.
- Confirm renderer compromise cannot call privileged APIs.
- Confirm denied permissions stay denied.
- Check keyboard navigation, scaling, screen size, and error recovery.
### Definition of done
A feature is done only when:
1. Implementation exists on the target branch.
2. Tests cover expected behavior and meaningful failure cases.
3. Security and privacy implications have been reviewed.
4. CI passes.
5. Documentation and screenshots are updated where useful.
6. The release status is verified from the actual repository and build artifacts.
## 11. Initial work plan
1. Finish a consistency audit across the existing specifications, requirements, and ADRs; remove contradictory or duplicate statements.
2. Confirm exact supported Windows versions, architecture, and reference hardware for the Release 0 spike.
3. Verify repository automation and add CI, dependency, secret, and static-analysis checks if missing.
4. Implement the smallest vertical slice: launch → open HTTPS URL → navigate safely → close cleanly.
5. Add automated tests for navigation, popup denial, permission defaults, IPC boundaries, and renderer isolation before expanding features.
6. Prototype multiple tabs with the selected view model and test crash/cleanup behavior.
7. Evaluate storage, packaging, licensing, and update integrity through working prototypes; update the relevant ADRs with evidence.
8. Package a clearly labeled development build for the R0 spike. It is not a production release.
9. Validate the product with target users before committing to monetization or advanced features.
10. Publish only after all release gates pass.
## 12. Risks and open decisions
- Engine maintenance: a custom Chromium fork has high ongoing rebase and security-patching cost.
- Security exposure: a browser processes hostile web content; incorrect privilege boundaries can compromise the device.
- Compatibility: some websites depend on browser-specific behavior, DRM, extensions, or platform APIs.
- Update trust: compromised updates can compromise every installed copy.
- Scope creep: building every feature at once risks producing an unstable browser.
- Licensing: Chromium/Electron and bundled dependencies have obligations that must be reviewed and met.
- Distribution: code signing, reputation warnings, and installer delivery need planning.
Open decisions to document before implementation:
- Production framework/engine commitment after the Release 0 spike.
- Supported Windows versions.
- Project license and third-party notices.
- Product icon and visual design.
- Default search provider.
- Telemetry policy.
- Update channel and signing method.
- Whether browser sync is in scope.
- Commercial model and target customer.
## 13. Status ledger
Update this table only with verified repository evidence.
| Area | Status | Evidence / next step |
|---|---|---|
| Repository | Active implementation prototype | Last verified implementation commit `695dc8815eaea798d010a983b0c76501e8175c64` on 2026-10-11; fresh-main CI run `38127651625` and CodeQL run `38127651596` passed |
| Product vision | Drafted; current scope clarified | This build prioritizes a dependable Windows browser; AI assistant/agent/API/service integration is explicitly out of scope |
| Framework choice | Electron + TypeScript + React selected for R0 prototype only; production decision open | ADR-0001 and `docs/release-0-spike-plan.md`; production commitment remains conditional |
| Architecture | Partially implemented, not production-verified | `docs/architecture.md`, `docs/security-model.md`, IPC sender checks, isolated WebContentsView tabs, bounded storage and navigation-policy tests |
| Security model | Partially implemented; automated checks verified on the audited commit | Navigation/popup restrictions, secure-origin permission policy, private-session isolation, bounded profile reads, download URL/name hardening; full threat-model and Windows runtime review remain |
| Windows MVP | In-progress prototype | Navigation, home button, tabs, bookmarks/history, downloads, permissions, private tabs, settings, opt-in session restore and failure feedback exist; clean Windows runtime, signed installer and release gates remain |
| AI features | Out of scope; not planned | No AI integration, model runtime, AI dependency, or AI service calls |
| CI and release | CI and CodeQL passed on fresh `main` at implementation commit `695dc8815eaea798d010a983b0c76501e8175c64` | Windows lint/typecheck/tests/build, `npm ci`, packaged-app startup smoke, unsigned installer packaging, Electron fuse verification, SBOM and audit artifacts run in CI; code signing, updater, clean-machine install/uninstall and manual runtime evidence remain |
| Monetization | Hypotheses only | Interview target users and validate willingness to pay |
### Status-ledger changelog
- **2026-10-11:** Replaced stale “documentation stage” and “no workflows found” entries with verified implementation status. The audited `main` commit was `aa18425c6a6d84e3503dec5f881e835ddfa1a885`. The filename-hardening PR head passed Windows CI and CodeQL; fresh checks on that merge commit were still queued. This is not a production-readiness claim: Windows runtime testing, signing, updater integrity, and the full release/security review remain open.
- **2026-10-11 (follow-up):** Updated the status ledger after PRs #70–#73 and #75. Main is `7378df81be084debba8fc2d1a1d4ace01a5d1265`; fresh-main Windows CI (`38126010114`) and CodeQL (`38126010164`) passed. Recent fixes verify packaged Electron fuses in CI, clear site data for the active session, and preserve durable deletion semantics for download records, retention pruning, and bulk history operations. The browser remains a prototype: clean Windows runtime testing, dependency-advisory triage, license/third-party notices, signing, and updater verification remain open; this PR adds the lockfile and switches CI to `npm ci`, pending exact-head checks.
- **2026-10-11 (reproducibility and permissions follow-up):** PR #77 committed `package-lock.json` and switched Windows CI to `npm ci`; exact-head and fresh-main checks passed. PR #78 aligned the Site permissions panel with the active tab session, so private-session decisions remain isolated and the UI no longer shows or edits normal-profile grants while a private tab is active. Latest verified implementation commit is `3eafef0ae763064323b158ae41d4b3834b4d4f06`; fresh-main CI (`38126943228`) and CodeQL (`38126943212`) passed. Remaining gates are manual Windows runtime verification, dependency advisory triage, owner-approved license/third-party notices, signing, and updater integrity.
- **2026-10-11 (packaged startup smoke follow-up):** PR #80 added a Windows CI smoke test that launches the packaged executable in an isolated profile and verifies the chrome renderer loads and initial tab navigation starts. It passed on implementation commit `695dc8815eaea798d010a983b0c76501e8175c64`; fresh-main CI (`38127651625`) and CodeQL (`38127651596`) passed. This does not replace manual clean-machine install/uninstall or compatibility testing. Signing, updater integrity, license/third-party notices, and the moderate transitive `sprintf-js` advisory remain open.
## 14. Working agreement for future updates
- Keep this document as the master plan; add new ideas in the relevant section instead of scattering contradictory plans.
- Keep completed, in-progress, blocked, and proposed work clearly separated.
- Record major technical choices in docs/decisions/ with context, options, decision, and consequences.
- Before changing implementation, inspect the actual repository state and current CI results.
- Make small, reviewable changes with regression tests.
- Do not claim code has been built, tested, deployed, or released unless the relevant evidence has been checked.
- Preserve a changelog of important plan updates with date, summary, and reason.
## 15. Controlling scope clarifications
This section records the controlling interpretation for earlier roadmap wording. Where earlier prose differs, the explicit requirements and release mapping below control; revise the earlier prose as part of normal documentation maintenance.
- **Engine:** Electron + TypeScript + React is selected for the Release 0 prototype only. See ADR-0001. A production commitment depends on the feasibility spike.
- **Permission policy:** permission request/check handlers, navigation policy, popup policy, and trusted/untrusted view separation are Release 0 foundation work. Permission controls are not deferred to Release 3.
- **Private browsing:** a non-persistent private session is a Windows MVP (Release 1) requirement, subject to tests proving no private visit is written to normal history.
- **Release mapping:** use R0 (feasibility/security foundation), R1 (Windows MVP), and later non-AI browser improvements only after explicit approval. Requirements and acceptance criteria live in docs/feature-requirements.md.
- **Telemetry:** off by default. Use CI/release tests and voluntary tester feedback for early metrics. No remote user telemetry until the policy, consent, fields, retention, and opt-out are separately approved.
- **AI features:** out of scope; do not integrate AI DevKit, model runtimes, AI services, or AI UI. Related documents are archived references only.
- **Release 5 is split:** Linux, Android, sync, enterprise management, and a custom Chromium fork are separate future tracks, not one release. Android is a separate product direction because Electron desktop architecture is not portable.
- **Custom Chromium:** not planned. Reopen only through an ADR after a validated requirement and a realistic security-maintenance plan.
- **Estimates:** any timeline is a planning estimate, not a commitment; prioritize the Windows MVP and release gates.
- **First-tab behavior:** closing the last tab returns to a documented new-tab page; closing the application window exits the window normally. Confirm this behavior in UX tests.
- **Privacy and metrics:** never collect browsing content merely to measure active users. See docs/telemetry-policy.md.
- **Roadmap work:** do not spend time on passwords, passkeys, sync, DRM, full extension compatibility, Linux, Android, or enterprise controls until target-user validation and separate feasibility decisions justify them.
## 16. Documentation index
Start with docs/product-specification-index.md and docs/feature-catalog.md. The README.md links the detailed feature specifications, architecture, security/privacy documents, release policies, and ADRs. AI-related design files are archived scope-exclusion references only. Keep it updated whenever a planning document is added.
