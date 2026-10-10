# Site Permissions, Privacy Controls, and Private Browsing

**Status:** Partially implemented. The current prototype prompts through a native trusted dialog for the explicit allowlist of media, geolocation, notifications, and clipboard-read. Decisions are held in memory for the current app session. Unsupported permissions remain denied; private browsing and a user-facing permission manager remain planned.

## Permission model
Permissions are scoped by origin, capability, profile/session, and decision source. Capabilities may include camera, microphone, geolocation, notifications, clipboard, screen capture, popups, autoplay, and device APIs only where supported by the engine. Do not show unsupported controls as if they work.

## Defaults and prompts
Unknown/unhandled permissions default to deny. The prototype's native dialog identifies the requesting origin and capability, offers Allow for this session or Block, and remembers that decision only in memory until app exit or the user clears site data. Only media, geolocation, notifications, and clipboard-read are allowlisted; other capabilities are denied. A site cannot create its own fake prompt and gain permission. A full review/revoke site settings page is not implemented.

## Site controls
A trusted active-site panel may expose origin identity, permissions, site data clearing, popups, notifications, camera/microphone/location, and connection state where supported. Clearing local site data does not imply deletion of remote data or logout from every service.

## Private browsing
Private mode uses a separate non-persistent session partition for cookies, local storage, cache, history, suggestions, permissions, and AI history according to documented engine guarantees. Private visits never enter normal history or session restore. Downloaded files remain on disk and this limitation must be disclosed. Private mode is not anonymity: websites, network operators, employers, and remote AI providers may still observe activity.

## Clear data and prompt fatigue
The current clear-site-data action clears cookies, site storage, cache, and in-memory permission decisions. Provide categories/time ranges with exact descriptions of inclusion/exclusion in future settings. Do not promise forensic erasure. The prototype remembers allow/block decisions per origin and capability for the session to reduce repeated prompts. A denial must not cause an interruption loop. Native prompts remain above page content.

## Open decisions
Password manager, autofill, sync, third-party cookie policy, tracking protection, DNS-over-HTTPS, and permission expiry need separate review.

## Tests
Origin/profile isolation, denial, revocation, private mode, repeated prompt abuse, malicious iframe, spoofed origin, restart, deletion completeness, and keyboard/screen-reader prompts.
