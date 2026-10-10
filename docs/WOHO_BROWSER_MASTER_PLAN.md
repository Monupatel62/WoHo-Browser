# WoHo Browser — Master Product Plan

> **Status:** Planning / specification  
> **Repository:** https://github.com/Monupatel62/WoHo-Browser  
> **Product owner:** WoHoTech  
> **Document rule:** Keep this file as the living source of truth. Add decisions, verified implementation status, risks, and roadmap changes here as the project evolves. Never mark a feature complete without code, tests, and evidence.

## 1. Product vision

WoHo Browser is a privacy-conscious, AI-assisted desktop web browser built under the WoHoTech brand. The first goal is a dependable Windows browser with familiar navigation and a useful AI workspace. Later releases may expand to Linux, Android, managed business deployments, and deeper browser-engine work.

The product should make everyday browsing work reliably before adding complex AI automation. It must be honest about what it can access, ask before sensitive actions, and keep users in control.

### Product principles
- Useful before flashy: navigation, tabs, downloads, recovery, and updates must work before advanced AI features.
- Security first: web content is untrusted. A webpage must never gain privileged access to the desktop or AI tools.
- User control: explicit permissions for file access, downloads, automation, microphone, camera, and other sensitive capabilities.
- Privacy by design: explain what data leaves the device; avoid collecting browsing history by default.
- Evidence-based releases: every completed claim must be backed by tests and a reproducible build.
- Open and maintainable: document upstream components, licenses, update policy, and third-party dependencies.
- Accessible and practical: keyboard navigation, readable UI, clear error states, and localization considered from the start.

## 2. Target users and problems

### Initial users
1. Developers who want AI help while researching documentation and debugging.
2. Students and researchers who need webpage summaries and source-based notes.
3. Power users who work across many tabs and want better tab organization.
4. Small businesses that may later need managed settings and private AI workflows.

### Problems to solve
- Too many tabs and repeated context switching.
- Time spent reading long pages and comparing sources.
- Repetitive browsing workflows.
- Unclear privacy and permission behavior in AI-powered tools.
- Difficulty using local AI models or a configurable AI provider in a single desktop workflow.

### Initial positioning
A Chromium-based desktop browser with a built-in AI side panel, source-aware page assistance, and transparent permissions. Do not claim it is faster, safer, or more private than Chrome until measured evidence supports that claim.

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

### Release 2 — AI browsing assistant
- Side panel that can answer questions about the current page.
- User-triggered summary, explanation, key points, and Q&A.
- Answers linked to page excerpts or headings where possible.
- Explicit context preview before page content is sent to a remote model.
- Provider configuration and clear cost/privacy disclosures.
- Local-model integration as an optional path, subject to supported hardware and model licenses.
- No autonomous external actions by default.

### Release 3 — Productivity and privacy
- Tab groups/workspaces and session restore.
- Reader view and export of user-selected notes.
- Permission controls for camera, microphone, notifications, location, and pop-ups.
- Tracking/ad blocking only after a maintainable filter-update and exception design is chosen.
- Optional profile separation and improved private-session behavior.
- Import/export of bookmarks and other supported user data.

### Release 4 — Controlled AI actions
- User-defined workflows for limited browsing tasks.
- Preview of intended actions before execution.
- Per-action permission checks, domain allowlists where appropriate, timeouts, cancellation, and audit history.
- No hidden purchases, form submissions, messages, or file operations.
- Confirmation before sending data, submitting forms, downloading executable files, or changing account settings.

### Release 5 — Business and cross-platform expansion
- Managed policies and enterprise configuration.
- Optional centralized deployment and support.
- Linux support after Windows is stable.
- Android investigation as a separate product track; desktop architecture must not be assumed portable.
- Sync only after threat modeling, encryption design, account recovery, and data retention decisions.
- Chromium engine customization only if product requirements justify the cost of maintaining a fork.

## 4. Technical direction

### Proposed starting point
Evaluate Electron + TypeScript + React for the first Windows MVP. Electron is a practical route to a desktop shell but does not mean the product is a full Chromium fork. Keep a documented decision record comparing Electron with CEF or a custom Chromium build before committing to engine-level requirements.

### Suggested application boundaries
- Main process: application lifecycle, windows, trusted system integration, updates, and permission mediation.
- Renderer: browser chrome UI and settings; treat all webpage content as untrusted.
- Web contents/session layer: tab lifecycle, navigation policy, downloads, certificates, and per-session permissions.
- AI broker: explicit context collection, provider selection, redaction, request limits, and response handling.
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
      ai-broker/
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
- Never execute code or shell commands taken from a webpage, prompt, downloaded file, or model response.
- Treat page text as untrusted input and defend against prompt injection. Page content must not override system policy or permission checks.
- Keep secrets out of renderer storage, logs, crash reports, and repository history.
- Protect AI provider keys; explain that a key entered by the user may be stored locally and define how.
- Apply request timeouts, response-size limits, concurrency limits, and cancellation.
- Use HTTPS by default and never silently bypass certificate errors.
- Handle downloads as untrusted files. Show source, destination, file type, and warnings where appropriate.
- Use signed application updates and verify update integrity. Never run an unsigned update payload.
- Avoid collecting browsing history or page contents remotely by default.
- Maintain a threat model and security reporting instructions before public release.

Security controls must be verified against the chosen framework version and official documentation; this list is a baseline, not a security certification.

## 6. AI assistant design

### Safe initial capabilities
- Summarize a page after the user clicks the action.
- Explain selected text.
- Answer questions grounded in the current page.
- Compare user-selected pages.
- Draft notes that the user reviews and saves.
- Help developers understand documentation and errors.

### Data flow
1. User invokes an AI action.
2. UI displays the context to be used.
3. User confirms when content will be sent to a remote provider.
4. AI broker strips unnecessary data and enforces size/time limits.
5. Provider response is treated as untrusted text.
6. UI shows the answer and source context; no privileged action is executed from the answer alone.

### AI provider interface
Use a provider-neutral interface so providers can be added or removed without rewriting the UI. Possible future options include hosted APIs and compatible local inference runtimes. Each integration needs license, privacy, cost, rate-limit, and reliability review.

### WoHo AI DevKit integration
Consider integrating WoHo AI DevKit behind the AI broker, not directly into untrusted webpage contexts. Reuse only packages and capabilities that are compatible with the browser's security model. Browser-specific permission enforcement remains authoritative and cannot be overridden by an agent.

## 7. Privacy and user data

Document each data category, storage location, purpose, retention period, export path, and deletion behavior before shipping:
- Settings and preferences.
- Bookmarks.
- History.
- Download metadata.
- AI prompts and page context.
- Provider credentials.
- Crash diagnostics, if any.
- Sync data, if added later.

Private browsing must not promise invisibility to websites, networks, employers, or internet providers. Clearly explain its actual local-data behavior. Do not market it as anonymous browsing.

## 8. UX and design direction

- Clean, modern interface with light and dark themes.
- Address bar combines URL entry and search without confusing the two.
- Tabs show loading, audio, and crash states where supported.
- AI side panel is optional and can be closed without affecting normal browsing.
- Show the active domain clearly before sensitive operations.
- Give understandable permission prompts with allow-once, allow-for-session, and deny options where technically appropriate.
- Use clear empty, loading, offline, error, and retry states.
- Support keyboard-first use and accessible contrast.
- Avoid copying Chrome branding, icons, or protected visual assets. Create original WoHo Browser identity.

## 9. Monetization hypotheses

Monetization should follow user trust and product usefulness. Validate willingness to pay before building payment infrastructure.

1. Free core browser: basic browsing at no charge.
2. Optional AI usage plans: limits and prices based on real provider costs, with clear disclosure.
3. Business edition: centrally managed settings, deployment help, and support.
4. Custom deployments: paid integration or configuration for organizations.
5. Support contracts: response-time commitments and maintenance for business customers.

Do not depend on advertising or selling browsing history. Do not imply revenue is likely until customer interviews, pilots, or paid commitments support it. Track AI cost per active user and gross margin before offering unlimited AI usage.

## 10. Quality strategy and release gates

### Automated checks
- Formatting, lint, TypeScript checks, unit tests.
- IPC schema and authorization tests.
- Navigation and origin-policy tests.
- Download and permission tests.
- AI broker timeout, size-limit, cancellation, and prompt-injection regression tests.
- Integration tests for tab lifecycle, session restore, and storage migration.
- End-to-end tests on supported Windows versions.
- Dependency and secret scanning; CodeQL or an equivalent static-analysis tool.
- Build/package smoke tests and installer/uninstaller tests.

### Manual release checks
- Install, launch, update, rollback/recovery, and uninstall on a clean Windows environment.
- Open common websites and handle redirects, downloads, media, and authentication.
- Confirm renderer compromise cannot call privileged APIs.
- Confirm denied permissions stay denied.
- Confirm AI features show context and provider disclosures.
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

1. Inspect the empty repository and confirm the default branch.
2. Commit this master plan and a concise root README.
3. Record the Electron-versus-CEF-versus-Chromium decision and rationale.
4. Define supported Windows versions and minimum hardware assumptions.
5. Create architecture, threat model, and privacy documents.
6. Set up CI and dependency/security checks.
7. Build a minimal vertical slice: launch → open HTTPS URL → navigate → close cleanly.
8. Add tabs and safe navigation policies.
9. Add bookmarks/history/downloads with tests.
10. Package a signed or clearly labeled development installer; establish signing/update requirements before public production releases.
11. Run a security review before exposing AI features.
12. Add AI page Q&A behind explicit user action and data disclosure.
13. Test with a small group and validate whether users would pay.
14. Publish a release only when all gates pass.

## 12. Risks and open decisions

- Engine maintenance: a custom Chromium fork has high ongoing rebase and security-patching cost.
- Security exposure: a browser processes hostile web content; incorrect privilege boundaries can compromise the device.
- AI costs: page context and model usage can become expensive.
- Provider dependence: APIs can change, fail, or change prices.
- Compatibility: some websites depend on browser-specific behavior, DRM, extensions, or platform APIs.
- Update trust: compromised updates can compromise every installed copy.
- Scope creep: building every feature at once risks producing an unstable browser.
- Licensing: Chromium/Electron and bundled dependencies have obligations that must be reviewed and met.
- Distribution: code signing, reputation warnings, and installer delivery need planning.

Open decisions to document before implementation:
- Framework and engine.
- Supported Windows versions.
- Project license and third-party notices.
- Product icon and visual design.
- Default search provider.
- AI provider and local model support.
- Telemetry policy.
- Update channel and signing method.
- Whether browser sync is in scope.
- Commercial model and target customer.

## 13. Status ledger

Update this table only with verified repository evidence.

| Area | Status | Evidence / next step |
|---|---|---|
| Repository | Planning document being established | Verify commits on main |
| Product vision | Drafted | Review and revise as decisions are made |
| Framework choice | Open | Compare Electron, CEF, and Chromium fork |
| Architecture | Proposed | Create architecture decision record |
| Security model | Baseline requirements drafted | Create detailed threat model and tests |
| Windows MVP | Not implemented/verified here | Build the first vertical slice |
| AI assistant | Planned | Design broker and consent flow |
| CI and release | Not verified here | Add workflows and inspect real results |
| Monetization | Hypotheses only | Interview potential users and validate willingness to pay |

## 14. Working agreement for future updates

- Keep this document as the master plan; add new ideas in the relevant section instead of scattering contradictory plans.
- Keep completed, in-progress, blocked, and proposed work clearly separated.
- Record major technical choices in docs/decisions/ with context, options, decision, and consequences.
- Before changing implementation, inspect the actual repository state and current CI results.
- Make small, reviewable changes with regression tests.
- Do not claim code has been built, tested, deployed, or released unless the relevant evidence has been checked.
- Preserve a changelog of important plan updates with date, summary, and reason.


## 15. Review-driven scope resolution (supersedes conflicting earlier statements)
This section resolves inconsistencies found during independent review.

- **Engine:** Electron + TypeScript + React is selected for the Release 0 prototype only. See ADR-0001. A production commitment depends on the feasibility spike.
- **Permission policy:** permission request/check handlers, navigation policy, popup policy, and trusted/untrusted view separation are Release 0 foundation work. Permission controls are not deferred to Release 3.
- **Private browsing:** a non-persistent private session is a Windows MVP (Release 1) requirement, subject to tests proving no private visit is written to normal history.
- **Release mapping:** use R0 (feasibility/security foundation), R1 (Windows MVP), R2 (user-controlled AI), R3 (validated productivity/privacy), and R4 (controlled AI actions). Requirements and acceptance criteria live in docs/feature-requirements.md.
- **Telemetry:** off by default. Use CI/release tests and voluntary tester feedback for early metrics. No remote user telemetry until the policy, consent, fields, retention, and opt-out are separately approved.
- **AI DevKit:** no integration until its actual package/tool inventory, license, dependencies, process boundary, and tool manifest are reviewed. See docs/devkit-integration-spec.md.
- **Release 5 is split:** Linux, Android, sync, enterprise management, and a custom Chromium fork are separate future tracks, not one release. Android is a separate product direction because Electron desktop architecture is not portable.
- **Custom Chromium:** not planned. Reopen only through an ADR after a validated requirement and a realistic security-maintenance plan.
- **Estimates:** at 15–20 hours/week, Release 0 spike is estimated at 4–6 weeks; Windows MVP at 4–6 months; user-controlled AI at 2–3 months; productivity/privacy at 3–4 months. These are rough planning estimates, not commitments. Controlled AI actions may require 4–6+ months and remain blocked pending a separate security review.
- **First-tab behavior:** closing the last tab returns to a documented new-tab page; closing the application window exits the window normally. Confirm this behavior in UX tests.
- **Privacy and metrics:** never collect browsing content merely to measure active users. See docs/telemetry-policy.md.
- **Roadmap work:** do not spend time on passwords, passkeys, sync, DRM, full extension compatibility, Linux, Android, or enterprise controls until target-user validation and separate feasibility decisions justify them.

## 16. Documentation index
The README.md links the product plan, requirements, architecture, security and privacy documents, AI specifications, release policies, and ADRs. Keep it updated whenever a new planning document is added.
