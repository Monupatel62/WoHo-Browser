# Browser Data Model and Retention

Status: Proposed inventory; retention durations require owner approval before release.

| Entity | Minimum data | Proposed location | Retention |
|---|---|---|---|
| Settings | Key, validated value, schema version | Local config | Until changed/reset |
| Bookmark | ID, title, URL, folder, timestamps | Local database | Until deleted |
| History | URL without query string or fragment, title, visit time | Local JSON store | Bounded to 500 records; user-configurable retention remains planned |
| Download record | Redacted HTTP(S) source URL, filename, destination path, state, byte counts, timestamps | Local JSON store | Bounded to 100 normal-profile records; private downloads excluded; downloaded file is separate |
| Tab/session | Safe URL, order, workspace | Local database | User-configurable; no secrets |
| AI note | User-selected content and sources | Local unless exported | Until deleted |
| Provider credential | Provider and secure-store reference | OS secure storage where supported | Until removed |
| Diagnostics | Minimal event/version/error fields | Off by default pending policy | TBD if enabled |
| Sync | Not in initial scope | None | Not applicable |

Never persist passwords, cookies, or hidden form values as ordinary history data. Browsing history and download records strip URL query strings and fragments; explicit bookmarks retain their full URL because the user chose to save that destination. Opt-in session restore is an explicit exception: it stores up to 50 normal-tab URLs including query values so pages can reopen, and the Settings UI warns that these values may be sensitive. This reduces common token leakage in history but cannot detect secrets embedded in URL path segments. Clearing history must remove records and indexes; document separately whether site data/cookies are cleared. Private sessions must use non-persistent storage and must not persist private browsing data into the normal profile.

Before release, decide storage engine, retention defaults, migrations, export format, deletion semantics, backups, and applicable legal requirements. Do not claim compliance without review.

Profile JSON files are read through a bounded file-handle reader that enforces the byte limit while reading, not only from a prior file-size check. This limits memory use if a file grows between metadata inspection and reading; malformed or oversized source files are preserved during recovery.
