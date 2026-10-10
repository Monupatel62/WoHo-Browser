# ADR-0001: Browser Engine and Initial Platform

Status: Accepted for prototype only; production commitment pending spike results. Date: 2026-10-10.

## Context and decision
A solo developer needs a maintainable route to a Windows browser with an AI side panel. A custom Chromium fork has major build, rebase, security-patching, signing, and distribution costs. Use Electron + TypeScript + React for the Release 0 prototype. Describe the product accurately as an Electron-based browser, not a full Chrome replacement. This decision authorizes a prototype, not a claim of complete Chrome compatibility.

## Alternatives
- Electron: practical for a TypeScript-first prototype; browser-specific limits remain.
- CEF: reconsider only if a validated requirement cannot be met with Electron and C++/Chromium maintenance is feasible.
- Custom Chromium: rejected for the initial solo-developed product due to ongoing maintenance and security-update burden.

## Required spike
Test HTTPS navigation, tab views, popup policy, Google/Microsoft sign-in, extension loading, 20 representative sites, downloads, installer packaging, and a signed update round trip. Test Widevine only if target-user research establishes a real need.

## Switch triggers and consequences
Reopen this decision if validated demand requires extensions, DRM, or another capability that cannot be delivered acceptably by Electron. Full Chrome parity, DRM, complete extension compatibility, Google sync, and custom-engine maintenance are not promised unless separately validated.