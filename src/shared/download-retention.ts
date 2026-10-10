import type { DownloadRecord, DownloadStatus } from './browser-types';

const TERMINAL_STATUSES = new Set<DownloadStatus>(['completed', 'cancelled', 'interrupted']);

/** Select the oldest terminal records first; active downloads are never pruned. */
export function getDownloadIdsToPrune(records: readonly DownloadRecord[], maxRecords: number): string[] {
  if (!Number.isInteger(maxRecords) || maxRecords < 0) throw new Error('Maximum download record count must be a non-negative integer.');
  const excess = Math.max(0, records.length - maxRecords);
  if (excess === 0) return [];
  return records
    .filter((record) => TERMINAL_STATUSES.has(record.status))
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt) || a.id.localeCompare(b.id))
    .slice(0, excess)
    .map((record) => record.id);
}
