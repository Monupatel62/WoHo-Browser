# WoHo Browser Architecture

**Status:** Proposed; validate against the first working prototype. This is an architecture proposal, not implemented behavior.  
**Scope:** Conventional Windows desktop browser. AI assistant, agent, API/service, model runtime, and AI-related UI or dependencies are out of scope.

## 1. Architecture goals
- Keep ordinary browsing functional without an account or cloud service.
- Separate trusted desktop privileges from untrusted website content.
- Make navigation, sessions, downloads, storage, and permissions independently testable.
- Avoid building a custom Chromium fork until requirements justify its maintenance cost.

## 2. Technology decision status
Electron + TypeScript + React is selected for the Release 0 feasibility prototype only, as recorded in ADR-0001. Electron bundles Chromium-based rendering but is not the same as maintaining a standalone Chromium browser fork. This is not a production commitment: the R0 spike must verify the required security controls, packaging, licensing, navigation behavior, and maintenance feasibility. Reopen alternatives only if the spike identifies a material blocker.

## 3. Logical components
- **Desktop shell:** application lifecycle, windows, menus, platform integration, update orchestration.
- **Browser UI:** tabs, address/search bar, navigation controls, settings, history, bookmarks, downloads.
- **Tab/session manager:** creates and destroys tabs, manages session partitions and restores safe state.
- **Navigation policy:** validates URL schemes, handles redirects, controls popups and external protocol handoffs.
- **Permission broker:** mediates camera, microphone, location, notifications, clipboard and other sensitive permissions.
- **Download manager:** records origin, destination, progress, cancellation, completion, and errors.
- **Local data service:** versioned settings, bookmarks, history, and session metadata.
- **Update component:** verifies signed update metadata/packages and provides failure recovery.
- **Observability:** minimal diagnostics only under a documented, consent-based policy.

## 4. Trust boundaries
1. Website renderer: untrusted.
2. Browser chrome UI: trusted UI, but must not directly expose privileged system APIs to page scripts.
3. Main process: privileged; small API surface and strict input validation required.
5. Local filesystem: sensitive; all access must be user-initiated and narrowly scoped.
6. Update channel: highly privileged; signing and integrity verification required.

## 5. IPC rules
- Define typed schemas for every message.
- Validate payload type, length, sender frame, origin, and allowed operation.
- Do not expose arbitrary filesystem, shell, process, or network functions.
- Use request IDs, timeouts, cancellation, and bounded response sizes.
- Return safe error codes; do not leak secrets or local paths unnecessarily.
- Test rejection behavior as thoroughly as success behavior.

## 6. Storage
Use versioned schemas and migrations. Store only the data required for the selected features. Define retention, export, and deletion behavior before release. Do not sync history or page content by default. Never hard-code credentials or secrets.

## 7. Out-of-scope integrations

WoHo Browser does not include AI features, AI providers, an AI broker, model runtime, or AI data flow. Do not add these components or dependencies.

## 8. First vertical slice
The first prototype must launch, open an HTTPS URL, navigate back/forward, display load failures safely, and close cleanly. Add tabs only after the security boundaries and basic lifecycle are tested.

## 9. Architecture decision records
For each major choice record: context, requirements, options considered, decision, security impact, trade-offs, and revisit conditions. Keep the **production** framework/engine commitment open until the Release 0 prototype and comparison are reviewed. ADR-0001 records the accepted prototype choice.


## 10. Concrete process and view model (review update)
The Release 0 spike will evaluate and prototype Electron's supported WebContentsView API for website tabs, with browser chrome rendered separately. This is a prototype implementation direction, not proof of complete browser parity or a final production commitment. Do not use deprecated BrowserView or the webview tag without a reviewed exception.

### Process boundaries
- **Main process:** lifecycle, trusted window creation, navigation policy, permission mediation, downloads, updates, and narrowly scoped IPC handlers.
- **Chrome renderer:** browser controls and settings only. It must not host arbitrary websites.
- **Website web contents:** untrusted origin-specific page content with Node integration disabled, context isolation enabled, and sandboxing enabled. Any unsupported control requires a documented, reviewed exception and blocks release until the residual risk is addressed.
- **Utility process:** only for work that needs process isolation; a utility process alone is not an OS sandbox.

### Internal pages
Prefer local, bundled UI resources for settings/history rather than exposing a broad custom protocol. If a custom scheme is necessary, register it as standard/secure where supported, restrict its handler to known bundled assets, reject traversal and arbitrary paths, and never let website origins access privileged internal routes. Internal pages must use a separate trust policy and must not accept arbitrary HTML from page content.

### Storage decision
Storage engine remains open under ADR-0004. Prototype settings with versioned storage and evaluate SQLite for queryable records. Any native SQLite module must have documented Electron ABI rebuild, packaging/ASAR, migration, and corruption-recovery handling.

### IPC catalog
Use the channel groups in docs/ipc-contract.md. Every channel needs sender/origin validation, a typed schema, size limits, authorization, structured errors, timeout/cancellation where relevant, and negative tests. No generic IPC bridge.

### Release 0 implementation order
1. App lifecycle and trusted chrome.
2. WebContentsView tab prototype.
3. URL/navigation and popup policy.
4. Permission handlers and safe external protocols.
5. Basic tests and packaging.
6. Only then add history/bookmarks/download persistence.

