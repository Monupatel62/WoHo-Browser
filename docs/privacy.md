# WoHo Browser Privacy Requirements

**Status:** Proposed policy requirements. No AI features or remote AI processing are implemented in the current browser prototype. Publish a user-facing privacy notice before public release.

## Principles
- Collect the least data needed for the feature.
- Keep browsing data local by default.
- The browser does not perform remote AI processing; do not add such a data flow.
- Provide understandable deletion and export controls.
- Do not sell browsing history or page contents.
- Do not describe private browsing as anonymous.

## Data inventory to complete before release

| Data | Proposed default | Required user control |
|---|---|---|
| Settings | Stored locally | Reset/export where practical |
| Bookmarks | Stored locally | Export/import/delete |
| History | Stored locally; query strings and URL fragments are removed to avoid retaining common token-bearing URL components | Clear history and retention settings |
| Download records | Up to 100 normal-profile records stored locally; source query strings and fragments are removed; selected save paths are retained | Download records are separate from files; private downloads are excluded from the normal list; downloaded files remain until the user deletes them |
| Saved session URLs | Off by default; when enabled, up to 50 normal-tab HTTP(S) URLs are stored locally, including query values needed to reopen pages | Explicit opt-in; private tabs are excluded; disabling the setting clears the saved session list; saved URLs may contain sensitive query values |
| Crash diagnostics | Off unless consent is obtained | Opt in/out and explain fields |
| Sync data | Not collected until sync is designed and launched | Account, encryption, export, deletion controls |

## AI scope exclusion

WoHo Browser does not include AI features and does not send page content, prompts, or browsing data to AI providers. AI integrations and their data flows are out of scope, not planned release work.


## Private browsing
Document precisely which local records are not retained and which data may still be visible to websites, networks, employers, DNS resolvers, or internet providers. Do not promise protection against device monitoring or network observation.

## Retention and deletion
Define retention periods for every stored category. Clearing history must actually remove the corresponding local records. If any diagnostics or account data are sent remotely, define retention and deletion processes before launch.

## Before launch
- Identify the legal entity/contact responsible for the product.
- Review applicable privacy and consumer-protection laws for target markets.
- Publish a real privacy notice and contact channel.
- Test all deletion, opt-out, and export behavior.
- Do not claim legal compliance until reviewed and substantiated.
