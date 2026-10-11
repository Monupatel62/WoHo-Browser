> **Archived reference only (2026-10-11):** WoHo Browser has no AI agent feature and no AI agent is planned. This document does not authorize implementation. Do not add agent runtime, AI dependencies, tool execution, or AI UI to the browser.

# WoHo Browser Agent Security Design

Status: Future design. Release 4 is blocked until reviewed and tested.

## Threat
An agent may read hostile webpage content while a session contains authenticated data. If the same agent can access private data and send network requests, prompt injection may turn it into a data-exfiltration path.

## Required controls
- Separate agent profile/session from the user's normal logged-in browser profile.
- Issue short-lived, least-privilege capabilities for a specific task and origin.
- Show a plan, domains, data to be sent, and consequences before execution.
- Require confirmation for uploads, form submissions, messages, purchases, account changes, executable downloads, and destructive actions.
- Enforce policy in trusted browser code, never model instructions alone.
- Provide stop/cancel, bounded steps/time/network/output, and a local action log with minimal sensitive content.
- Prevent webpage content from spoofing trusted confirmation UI.
- Do not expose shell, cookies, passwords, profile databases, or unrestricted filesystem tools.

## Abuse tests
Test prompt injection, cross-page contamination, spoofed confirmations, disallowed origins/actions, cancellation, malicious tool output, and proof that the ordinary user profile is inaccessible. No autonomous-action feature is production-ready without independent security review and passing regression tests.