# Downloads and File Handling Specification

**Status:** Partially implemented. The browser asks for a save destination, tracks normal-profile download progress, supports pause/resume/cancel where Electron allows it, persists a bounded download list across restarts, and reveals completed files in their folder. Private downloads use isolated session handling and are deliberately excluded from the normal download-history file and UI.

## Initiation and lifecycle

Downloads are handled through Electron's download lifecycle. The app asks for a destination before writing the file. Normal-profile records contain a stable ID, sanitized suggested filename, redacted HTTP(S) source URL, destination path when chosen, byte counts, state, resume capability, and start timestamp. At most 100 records are retained. If the app exits while a download is waiting, progressing, or paused, it is shown as interrupted on the next launch; automatic resume is not implemented.

## Destination and names

Implemented: each download is paused synchronously while the asynchronous Save dialog is open, then assigned the user-selected path before resuming; cancellation cancels the download. This avoids writing to an implicit default path while waiting for user input. Path components, common Windows-invalid characters, control characters, trailing dots/spaces, excessive filename length, and common Windows reserved device names (including names with extensions) are sanitized. Suggested names are normalized to Unicode NFC and bidirectional control characters are removed to reduce extension-spoofing risk; other Unicode confusables are not comprehensively detected. Prevent path traversal and destination escape. Handle collisions with an explicit rename/overwrite-confirm/cancel choice. Keep partial files separate from completed files and clean them safely.

## Security

Never auto-open or execute downloaded files. Opening requires a deliberate user action. Display source origin and filename before open/show-folder. Document Windows Mark-of-the-Web behavior and preserve security-zone metadata where supported; do not silently strip it. Decide explicitly whether Safe Browsing/reputation scanning exists; do not claim scanning without a service. MIME and extension are not proof of safety. No automatic archive extraction in MVP. Downloads must respect TLS validation; file-open and external-app launches are privileged operations.

## UI

Implemented: name, progress/status, pause/resume/cancel where supported, Show in folder for completed downloads, a “Clear finished” action, and per-item removal for completed/cancelled/interrupted records while leaving active downloads visible. These actions remove history records only; they do not delete saved files. Retry, open-after-completion, and detailed destination/source UI remain planned. Unknown total size must not show misleading percentages.

## Failure and privacy

The download-history JSON is stored locally in the application's user-data directory using bounded records and atomic writes. Corrupt or unsupported history is rejected without silently overwriting the original file. When removing a record, the app keeps it visible until the removal is durably written; a storage error can be retried rather than silently losing the record from the UI. Source query strings and fragments are stripped so signed URLs and tokens are not retained. The chosen local save path is stored in the normal-profile history and may reveal the user's Windows account name or folder layout. Private-session downloads are not written to this store, but downloaded files themselves remain on disk after private tabs close. The app does not send download metadata to telemetry.

Still to specify and test: insufficient disk space, permission denied, disconnected volume, filename collision, interruption, changing server content on resume, app exit, OS shutdown, partial cleanup, Mark-of-the-Web, open confirmation, unsafe MIME, and TLS failure. No reputation scanning, MIME safety verdict, automatic cleanup, or private download manager is implemented.
