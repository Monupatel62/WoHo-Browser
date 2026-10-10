# ADR-0002: Tab and Web Content View Model

Status: Proposed for Release 0 spike. Date: 2026-10-10.

Prototype tabs with Electron WebContentsView, with trusted browser chrome rendered separately from untrusted website content. Avoid deprecated BrowserView. Do not use the webview tag without a compelling reviewed reason.

## Requirements
- Each tab maps to a controlled web contents instance.
- Page title, favicon, and URL are untrusted display data.
- Keep the actual origin visible in trusted browser chrome.
- Apply navigation and popup policy to every tab.
- Clean up listeners and permission state when a tab closes.
- Renderer crashes must not grant additional privileges.

## Spike acceptance
Demonstrate multiple tabs, switching, closing, popup denial, navigation policy, and renderer crash recovery on the selected Electron version. Revisit if the supported API or threat model changes.