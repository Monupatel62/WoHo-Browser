# WoHo Browser Architecture

**Status:** Proposed; validate against the first working prototype.  
**Scope:** Initial Windows desktop browser with optional AI assistance.

## 1. Architecture goals
- Keep ordinary browsing functional when AI providers are unavailable.
- Separate trusted desktop privileges from untrusted website content.
- Make navigation, sessions, downloads, storage, and AI independently testable.
- Avoid building a custom Chromium fork until requirements justify its maintenance cost.

## 2. Proposed technology decision
Evaluate Electron + TypeScript + React for the first prototype. Electron bundles Chromium-based rendering but is not the same as maintaining a standalone Chromium browser fork. Before final selection, compare Electron, CEF, and custom Chromium against packaging, extension compatibility, update burden, security controls, licensing, and available engineering capacity.

## 3. Logical components
- **Desktop shell:** application lifecycle, windows, menus, platform integration, update orchestration.
- **Browser UI:** tabs, address/search bar, navigation controls, settings, history, bookmarks, downloads.
- **Tab/session manager:** creates and destroys tabs, manages session partitions and restores safe state.
- **Navigation policy:** validates URL schemes, handles redirects, controls popups and external protocol handoffs.
- **Permission broker:** mediates camera, microphone, location, notifications, clipboard and other sensitive permissions.
- **Download manager:** records origin, destination, progress, cancellation, completion, and errors.
- **Local data service:** versioned settings, bookmarks, history, and session metadata.
- **AI broker:** collects only user-approved context, selects provider, applies limits, and returns untrusted text to the UI.
- **Update component:** verifies signed update metadata/packages and provides failure recovery.
- **Observability:** minimal diagnostics only under a documented, consent-based policy.

## 4. Trust boundaries
1. Website renderer: untrusted.
2. Browser chrome UI: trusted UI, but must not directly expose privileged system APIs to page scripts.
3. Main process: privileged; small API surface and strict input validation required.
4. AI provider: external service; page content and responses are untrusted.
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
Use versioned schemas and migrations. Store only the data required for the selected features. Define retention, export, and deletion behavior before release. Do not sync history or page content by default. Protect credentials with platform-appropriate secure storage where possible; never hard-code provider keys.

## 7. AI request flow
1. User explicitly starts an AI action.
2. Show the context and destination/provider when content leaves the device.
3. Remove unnecessary data and enforce size, time, and cost limits.
4. Send the request through the AI broker.
5. Treat the model response as untrusted display text.
6. Require separate permission checks and user confirmation for any action; never execute model-generated code or commands.

## 8. First vertical slice
The first prototype must launch, open an HTTPS URL, navigate back/forward, display load failures safely, and close cleanly. Add tabs only after the security boundaries and basic lifecycle are tested.

## 9. Architecture decision records
For each major choice record: context, requirements, options considered, decision, security impact, trade-offs, and revisit conditions. Keep framework and engine selection marked OPEN until a prototype and comparison are reviewed.
