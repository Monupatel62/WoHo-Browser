# WoHo Browser AI Broker Specification

Status: Design only; implementation is not claimed.

## Purpose
Separate browser UI, page context, AI providers, and future agent runtime. Normal browsing must work when AI is unavailable.

## Initial non-goals
No autonomous purchases, messages, form submissions, account changes, or downloads. No shell execution, unrestricted filesystem access, silent page uploads, cookies, passwords, or session-token access.

## Request and context
Requests use versioned action types, request IDs, explicit context references, bounded input/output, timeout, and cancellation. Collect only user-selected page or text context. Exclude cookies, credentials, hidden form fields, unrelated tabs, and history. Preview provider and context before remote submission.

## Provider and output
Use a provider-neutral interface. Apply timeouts, bounded retries, cancellation, rate/cost limits, and response-size limits. Treat local model endpoints as a network boundary too. Render output as escaped text or restricted Markdown; disable active HTML and remote images by default. Validate links and require user action. Never execute generated code or commands.

## Authorization and tests
The broker returns suggestions and drafts only. Future tool calls require a separate policy engine and capabilities enforced by trusted browser code; model text cannot grant permissions. Test provider timeout, malformed/oversized output, cancellation, key redaction, unsafe links, remote-image blocking, prompt injection, compare-page isolation, and offline operation.