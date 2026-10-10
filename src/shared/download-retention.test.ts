import { describe, expect, it } from 'vitest';
import type { DownloadRecord } from './browser-types';
import { getDownloadIdsToPrune } from './download-retention';

function row(id: string, startedAt: string, status: DownloadRecord['status'] = 'completed'): DownloadRecord {
  return {
    id, filename: id + '.zip', url: 'https://example.com/' + id + '.zip', status,
    receivedBytes: 1, totalBytes: 1, canResume: false, startedAt,
  };
}

describe('getDownloadIdsToPrune', () => {
  it('prunes oldest completed entries even when restored list is newest-first', () => {
    const records = [
      row('newest', '2026-10-10T12:00:00.000Z'),
      row('middle', '2026-10-10T11:00:00.000Z'),
      row('oldest', '2026-10-10T10:00:00.000Z'),
    ];
    expect(getDownloadIdsToPrune(records, 2)).toEqual(['oldest']);
  });

  it('never prunes active downloads and returns only as many terminal IDs as needed', () => {
    const records = [
      row('active', '2026-10-10T12:00:00.000Z', 'progressing'),
      row('cancelled-old', '2026-10-10T09:00:00.000Z', 'cancelled'),
      row('completed-new', '2026-10-10T11:00:00.000Z', 'completed'),
    ];
    expect(getDownloadIdsToPrune(records, 2)).toEqual(['cancelled-old']);
  });

  it('does not prune when under the limit or when all excess records are active', () => {
    expect(getDownloadIdsToPrune([row('one', '2026-10-10T10:00:00.000Z')], 2)).toEqual([]);
    expect(getDownloadIdsToPrune([
      row('active-1', '2026-10-10T10:00:00.000Z', 'progressing'),
      row('active-2', '2026-10-10T11:00:00.000Z', 'paused'),
    ], 1)).toEqual([]);
  });

  it('rejects invalid limits', () => {
    expect(() => getDownloadIdsToPrune([], -1)).toThrow(/non-negative integer/);
  });
});
