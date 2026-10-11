import { describe, expect, it } from 'vitest';
import type { DownloadRecord } from './browser-types';
import { getDownloadIdsToPrune, isFinishedDownloadStatus, pruneDownloadRecordsDurably } from './download-retention';

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

describe('isFinishedDownloadStatus', () => {
  it.each(['completed', 'cancelled', 'interrupted'] as const)('allows removal of %s records', (status) => {
    expect(isFinishedDownloadStatus(status)).toBe(true);
  });

  it.each(['waiting', 'progressing', 'paused'] as const)('protects active %s records from removal', (status) => {
    expect(isFinishedDownloadStatus(status)).toBe(false);
  });
});

describe('pruneDownloadRecordsDurably', () => {
  it('removes in-memory rows only after persistent removal succeeds', async () => {
    const records = [
      row('newest', '2026-10-10T12:00:00.000Z'),
      row('oldest', '2026-10-10T10:00:00.000Z'),
    ];
    const removed: string[] = [];
    const persisted: string[] = [];
    await expect(pruneDownloadRecordsDurably(
      records,
      1,
      async (id) => {
        persisted.push(id);
        if (id === 'oldest') throw new Error('disk write failed');
      },
      (id) => removed.push(id),
    )).rejects.toThrow('disk write failed');
    expect(persisted).toEqual(['oldest']);
    expect(removed).toEqual([]);
  });

  it('prunes oldest rows sequentially after each durable deletion', async () => {
    const records = [
      row('newest', '2026-10-10T12:00:00.000Z'),
      row('oldest', '2026-10-10T10:00:00.000Z'),
      row('middle', '2026-10-10T11:00:00.000Z'),
    ];
    const order: string[] = [];
    const removed = await pruneDownloadRecordsDurably(
      records,
      1,
      async (id) => { order.push('persist:' + id); },
      (id) => { order.push('memory:' + id); },
    );
    expect(removed).toEqual(['oldest', 'middle']);
    expect(order).toEqual(['persist:oldest', 'memory:oldest', 'persist:middle', 'memory:middle']);
  });
});
