# WoHo Browser Threat Model

**Status:** Initial conventional-browser analysis; update after architecture and implementation decisions. AI features are out of scope and are not planned.

## Assets to protect
- User browsing history, bookmarks, sessions, settings, and downloaded files.
- Local files and operating-system privileges.
- Microphone, camera, location, clipboard, and notifications.
- Website authentication sessions and credentials handled by websites.
- Update signing keys and release artifacts.
- Integrity of trusted browser chrome and privileged IPC.

## Trust boundaries
- Malicious or compromised website to its renderer.
- Renderer to privileged main process via IPC.
- Browser chrome to website views and their untrusted titles/URLs.
- Browser to local filesystem and external applications.
- Browser updater to installed application.
- Third-party dependencies to shipped application.
- Normal profile to private-session storage.

## Threat scenarios and mitigations

| Threat | Possible impact | Required mitigation / test |
|---|---|---|
| Malicious page exploits renderer | Data theft or compromise | Sandbox, isolation, patch cadence, security testing |
| Renderer abuses IPC | Local file or process access | Narrow API, sender validation, schema checks, deny-by-default tests |
| Malicious download | Malware or unwanted execution | Source/destination display, no auto-run, cancellation and warnings |
| Fake or compromised update | Application takeover | Signed updates, integrity verification, secure release credentials |
| Credential leakage in logs | Account abuse | Redaction, secret scanning, minimal logging |
| Permission abuse | Privacy breach | Per-origin permission broker, deny defaults, revocation tests |
| Data loss after crash/update | Loss of user state | Versioned storage, atomic writes, recovery tests |
| Supply-chain compromise | Vulnerable or malicious release | Dependency review, lockfile, CI scanning, reproducible release checks |
| Private data crosses into normal profile | Privacy breach | Separate non-persistent sessions, explicit isolation tests |
| Chrome UI spoofing | User approves wrong action or trusts false origin | Keep browser chrome separate; never trust page titles/favicons as identity |
| Dangerous scheme or redirect | Script execution or local/internal resource access | Scheme allowlist and navigation tests |
| Update downgrade or key compromise | Installation of vulnerable/malicious code | Anti-downgrade, signing-key separation, rotation and rollback tests |
| Remote debugging left enabled | Local or remote control of browser | Disable in production and verify packaged configuration |

## Abuse cases to test
- A page attempts to open thousands of popups or navigate to a custom protocol.
- A forged IPC payload claims to originate from a trusted frame.
- A title or favicon tries to imitate trusted browser controls.
- A download uses a misleading filename or changes destination.
- An update signature is invalid or the download is truncated.
- A permission is denied, then requested repeatedly.
- A private tab is closed and its data is checked against the normal profile.
- The application closes while storage is being written.
- A malicious page attempts to navigate the trusted chrome renderer away from its bundled UI.

## Residual risks
No checklist eliminates all browser vulnerabilities. Chromium/Electron updates, incident response, secure distribution, and dependency maintenance require ongoing work. Record accepted risks explicitly before each release.

## Risk ownership and patch response
Before production, assign an owner and severity/likelihood to each high-risk mitigation. Proposed critical-issue target: assess within 24 hours and aim for a tested mitigation within 72 hours where feasible; this is not a committed SLA until staffing is approved. Maintain a data-flow diagram and record residual risks in each release review.
