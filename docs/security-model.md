# WoHo Browser Security Model

**Status:** Required baseline; not a certification or proof of security.  
**Release rule:** Do not ship publicly until controls are tested on the selected framework version.

## Core rules
- Website content is untrusted and must not receive desktop privileges.
- Disable Node integration for web content; enable context isolation and sandboxing where supported.
- Expose only a narrow, typed preload API.
- Validate all IPC calls, sender frames/origins, payload schemas, sizes, and permitted operations.
- Block unexpected navigation, popups, custom protocols, and permission requests by default.
- Never run shell commands or execute code derived from a website, AI output, prompt, or downloaded file.
- Never silently bypass TLS/certificate errors.
- Do not put secrets in renderer storage, logs, source control, or crash reports.
- Downloads are untrusted. Show source and destination, support cancellation, and avoid auto-running downloaded files.
- Updates must use authenticated metadata and signed/integrity-verified packages.
- Use safe external-link handling and validate protocols before opening external applications.
- Keep dependencies patched and review advisories before releases.

## Permissions
Request access only when a feature needs it. Explain the site and purpose. Support deny and revocation. Test camera, microphone, geolocation, notifications, clipboard, popups, and downloads independently. A website permission does not grant the AI agent permission to act on the user's behalf.

## AI safety
- Page text, DOM content, links, and model responses are untrusted input.
- Prompt injection must not override application policy or permission checks.
- The AI broker must not have general shell or filesystem access.
- Any write, upload, form submission, purchase, message, account change, or executable download requires an explicit user review and confirmation.
- Provide stop/cancel controls, bounded steps, timeouts, and an action log.
- Remote AI requests must disclose what content is sent. Never send full page content silently.

## Secret handling
Use platform-secure credential storage where practical. If users provide API keys, explain where they are stored and how to delete them. Redact secrets from logs and errors. Rotate any key accidentally committed to the repository.

## Security testing gates
- IPC authorization and schema tests.
- Origin and navigation policy tests.
- Permission denial and revocation tests.
- Malicious-page and prompt-injection regression tests.
- Download path and executable handling tests.
- Update signature/integrity failure tests.
- Dependency and secret scanning.
- Review of the current framework's official security guidance.

## Vulnerability reporting
Before public release, add a SECURITY.md with a monitored reporting channel, supported release policy, expected response process, and instructions not to publish exploitable details before coordination. Do not invent a security email address; configure a real contact first.
