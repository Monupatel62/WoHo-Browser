# Browser Extension Strategy

Status: Not committed for MVP; validate user demand and framework support first.

Do not promise full Chrome Web Store or Chrome extension compatibility until tested. Electron extension support may differ in APIs, service workers, permissions, install/update behavior, and lifecycle.

## MVP
Do not support arbitrary extension installation in the first vertical slice. Keep built-in privacy features separate. Never install extensions silently or allow an extension to bypass navigation, download, permission, or AI policy.

## Evaluation
Test representative extensions, including an ad blocker if target users need it. Record API coverage, limitations, update mechanism, permission UI, crash behavior, and security implications. Check store terms before distributing extension binaries.

## Future requirements
Explicit install/permission review, integrity-checked updates, identity/removal controls, isolated storage, least-privilege host permissions, and tests for content scripts and background behavior.

Reopen the engine ADR only if validated users require compatibility the selected framework cannot provide acceptably.