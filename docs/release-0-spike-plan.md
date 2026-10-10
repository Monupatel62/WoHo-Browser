# Release 0 Feasibility Spike

## Goal and timebox
Determine whether Electron can support the first Windows browser using evidence. Target 4–6 weeks part-time; this is an estimate, not a guarantee.

## Work packages
1. Build a minimal Electron app with separate browser chrome and WebContentsView tabs.
2. Test safe navigation, popup denial, permission handlers, origin validation, and renderer isolation.
3. Test Google/Microsoft sign-in with permitted test accounts and record restrictions.
4. Test representative extension loading only to understand limitations.
5. Investigate Widevine only if customer research validates the need.
6. Test 20 representative sites for layout, authentication, downloads, media, and redirects.
7. Package a Windows installer and test update round trip and integrity verification.
8. Measure startup, tab switching, memory, crash recovery, and accessibility.

## Go/no-go
- No unresolved critical privilege-boundary issue.
- Navigation and popup rules are tested and default-deny where intended.
- Installer, update, failure recovery, and uninstall behavior are understood.
- Compatibility blockers are recorded.
- The maintainer can sustain security updates.
- Target-user research supports a real problem and initial differentiation.

## Outputs
Working prototype branch, test scripts/results, updated ADRs, risk register, cut list, and explicit owner go/no-go decision. Do not build autonomous AI actions during this spike.