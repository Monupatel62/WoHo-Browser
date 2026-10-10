# Downloads and File Handling Specification

**Status:** Partially implemented. The first slice tracks downloads in the active app session, asks for a save destination, supports pause/resume/cancel where Electron allows it, shows progress/status, and reveals completed files in their folder. The rest of this specification remains planned.

## Initiation and lifecycle
Downloads are handled through Electron's download lifecycle. The app asks for a destination before writing the file. Implemented: stable in-memory ID, sanitized suggested name, redacted HTTP(S) URL (query and fragment removed), destination, byte counts, state, and start timestamp. Records are not persisted across app restarts. Do not log file contents. States include pending, in progress, paused if supported, completed, canceled, interrupted, blocked, and failed.

## Destination and names
Implemented: each download opens a Save dialog; path components, common Windows-invalid characters, control characters, trailing dots/spaces, and excessive filename length are sanitized. Full reserved-device-name and Unicode normalization handling remain to be added. Prevent path traversal and destination escape. Handle collisions with an explicit rename/overwrite-confirm/cancel choice. Keep partial files separate from completed files and clean them safely.

## Security
Never auto-open or execute downloaded files. Opening requires a deliberate user action. Display source origin and filename before open/show-folder. Document Windows Mark-of-the-Web behavior and preserve security-zone metadata where supported; do not silently strip it. Decide explicitly whether Safe Browsing/reputation scanning exists; do not claim scanning without a service. MIME and extension are not proof of safety. No automatic archive extraction in MVP. Downloads must respect TLS validation; file-open and external-app launches are privileged operations.

## UI
Implemented: name, progress/status, pause/resume/cancel where supported, and Show in folder for completed downloads. Retry, remove-from-list, open-after-completion, and detailed destination/source UI remain planned. Unknown total size must not show misleading percentages. “Remove from list” is distinct from deleting the file; deletion requires a separate clear confirmation.

## Failure and privacy
Specify insufficient disk space, permission denied, disconnected volume, filename collision, interruption, changing server content on resume, app exit, and OS shutdown. Partial files must never appear complete. Download metadata may reveal sensitive activity; define history-clear and private-session semantics. Do not send filenames/source URLs to telemetry by default.

## Tests
Traversal filenames, reserved names, long Unicode names, collisions, disk-full, cancellation race, crash mid-write, partial cleanup, Mark-of-the-Web, open confirmation, unsafe MIME, TLS failure, and private metadata retention.
\n\n## Current limitations\n\n- Download records are held in memory and disappear on restart.\n- Non-HTTP(S) downloads and credential-bearing source URLs are rejected. Query strings and fragments are removed from displayed/stored source metadata to avoid retaining signed tokens.\n- The app never auto-opens downloaded files.\n- The initial implementation has no reputation scanning, MIME safety verdict, automatic cleanup, or private-session separation.\n