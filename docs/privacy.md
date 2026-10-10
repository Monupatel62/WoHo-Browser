# WoHo Browser Privacy Requirements

**Status:** Proposed policy requirements. No AI features or remote AI processing are implemented in the current browser prototype. Publish a user-facing privacy notice before public release.

## Principles
- Collect the least data needed for the feature.
- Keep browsing data local by default.
- Make remote processing clear before sending page content to an AI provider.
- Provide understandable deletion and export controls.
- Do not sell browsing history or page contents.
- Do not describe private browsing as anonymous.

## Data inventory to complete before release

| Data | Proposed default | Required user control |
|---|---|---|
| Settings | Stored locally | Reset/export where practical |
| Bookmarks | Stored locally | Export/import/delete |
| History | Stored locally | Clear history and retention settings |
| Download records | In-memory for the current app session | Records disappear when the app exits; downloaded files remain until the user deletes them |
| AI prompt and selected page context | Sent only after user action when remote AI is used | Preview, cancel, provider disclosure |
| AI provider credentials | Secure local storage where supported | View provider configuration and remove key |
| Crash diagnostics | Off unless consent is obtained | Opt in/out and explain fields |
| Sync data | Not collected until sync is designed and launched | Account, encryption, export, deletion controls |

## Future AI disclosure
AI integration is out of scope and absent from this prototype. If a future version adds remote AI, identify the provider before processing, show the context being sent, and explain applicable provider policies. Never include cookies, passwords, hidden form fields, or unrelated browsing history in AI context. Do not advertise local-model options unless they are supported and tested.

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
