# WoHo Browser — Web Application Plan

**Status:** Planned; no deployed web companion is claimed  
**Product type:** Responsive website/PWA companion, not a full browser engine  
**AI scope:** No AI features or integrations.

## 1. Purpose and limitation

The Web surface provides useful WoHo Browser information and safe data-portability tools from any modern browser. It does not claim to browse arbitrary sites inside its own UI as if it were a native browser. A website cannot control the host browser's tabs/address bar or receive native browser privileges. Do not implement an iframe/proxy and call it a full browser.

## 2. MVP pages

- **Home:** clear product purpose, supported platforms, current release status, and prominent download links.
- **Downloads:** Windows installer and Android release links only when published; show supported OS/architecture, version, file size, SHA-256 checksum, signature/provenance status, and known limitations.
- **Documentation:** user guide, feature/support matrix, privacy policy, security policy, release notes, and known issues.
- **Support and security:** issue/reporting links and monitored security contact; do not promise a response channel until an owner verifies it.
- **Data tools (optional MVP):** local-only bookmark import/export helper with a strict schema/size limit and explicit download action. Never send imported data to a server.
- **PWA:** installability only if it provides real offline value; cache only static public assets and never cache private data or downloaded browser profiles.

## 3. Functional requirements

- Responsive mobile, tablet, and desktop layout.
- Accessible semantic HTML, keyboard navigation, visible focus, reduced-motion support, sufficient contrast, and screen-reader labels.
- Links to releases use canonical HTTPS destinations and clear version information.
- External links are identified and do not silently open dangerous protocols.
- Import validates file type, size, encoding, schema, URL format, and record count; rejects malformed/oversized input with actionable errors.
- Export uses a user-initiated local download; no automatic upload.
- The UI clearly distinguishes verified release artifacts from planned or unavailable builds.
- Show product status truthfully; no unsupported security, speed, privacy, or platform-parity claims.

## 4. Security requirements

- HTTPS-only production deployment with a reviewed CSP and appropriate security headers.
- Strict input validation and output encoding; imported bookmark titles/URLs are untrusted text, never HTML.
- Avoid third-party analytics and external scripts by default. Any later telemetry requires explicit review and a documented privacy policy.
- No credentials, browsing history, cookies, passwords, private session data, or browser profile files uploaded or stored server-side.
- No arbitrary URL fetch/proxy endpoint, open redirect, unsafe HTML rendering, or remote code execution.
- If a backend is ever proposed, document data flows, authentication, authorization, rate limiting, abuse handling, retention/deletion, incident response, and costs before implementation.
- No secrets in client bundles or repository. Deployment secrets must use the hosting provider's protected configuration.

## 5. Architecture direction

Use a conventional static or mostly static web app with a minimal attack surface. The specific framework and hosting provider remain open until deployment, accessibility, security-header, and maintenance requirements are compared. The web companion must not share privileged desktop IPC code or assume access to local desktop profile paths.

## 6. Release plan

### Web 0 — Static portal
- Publish accurate product status and supported-platform matrix.
- Provide documentation, privacy/security policy, release notes, and known issues.
- Link only to artifacts that have passed the release gates.

### Web 1 — Safe data portability
- Add client-side bookmark import/export only after tests cover invalid schemas, huge files, hostile strings, malformed URLs, and privacy guarantees.
- Verify imported text is rendered as text, not HTML.
- Verify browser network tools show no import-data upload.

### Web 2 — PWA (optional)
- Add a service worker only with a documented cache allowlist, update strategy, stale-content behavior, and clear-cache controls.
- Cache static documentation/assets only; never cache profiles or private data.

## 7. Acceptance checks

- Build, lint, typecheck, unit tests, and dependency/secret scans pass.
- Accessibility checks and manual keyboard/screen-reader review pass.
- Security headers and CSP are verified against production responses.
- Mobile layouts and common browsers are tested.
- Download URLs, checksums, and artifact version metadata match the release record.
- Import/export tests prove local-only processing and correct round-trip behavior.
- Broken/outdated releases are not silently presented as supported.
- No full-browser, cloud-sync, or privacy claim is made without implementation and evidence.

## 8. Deferred

Remote browser sessions, web-based proxying, accounts, cloud sync, remote profile management, password storage, and browsing-history analytics are deferred and require a separate product decision plus security/privacy review.
