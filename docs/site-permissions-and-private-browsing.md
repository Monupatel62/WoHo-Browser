# Site Permissions, Privacy Controls, and Private Browsing

**Status:** Planned. Permission defaults are security requirements.

## Permission model
Permissions are scoped by origin, capability, profile/session, and decision source. Capabilities may include camera, microphone, geolocation, notifications, clipboard, screen capture, popups, autoplay, and device APIs only where supported by the engine. Do not show unsupported controls as if they work.

## Defaults and prompts
Unknown/unhandled permissions default to deny. Camera, microphone, location, screen capture, and device access require user intent and a browser-controlled prompt. Prompts identify requesting origin and capability. A site cannot create its own fake prompt and gain permission. Allow once/remembered decisions are allowed only when persistence semantics are precise. Users can review and revoke persisted grants. AI cannot approve its own permission requests.

## Site controls
A trusted active-site panel may expose origin identity, permissions, site data clearing, popups, notifications, camera/microphone/location, and connection state where supported. Clearing local site data does not imply deletion of remote data or logout from every service.

## Private browsing
Private mode uses a separate non-persistent session partition for cookies, local storage, cache, history, suggestions, permissions, and AI history according to documented engine guarantees. Private visits never enter normal history or session restore. Downloaded files remain on disk and this limitation must be disclosed. Private mode is not anonymity: websites, network operators, employers, and remote AI providers may still observe activity.

## Clear data and prompt fatigue
Provide categories/time ranges with exact descriptions of inclusion/exclusion. Verify deletion against actual stores. Do not promise forensic erasure. Rate-limit repeated permission prompts and let users block repeated requests. A denial must not cause an interruption loop. Prompts must remain accessible and visible above page content.

## Open decisions
Password manager, autofill, sync, third-party cookie policy, tracking protection, DNS-over-HTTPS, and permission expiry need separate review.

## Tests
Origin/profile isolation, denial, revocation, private mode, repeated prompt abuse, malicious iframe, spoofed origin, restart, deletion completeness, and keyboard/screen-reader prompts.
