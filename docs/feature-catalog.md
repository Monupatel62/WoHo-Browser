> **Scope notice (2026-10-11):** This is a planning inventory, not proof of implementation. AI features are excluded from WoHo Browser and are not part of its roadmap. The AI-related headings below are retained only as explicit exclusions for historical traceability.

# WoHo Browser — Exhaustive Feature Catalog

**Status:** Proposed inventory, not a claim of implementation. Each item must be assigned a requirement ID, release, and test before it becomes committed scope.

## A. App shell and lifecycle
- First launch, first-run choices, main window, multiple-window policy, minimize/maximize/restore/resize, multi-monitor behavior, close confirmation, clean shutdown, startup failure, version/about page, release notes, help links, uninstall.
- UI states: idle, loading, disabled, success, warning, blocked, error, offline, crashed, updating, restart required.
- No mandatory account or cloud setup to browse.

## B. Navigation and address/search
- Address bar, URL-versus-query parsing, normalization, origin display, safe internationalized-domain display, paste/copy, autocomplete, history/bookmark suggestions, optional remote suggestions, search provider settings, query encoding, invalid input, redirects, back/forward/reload/stop/home, new-tab navigation, progress, TLS/network error pages.
- Find-in-page, zoom, print/PDF, fullscreen, text selection, context menu, link/image actions, external-protocol prompts require explicit release decisions.

## C. Tabs and organization
- Open/select/close/reopen/duplicate/reorder tabs; active/loading/failed/crashed states; titles/favicons; popup-created tabs; session restore; last-tab behavior.
- Later candidates: pinning, groups, workspaces, tab search, recently closed tabs, memory-pressure discard, cross-window movement.
- Private tabs use a separate non-persistent session.

## D. Bookmarks, history, and sessions
- Add/edit/delete bookmarks; folders, move/reorder, search, duplicates, import/export.
- History list/search/time filtering, remove one/range/all, retention, private-session exclusion, deletion verification.
- Session restore stores safe URLs and approved metadata only; it does not replay forms or privileged actions.
- Clear-data categories and exact deletion semantics.

## E. Downloads and files
- Start/progress/completion/cancel/failure; origin and destination; safe filename/path; collision handling; retry/resume if supported; remove from list versus delete file; show folder; deliberate open; disk-full and permission errors; partial-file cleanup; Windows Mark-of-the-Web; explicit reputation-scanning decision.
- Never auto-execute or auto-open a downloaded file; no automatic archive extraction in MVP.

## F. Site permissions and content safety
- Origin-specific permission requests and revocation; camera, microphone, location, notifications, clipboard, screen capture, device APIs only when supported.
- Active-site controls, site-data clearing, popup policy, certificate errors, mixed content, external protocols, phishing/malware reputation decision.
- Unknown permissions default to deny; browser-controlled prompts cannot be spoofed by page content.

## G. Privacy and profile data
- Private browsing, cookies/site storage, cache, history, downloads metadata, diagnostics, suggestions cache, import/export, reset, profile recovery/deletion.
- Explain private browsing is not anonymity and document what local deletion does and does not remove.
- No hidden telemetry, browsing-history upload, or search-provider substitution.

## H. AI features — excluded

WoHo Browser has no AI assistant, agent, API/service, model runtime, AI DevKit integration, AI UI, or AI data flow. Do not implement the capabilities in old AI design documents or add dependencies for them. This section is a scope exclusion, not a feature proposal.


## I. Settings and customization
- Startup/home, search/suggestions, theme, zoom, downloads, site permissions, privacy/data clearing, accessibility, diagnostics consent, version/update channel, reset, import/export.
- Each setting needs default, type/range, storage scope, restart requirement, migration, and reset semantics.

## J. Accessibility and localization
- Keyboard-only operation, shortcuts, focus order, accessible names/roles/states, screen-reader announcements, contrast, scaling, reduced motion, high contrast, narrow windows, IME, Unicode, locale-aware formatting, translation framework, RTL decision, IDN safety.

## K. Reliability and recovery
- Offline/DNS/TLS/timeout errors, renderer/app crash, corrupt profile, migration failure, disk full, interrupted download, failed updater, invalid settings, backups, bounded retry, crash-loop prevention, safe restore, diagnostic redaction.

## L. Security and platform integrity
- Renderer sandbox and context isolation; restrictive preload; IPC sender/schema/size validation; navigation and popup policy; trusted-UI CSP; no remote content in privileged renderer; CVE/dependency/license scanning; runtime EOL tracking; signed installer/update; rollback; SBOM; secret scanning; vulnerability reporting.
- Safe Browsing, certificate UX, mixed-content policy, Mark-of-the-Web, and site-isolation claims require explicit decisions.

## M. Updates and releases
- Version/release notes/channel; check, download, verify, stage, install, restart, rollback; interrupted-update recovery; signature verification; anti-downgrade; signing-key protection/rotation; updater errors; supported-runtime enforcement; artifact provenance; SBOM and release evidence.

## N. Developer quality and support
- CI lint/typecheck/unit/integration/e2e/security/dependency/license checks; fixtures; crash reproduction; redacted diagnostics; support guide; known issues; accessibility review; release checklist; ADRs; deprecation/migration policy.

## O. Gated future capabilities
Extensions, account/sync, password manager, autofill, tracking/ad blocking, reader mode, translation, built-in VPN/proxy, mobile app, enterprise policy, cloud profile backup, custom Chromium fork. Each needs a separate specification, threat analysis, license/maintenance plan, cost model, and acceptance tests before inclusion.

## Tracking rule
Use the [Product Specification Index](product-specification-index.md), [Feature Requirements](feature-requirements.md), and [Cross-Feature Acceptance Matrix](cross-feature-acceptance-matrix.md). Catalog presence alone does not mean a feature is approved or implemented.
