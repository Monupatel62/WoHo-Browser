# WoHo Browser Threat Model

**Status:** Initial analysis; update after architecture and implementation decisions.

## Assets to protect
- User browsing history, bookmarks, sessions, and downloaded files.
- Provider credentials and account sessions.
- Local files and operating-system privileges.
- Microphone, camera, location, clipboard, and notifications.
- AI prompts, page content, and generated notes.
- Update signing keys and release artifacts.

## Trust boundaries
- Malicious or compromised website to renderer.
- Renderer to privileged main process via IPC.
- Website/page content to AI model and back.
- Browser to local filesystem and external applications.
- Browser updater to installed application.
- Third-party dependencies to shipped application.

## Threat scenarios and mitigations

| Threat | Possible impact | Required mitigation / test |
|---|---|---|
| Malicious page exploits renderer | Data theft or compromise | Sandbox, isolation, patch cadence, security testing |
| Renderer abuses IPC | Local file or process access | Narrow API, sender validation, schema checks, deny-by-default tests |
| Prompt injection in page | AI leaks data or performs unintended action | Treat page as untrusted, separate policy from content, require confirmation |
| Malicious download | Malware or unwanted execution | Source/destination display, no auto-run, cancellation and warnings |
| Fake or compromised update | Application takeover | Signed updates, integrity verification, secure release credentials |
| Credential leakage in logs | Account or API abuse | Redaction, secret scanning, minimal logging |
| Permission abuse | Privacy breach | Per-origin permission broker, deny defaults, revocation tests |
| Excessive AI request | Unexpected cost or data exposure | User initiation, context preview, limits, cancellation |
| Data loss after crash/update | Loss of user state | Versioned storage, atomic writes, recovery tests |
| Supply-chain compromise | Vulnerable or malicious release | Dependency review, lockfile, CI scanning, reproducible release checks |

## Abuse cases to test
- A page asks the AI to ignore its rules and read local files.
- A page attempts to open thousands of popups or navigate to a custom protocol.
- A forged IPC payload claims to originate from a trusted frame.
- A download uses a misleading filename or changes destination.
- An update signature is invalid or the download is truncated.
- The AI provider returns oversized content, malformed data, or a command-like response.
- A permission is denied, then requested repeatedly.
- The application closes while storage is being written.

## Residual risks
No checklist eliminates all browser vulnerabilities. Chromium/Electron updates, incident response, secure distribution, and prompt-injection defenses require ongoing maintenance. Record accepted risks explicitly before each release.
