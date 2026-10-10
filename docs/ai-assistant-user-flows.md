# AI Assistant User Journeys and Safeguards

**Status:** Planned. AI is optional and separate from core navigation.

## Entry points
The assistant opens/closes from trusted chrome without changing the page. Candidate user-triggered actions: summarize page, explain selected text, ask about page, extract key points, compare selected pages, and create an approved note. No unimplemented control should appear active.

## Context preview
Before remote submission, show what leaves the device: selected text, page title/URL, visible article text, user prompt, and any explicitly selected tabs. Send the minimum necessary context. Never include cookies, authorization headers, passwords, hidden DOM data, form values, or unrelated tabs. Private mode has a separate policy and must not reuse normal AI history.

## Provider and consent
Distinguish local inference from remote requests. Show provider/model, data-processing/retention disclosure, cost/usage limits, and relevant settings. No silent fallback that changes privacy or price. Store credentials in an appropriate OS secret store where available; never expose them to page renderers, logs, diagnostics, or prompts. AI can be disabled without breaking browsing.

## Response UX
Separate generated interpretation from source content. Show excerpts/headings/references where feasible and say when precise citations are unavailable. Provide copy, regenerate, stop, retry, and clear conversation where supported. Render response as inert text or limited safe formatting; never execute returned HTML or scripts.

## Errors and limits
Handle cancellation, timeout, bounded input/output, rate limits, provider outage, invalid credentials, quota, network loss, malformed output, and oversized context. Do not duplicate paid requests on retry without user intent. If provider cancellation cannot stop remote processing, disclose that limitation.

## Prompt injection and tools
Treat pages, PDFs, images, and model output as untrusted data. Page instructions cannot override policy or trigger secret disclosure. MVP assistant is read-only unless separately approved. Navigation, downloads, file access, clipboard writes, form submission, and external-app launch need separate permission and confirmation. AI cannot approve its own permissions.

## Storage and quality
Define persistence, location, retention, deletion/export, private mode, and limits of provider-side deletion. Prompts/page text are excluded from telemetry by default. Evaluate source faithfulness, prompt injection, hallucinated citations, privacy leakage, cancellation, and accessibility across each provider/model.

## Tests
Context preview accuracy, remote consent, provider changes, private mode, secret redaction, prompt injection, malformed output, cancellation races, outages, quotas, oversized pages, citation mismatch, deletion/export.
