# Address Bar and Search Specification

**Status:** Partially implemented. URL/query classification and HTTP(S)-only navigation are implemented; users can select Google, Bing, or DuckDuckGo and configure the home/new-tab URL. Suggestions, paste-and-go, and provider privacy links remain planned.

## Input classification
Accept URL, hostname/path, or plain-language query. Explicit supported schemes are parsed as URLs. Hostname-plus-port input is navigation only when it passes documented validation. Plain text uses the configured search provider. Ambiguous or invalid input must not silently open local files or launch external applications. Search templates must be validated and encode query values safely.

## Interaction
Define shortcut to focus/select the address field, Enter submission, Escape behavior, suggestion keyboard navigation, Tab behavior, focus return, paste-and-go, copy, clear, and drag/drop. Repeated Enter must not accidentally create duplicate tabs or paid requests. Loading state and destination should update after submission.

## Suggestions
Sources may include local history, bookmarks, and optional remote search suggestions. Each source has an independent setting and disclosure. Requests must be debounced, bounded, cancelable, and timed out. Render suggestions as text, never HTML. Clear-history must also remove cached suggestions. Private-session queries must not enter normal-profile suggestions or remote suggestions unless a specific reviewed setting explicitly permits it.

## Search providers
Provider configuration includes name, URL template, query encoding, and optional suggestion endpoint. Reject malformed templates, unsupported schemes, and unsafe hosts. Do not silently replace the user's provider or inject affiliate parameters. Provider outage follows the normal error path. Identify the provider and link its privacy information where practical.

## Privacy/security
Search text is not telemetry by default and is not automatically AI context. Avoid sending credentials or fragments in suggestions. Treat remote suggestions as untrusted. Prevent open redirects and scheme injection through templates.

## Acceptance tests
URL/query classification; IPv4/IPv6 and ports; IDNs; malformed schemes; query encoding; malicious provider template; slow/failing/stale suggestions; history deletion; private-session isolation; keyboard-only operation and screen-reader announcements.
