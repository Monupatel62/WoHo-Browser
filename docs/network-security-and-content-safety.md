# Network Security and Content Safety Specification

**Status:** Planned. Controls must be enforced by the browser/engine boundary, not just UI.

## Transport security
Preserve engine certificate validation; never globally ignore certificate errors. Certificate failures use browser-controlled UI and never silently continue. HTTP must be identified as unencrypted without implying the site is otherwise trustworthy. Define mixed active content and insecure form-submission behavior. Do not implement custom cryptography.

## Schemes and navigation
Allow only explicitly supported schemes. File, JavaScript, data, blob, internal app, developer-tools, and OS external protocols are separate security cases. Web content must not navigate into privileged app UI or invoke OS handlers without validation and user intent. Re-check redirect destinations.

## Phishing and malware reputation
Make an explicit decision whether to include Safe Browsing or another reputation provider. If included, document provider, transmitted data, update cadence, offline behavior, false-positive path, settings, licensing, and cost. If not included, say so plainly and do not market the browser as offering phishing/malware reputation protection. Do not silently upload full browsing history.

## Isolation
Keep renderer sandboxing and context isolation enabled wherever supported. Disabling either requires a reviewed exception and blocks release until risk is addressed. Use a restrictive preload API, validate IPC sender/schema/size/operation, and deny unknown requests. Do not claim Chrome-equivalent site isolation until the exact configuration is verified. Trusted app UI uses restrictive CSP and packaged controlled resources; remote pages must never run in a privileged renderer.

## Downloads and external apps
Follow [Downloads and File Handling](downloads-and-file-handling.md), including no auto-execution and Mark-of-the-Web preservation where supported. External protocol launch requires a browser-controlled prompt identifying the target when possible. Certificate interstitials cannot be framed or styled by the failing website.

## Patch maintenance
Track supported Electron/Chromium releases, upstream advisories, dependency CVEs, and end-of-life dates. Assign a named maintainer role, initially the project owner if no team exists. Define response targets honestly as targets, not an SLA unless staffing supports it. Critical fixes need expedited impact assessment and release.

## Tests
Certificate failures, redirects to dangerous schemes, popup/external protocol abuse, mixed content, CSP bypass attempts, sandbox/context-isolation checks, malicious IPC, reputation-provider outage/offline behavior, download metadata, and dependency vulnerability fixtures.
