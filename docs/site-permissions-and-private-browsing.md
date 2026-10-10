# Site Permissions, Privacy Controls, and Private Browsing

**Status:** Partially implemented. The current prototype prompts through a native trusted dialog for the explicit allowlist of media, geolocation, notifications, and clipboard-read. Decisions are held in memory for the current app session. The Site permissions panel lists current normal-profile decisions, can block a previously allowed capability for the rest of the session, or forget a decision so a future request prompts again. Unsupported permissions remain denied. Private tabs use isolated non-persistent sessions.

## Permission model
Permissions are scoped by origin, capability, profile/session, and decision source. Capabilities may include camera, microphone, geolocation, notifications, clipboard, screen capture, popups, autoplay, and device APIs only where supported by the engine. Do not show unsupported controls as if they work.

## Defaults and prompts
Unknown/unhandled permissions default to deny. The prototype's native dialog identifies the requesting origin and capability, offers Allow for this session or Block, and remembers that decision only in memory until app exit or the user clears site data. Only media, geolocation, notifications, and clipboard-read are allowlisted; other capabilities are denied. A site cannot create its own fake prompt and gain permission. The Site permissions panel supports reviewing the in-memory decisions, blocking an allowed permission for the remainder of the session, and forgetting a decision. Blocking updates the main-process decision immediately; forgetting removes the saved decision and allows a fresh trusted prompt on a later request. These controls are session-only and are not a persistent site settings database.

## Site controls
A trusted active-site panel may expose origin identity, permissions, site data clearing, popups, notifications, camera/microphone/location, and connection state where supported. Clearing local site data does not imply deletion of remote data or logout from every service.

## Private browsing
Private tabs are implemented as separate non-persistent Electron sessions with unique partition names that do not use the `persist:` prefix. Cookies, local storage, cache, and permission decisions are isolated from the normal browser session and from other private tabs. Private visits are excluded from the normal history store; private downloads are not recorded in the normal download list. A downloaded file explicitly saved by the user remains on disk after the tab closes. When a private tab closes, the app cancels its active private downloads and requests clearing that session's storage, cache, and authentication cache. Permission decisions and the private session reference are then discarded. This cleanup is best-effort; it is not a forensic-erasure guarantee. This is not anonymity: websites, network operators, employers, and remote services may still observe activity. Automated tests cover the history-persistence policy, but full Electron/Windows storage cleanup and runtime behavior still require manual verification.

## Clear data and prompt fatigue
The current clear-site-data action clears cookies, site storage, cache, and in-memory permission decisions. Provide categories/time ranges with exact descriptions of inclusion/exclusion in future settings. Do not promise forensic erasure. The prototype remembers allow/block decisions per origin and capability for the session to reduce repeated prompts. A denial must not cause an interruption loop. Native prompts remain above page content.

## Open decisions
Password manager, autofill, sync, third-party cookie policy, tracking protection, DNS-over-HTTPS, and permission expiry need separate review.

## Tests
Automated policy tests cover origin allowlisting and private history exclusion. Remaining tests include actual Electron origin/profile isolation, denial, revocation, repeated prompt abuse, malicious iframe, spoofed origin, restart, deletion completeness, and keyboard/screen-reader prompts.
