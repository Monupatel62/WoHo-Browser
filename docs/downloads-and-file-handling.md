# Downloads and File Handling Specification

**Status:** Partially implemented. The browser asks for a save destination, tracks normal-profile download progress, supports pause/resume/cancel where Electron allows it, persists a bounded download list across restarts, and reveals completed files in their folder. Private downloads use isolated session handling and are deliberately excluded from the normal download-history file and UI.

## Initiation and lifecycle

Downloads are handled through Electron's download lifecycle. The app asks for a destination before writing the file. Normal-profile records contain a stable ID, sanitized suggested filename, redacted HTTP(S) source URL, destination path when chosen, byte counts, state, resume capability, and start timestamp. At most 100 records are retained. If the app exits while a download is waiting, progressing, or paused, it is shown as interrupted on the next launch; automatic resume is not implemented.

## Destination and names

Implemented: each download opens a Save dialog; path components, common Windows-invalid characters, control characters, trailing dots/spaces, and excessive filename length are sanitized. Full reserved-device-name and Unicode normalization handling remain to be added. Prevent path traversal and destination escape. Handle collisions with an explicit rename/overwrite-confirm/cancel choice. Keep partial files separate from completed files and clean them safely.

## Security

Never auto-open or execute downloaded files. Opening requires a deliberate user action. Display source origin and filename before open/show-folder. Document Windows Mark-of-the-Web behavior and preserve security-zone metadata where supported; do not silently strip it. Decide explicitly whether Safe Browsing/reputation scanning exists; do not claim scanning without a service. MIME and extension are not proof of safety. No automatic archive extraction in MVP. Downloads must respect TLS validation; file-open and external-app launches are privileged operations.

## UI

Implemented: name, progress/status, pause/resume/cancel where supported, Show in folder for completed downloads, and a “Clear finished” action that removes completed/cancelled/interrupted records while leaving active downloads visible. The action confirms that records are removed but files on disk are not deleted. Retry, per-item remove-from-list, open-after-completion, and detailed destination/source UI remain planned. Unknown total size must not show misleading percentages.

## Failure and privacy

The download-history JSON is stored locally in the application's user-data directory using bounded records and atomic writes. Corrupt or unsupported history is rejected without silently overwriting the original file. Source query strings and fragments are stripped so signed URLs and tokens are not retained. The chosen local save path is stored in the normal-profile history and may reveal the user's Windows account name or folder layout. Private-session downloads are not written to this store, but downloaded files themselves remain on disk after private tabs close. The app does not send download metadata to telemetry.

Still to specify and test: insufficient disk space, permission denied, disconnected volume, filename collision, interruption, changing server content on resume, app exit, OS shutdown, partial cleanup, Mark-of-the-Web, open confirmation, unsafe MIME, and TLS failure. No reputation scanning, MIME safety verdict, automatic cleanup, or private download manager is implemented.
