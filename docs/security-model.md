# WoHo Browser Security Model

**Status:** Required baseline; not a certification or proof of security.  
**Release rule:** Do not ship publicly until controls are tested on the selected framework version.

## Core rules
- Website content is untrusted and must not receive desktop privileges.
- Disable Node integration for web content; enable context isolation and sandboxing where supported.
- Expose only a narrow, typed preload API.
- Validate all IPC calls, sender frames/origins, payload schemas, sizes, and permitted operations.
- Block unexpected navigation, popups, custom protocols, and permission requests by default.
- Never run shell commands or execute code derived from a website or downloaded file.
- Never silently bypass TLS/certificate errors.
- Do not put secrets in renderer storage, logs, source control, or crash reports.
- Downloads are untrusted. Show source and destination, support cancellation, and avoid auto-running downloaded files.
- Updates must use authenticated metadata and signed/integrity-verified packages.
- Use safe external-link handling and validate protocols before opening external applications.
- Keep dependencies patched and review advisories before releases.

## Permissions
Request access only when a feature needs it. Explain the site and purpose. Support deny and revocation. Test camera, microphone, geolocation, notifications, clipboard, popups, and downloads independently. A website permission grants only the named capability to that origin and never grants unrelated desktop access.

## Untrusted content

- Page text, titles, links, filenames, and other web-controlled values must be treated as untrusted data.
- Keep trusted browser chrome separate from page content; never allow a page to imitate or control trusted prompts.
- Require explicit user intent for downloads, external-app launches, and sensitive local-data actions.
- Render untrusted strings as text, never as active HTML or script.

## Secret handling
Use platform-secure credential storage where practical for any future browser credentials. Redact secrets from logs and errors. Rotate any key accidentally committed to the repository.

## Security testing gates
- IPC authorization and schema tests.
- Origin and navigation policy tests.
- Permission denial and revocation tests.
- Malicious-page, spoofed-chrome, and untrusted-content regression tests.
- Download path and executable handling tests.
- Update signature/integrity failure tests.
- Dependency and secret scanning.
- Review of the current framework's official security guidance.

## Vulnerability reporting
`SECURITY.md` exists, but its reporting path is not yet production-ready: enable GitHub Private Vulnerability Reporting, verify that reports reach a monitored inbox, and define a triage owner and response targets before public release. No security email is configured; do not invent one.


## Electron-specific hardening requirements
The following controls must be checked against the exact selected Electron version and official documentation before implementation:
- Disable Node integration for website content; enable context isolation and sandboxing where supported.
- Use a narrow preload API and validate every IPC call against sender frame/origin, schema, size, and capability.
- Install both permission request and permission check handlers; default-deny unknown origins and permission types.
- Enforce navigation policy with navigation events such as will-navigate and deny or safely mediate new windows through setWindowOpenHandler.
- Deny javascript:, data:, file:, and custom schemes for ordinary web navigation unless a specific reviewed feature requires a narrowly scoped exception.
- Keep remote debugging disabled in production.
- Packaged builds are configured to disable run-as-Node, Node options injection, inspector CLI flags, and extra file-protocol privileges; enable cookie encryption and embedded ASAR integrity validation; and load app code only from ASAR. Verify the fuses in the produced Windows installer before release. Cookie encryption is a one-way storage transition; disabling it after release can make the cookie store unusable.
- Never silently bypass certificate errors. External protocol launches must be allowlisted and user initiated.
- Render page titles, favicons, and URL text safely; do not allow webpage content to imitate trusted chrome.
- Update policy must address rollback/downgrade, signing-key separation, key rotation, and emergency stop.

## Security patch target
Proposed target for approval: assess a confirmed critical Electron/Chromium issue affecting a shipped build within 24 hours and aim to publish a tested mitigation within 72 hours where feasible. This is not a current SLA until ownership and release capability are approved. See docs/incident-response-and-cve-policy.md.

## Release gate
A security checklist is not a certification. Before production release, attach test evidence for navigation, IPC, permission denial/revocation, downloads, update integrity, and renderer isolation to the release record.
