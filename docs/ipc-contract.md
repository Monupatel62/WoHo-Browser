# Browser IPC Contract

Status: Proposed; channel names remain illustrative until implementation.

## Rules
- Register named channels only; no generic invoke-to-module bridge.
- Validate schema, size, sender frame, origin, and operation-specific authorization.
- Reject unknown fields and unexpected types.
- Return bounded structured errors without secrets or unnecessary local paths.
- Use timeout/cancellation for long-running work.
- Never trust a renderer-supplied URL, origin, tab ID, path, or capability without verification.
- Web content must not access browser-chrome IPC.

## Proposed channel groups
| Group | Operation | Checks |
|---|---|---|
| App | Get version | Trusted chrome sender |
| Navigation | Navigate URL | Scheme and navigation policy |
| Tabs | Create/close/select | Valid tab ID and lifecycle |
| Bookmarks | Add/update/delete | Schema and local data policy |
| Downloads | Choose/cancel/open | User gesture, path policy, completion state |
| Permissions | Request/revoke | Origin, permission type, user choice |
| AI | Ask about selected page | User gesture, consent, size/cost limits |
| Settings | Update setting | Allowlisted key and validated value |

Never allow arbitrary shell/filesystem operations, raw Electron objects, or model-triggered IPC. Test valid/malformed payloads, wrong sender/origin, oversize input, denial, timeout, and cancellation.