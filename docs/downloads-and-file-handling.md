# Downloads and File Handling Specification

**Status:** Planned.

## Initiation and lifecycle
Downloads originate from a deliberate user action or approved browser flow. AI suggestions never start a download automatically. Track stable ID, source origin/URL as needed for UI, suggested name, destination, byte counts where known, state, timestamps, and error code. Do not log file contents. States include pending, in progress, paused if supported, completed, canceled, interrupted, blocked, and failed.

## Destination and names
Ask for destination according to settings. Sanitize path separators, reserved Windows names, control characters, trailing dots/spaces, Unicode edge cases, and excessive length. Prevent path traversal and destination escape. Handle collisions with an explicit rename/overwrite-confirm/cancel choice. Keep partial files separate from completed files and clean them safely.

## Security
Never auto-open or execute downloaded files. Opening requires a deliberate user action. Display source origin and filename before open/show-folder. Document Windows Mark-of-the-Web behavior and preserve security-zone metadata where supported; do not silently strip it. Decide explicitly whether Safe Browsing/reputation scanning exists; do not claim scanning without a service. MIME and extension are not proof of safety. No automatic archive extraction in MVP. Downloads must respect TLS validation; file-open and external-app launches are privileged operations.

## UI
Show name, source, destination/status, progress when meaningful, cancel, retry/resume if supported, remove from list, show in folder, and open after completion. Unknown total size must not show misleading percentages. “Remove from list” is distinct from deleting the file; deletion requires a separate clear confirmation.

## Failure and privacy
Specify insufficient disk space, permission denied, disconnected volume, filename collision, interruption, changing server content on resume, app exit, and OS shutdown. Partial files must never appear complete. Download metadata may reveal sensitive activity; define history-clear and private-session semantics. Do not send filenames/source URLs to telemetry by default.

## Tests
Traversal filenames, reserved names, long Unicode names, collisions, disk-full, cancellation race, crash mid-write, partial cleanup, Mark-of-the-Web, open confirmation, unsafe MIME, TLS failure, and private metadata retention.
