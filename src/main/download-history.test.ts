import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { DownloadRecord } from '../shared/browser-types';
import { DownloadHistoryStore } from './download-history';

const directories: string[] = [];
async function createStore() {
  const directory = await mkdtemp(join(tmpdir(), 'woho-download-history-'));
  directories.push(directory);
  return { store: new DownloadHistoryStore(join(directory, 'downloads.json')), file: join(directory, 'downloads.json') };
}
function record(overrides: Partial<DownloadRecord> = {}): DownloadRecord {
  return {
    id: 'download-1', filename: 'archive.zip', url: 'https://example.com/archive.zip',
    status: 'completed', receivedBytes: 10, totalBytes: 10, canResume: false,
    savePath: 'C:\\Users\\Test\\Downloads\\archive.zip', startedAt: '2026-10-10T10:00:00.000Z',
    ...overrides,
  };
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('DownloadHistoryStore', () => {
  it('persists normal-profile records across store instances and updates by ID', async () => {
    const { store, file } = await createStore();
    await store.upsert(record());
    await store.upsert(record({ status: 'interrupted', receivedBytes: 5 }));
    expect(await new DownloadHistoryStore(file).list()).toMatchObject([
      { id: 'download-1', status: 'interrupted', receivedBytes: 5 },
    ]);
  });

  it('redacts query strings and fragments by rejecting unsafe persisted URLs', async () => {
    const { store } = await createStore();
    await expect(store.upsert(record({ url: 'https://example.com/file?token=secret' }))).rejects.toThrow(/unsafe URL/);
    await expect(store.upsert(record({ url: 'https://user:secret@example.com/file' }))).rejects.toThrow(/unsafe URL/);
  });

  it('recovers active downloads as interrupted after restart', async () => {
    const { store, file } = await createStore();
    await store.upsert(record({ status: 'progressing', canResume: true }));
    expect(await new DownloadHistoryStore(file).list()).toMatchObject([
      { id: 'download-1', status: 'interrupted', canResume: false },
    ]);
  });

  it('bounds retained history to 100 records', async () => {
    const { store } = await createStore();
    for (let i = 0; i < 105; i++) {
      await store.upsert(record({ id: 'download-' + i, filename: 'file-' + i, startedAt: '2026-10-10T10:00:00.000Z' }));
    }
    const rows = await store.list();
    expect(rows).toHaveLength(100);
    expect(rows[0].id).toBe('download-104');
  });

  it('does not resurrect a record when an upsert races with removal', async () => {
    const { store, file } = await createStore();
    await store.upsert(record());
    const reloadedStore = new DownloadHistoryStore(file);
    const lateUpsert = reloadedStore.upsert(record({ status: 'interrupted' }));
    const removal = reloadedStore.remove('download-1');
    await Promise.all([lateUpsert, removal]);
    expect(await reloadedStore.list()).toEqual([]);
    expect(JSON.parse(await readFile(file, 'utf8')).downloads).toEqual([]);
  });

  it('preserves malformed files instead of silently overwriting them', async () => {
    const { store, file } = await createStore();
    await writeFile(file, '{broken', 'utf8');
    await expect(store.list()).rejects.toThrow(/original data was preserved/);
    expect(await readFile(file, 'utf8')).toBe('{broken');
  });

  it('removes records durably', async () => {
    const { store, file } = await createStore();
    await store.upsert(record());
    await store.remove('download-1');
    expect(await new DownloadHistoryStore(file).list()).toEqual([]);
  });
});
