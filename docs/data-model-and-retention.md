# Browser Data Model and Retention

Status: Proposed inventory; retention durations require owner approval before release.

| Entity | Minimum data | Proposed location | Retention |
|---|---|---|---|
| Settings | Key, validated value, schema version | Local config | Until changed/reset |
| Bookmark | ID, title, URL, folder, timestamps | Local database | Until deleted |
| History | URL, title, visit time | Local database | User-configurable; default TBD |
| Download record | Origin, filename, destination, state, timestamps | Local database | User-clearable; file is separate |
| Tab/session | Safe URL, order, workspace | Local database | User-configurable; no secrets |
| AI note | User-selected content and sources | Local unless exported | Until deleted |
| Provider credential | Provider and secure-store reference | OS secure storage where supported | Until removed |
| Diagnostics | Minimal event/version/error fields | Off by default pending policy | TBD if enabled |
| Sync | Not in initial scope | None | Not applicable |

Never persist passwords, cookies, tokens, or hidden form values as ordinary history/session data. Clearing history must remove records and indexes; document separately whether site data/cookies are cleared. Private sessions must use non-persistent storage and never send data to AI automatically.

Before release, decide storage engine, retention defaults, migrations, export format, deletion semantics, backups, and applicable legal requirements. Do not claim compliance without review.