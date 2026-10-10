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


## Additional browser-specific threats
| Threat | Impact | Required mitigation/test |
|---|---|---|
| IDN homograph or long-URL spoofing | User mistakes a malicious site for a trusted origin | Keep trusted origin visible; test IDN display and long URLs |
| Title/favicon injection into browser chrome | Page spoofs trusted controls | Treat title/favicon as untrusted; fixed trusted chrome layout |
| javascript:, data:, file:, or internal-scheme navigation | Script execution or local/internal resource access | Scheme allowlist and navigation tests |
| Local profile theft by same-user malware | History/session exposure | Minimize stored secrets; explain OS secure-storage limits; do not promise protection from same-user malware |
| Remote image/link in AI output | Exfiltration or unexpected navigation | Disable remote images and active HTML; validate links |
| Cross-tab prompt injection | One page contaminates another page's analysis | Label sources separately; isolate per-request context and test hostile cross-page inputs |
| Localhost model endpoint abuse | Website reaches local AI service or induces requests | Treat loopback as a network boundary; test DNS rebinding/CORS and restrict access |
| Update downgrade or key compromise | Installation of vulnerable/malicious code | Anti-downgrade, signing-key separation, rotation and rollback tests |
| Remote debugging left enabled | Local or remote control of browser | Disable in production and verify packaged configuration |

## Risk ownership and patch response
Before production, assign an owner and severity/likelihood to each high-risk mitigation. Proposed critical-issue target: assess within 24 hours and aim for a tested mitigation within 72 hours where feasible; this is not a committed SLA until staffing is approved. Maintain a data-flow diagram and record residual risks in each release review.

## Highest-risk future feature
An agent that reads hostile pages while using an authenticated profile and retaining an outbound channel creates a data-exfiltration risk. Release 4 is blocked until docs/agent-security-design.md is reviewed, the agent uses a separate profile, and the abuse tests pass.
