# Window, Browser Chrome, and Navigation Specification

**Status:** Partially implemented. Back/forward/reload/stop, tab controls, address navigation, and find-in-page with next/previous, match count, no-results state, close/Escape, and Ctrl+F are present in the prototype. Remaining items below are planned.

## Window lifecycle
Launch should produce a usable window or a plain-language startup error. First launch must not require an account or AI setup. Define close behavior for active downloads, unsaved notes, and multiple windows. Shutdown must flush essential writes safely. If profile loading fails, preserve a recoverable backup where possible and never silently overwrite user data. Define minimum window size, display scaling, multi-monitor behavior, and disconnected-display recovery.

## Trusted chrome
Trusted chrome includes tab strip, address/search bar, navigation controls, site identity/permission controls, page area, optional side panel, downloads surface, menus, and notifications. Website content must not control trusted browser chrome or imitate browser-controlled security prompts.

## Navigation controls
Back/forward act on the active tab only. Reload reloads current navigation; Stop cancels in-progress navigation where supported; Home uses a documented setting. Loading indicators must handle redirects, cancellation, failures, and crashes. Disabled controls expose accessible disabled state.

## URL and origin
Display a normalized destination and let users inspect the host. Define safe display for internationalized domains and suspicious mixed-script names. Do not propagate embedded credentials into UI, history, logs, AI context, or copied links. Unsupported schemes must produce safe errors and must never open local files or privileged app pages merely because a page requested them.

## Navigation policy
Re-evaluate main-frame navigation, subframe navigation, and redirects separately. Main-frame and frame-navigation handlers allow HTTP(S) destinations plus narrowly scoped inherited-origin `about:blank`, `about:srcdoc`, and web-origin `blob:` documents; `file:`, `data:`, `javascript:`, and custom schemes are blocked. Popups default to denied or a controlled handler. New-window requests, downloads, external protocols, and internal app routes each have separate policies. External apps launch only after user intent and a clear target disclosure. Prevent loops and rapid-navigation abuse.

## TLS and network errors
Certificate errors must never be silently bypassed. Use browser-controlled error UI identifying the host and safe next steps. MVP should not offer a bypass unless a reviewed threat model explicitly approves a narrow exception. Distinguish offline, DNS, timeout, reset, policy-blocked, and unknown failures where reliable signals exist.

## Context menu and page actions
Implemented: right-clicking a valid HTTP(S) link offers “Open Link in New Tab” and “Copy Link Address”. New tabs inherit the source tab's private mode. Unsafe schemes, credential-bearing URLs, and overlong link URLs are not offered. Remaining candidates: Back, Forward, Reload, Save/Download link, Copy selected text, image actions, and developer inspection in development builds only. Items must be enabled only when valid for the selected target. Render labels as text, not executable markup.

## Find, zoom, print, fullscreen
Find-in-page needs next/previous, count if available, close/Escape, and no-results state. Zoom scope (per-tab or per-site) is an open decision. Fullscreen must be obvious and recoverable with Escape where supported. Print/PDF must disclose destination and never silently upload content.

## Tests
Cover invalid URLs, redirects, blocked schemes, IDN display, popups, external protocol prompts, TLS failures, offline/DNS/timeouts, renderer crash, rapid navigation, close during download, display scaling, fullscreen exit, and keyboard-only use.
