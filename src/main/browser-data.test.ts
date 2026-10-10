import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BrowserDataStore } from './browser-data';

const temporaryDirectories: string[] = [];

async function createStore() {
  const directory = await mkdtemp(join(tmpdir(), 'woho-browser-data-'));
  temporaryDirectories.push(directory);
  return { store: new BrowserDataStore(join(directory, 'browser-data.json')), file: join(directory, 'browser-data.json') };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('BrowserDataStore', () => {
  it('exports a versioned bookmark-only format without internal IDs or timestamps', async () => {
    const { store } = await createStore();
    await store.addBookmark('Example', 'https://example.com/path?token=secret');
    const exported = JSON.parse(await store.exportBookmarksJson());
    expect(exported).toMatchObject({
      format: 'woho-bookmarks',
      version: 1,
      bookmarks: [{ title: 'Example', url: 'https://example.com/path?token=secret' }],
    });
    expect(exported.bookmarks[0]).not.toHaveProperty('id');
    expect(exported.bookmarks[0]).not.toHaveProperty('createdAt');
    expect(exported.bookmarks[0]).not.toHaveProperty('updatedAt');
  });

  it('imports valid bookmarks, deduplicates URLs, and updates matching titles', async () => {
    const { store } = await createStore();
    await store.addBookmark('Old title', 'https://example.com/');
    const result = await store.importBookmarksJson(JSON.stringify({
      format: 'woho-bookmarks', version: 1,
      bookmarks: [
        { title: 'Updated title', url: 'https://example.com' },
        { title: 'Second', url: 'https://example.org/path' },
        { title: 'Second final', url: 'https://example.org/path' },
      ],
    }));
    expect(result).toHaveLength(2);
    expect(result.find((item) => item.url === 'https://example.com/')?.title).toBe('Updated title');
    expect(result.find((item) => item.url === 'https://example.org/path')?.title).toBe('Second final');
  });

  it('rejects invalid imports atomically without changing existing bookmarks', async () => {
    const { store } = await createStore();
    await store.addBookmark('Keep me', 'https://keep.example/');
    const invalid = JSON.stringify({
      format: 'woho-bookmarks', version: 1,
      bookmarks: [
        { title: 'Would be valid', url: 'https://new.example/' },
        { title: 'Unsafe', url: 'javascript:alert(1)' },
      ],
    });
    await expect(store.importBookmarksJson(invalid)).rejects.toThrow(/HTTP and HTTPS/);
    expect(await store.listBookmarks()).toMatchObject([{ title: 'Keep me', url: 'https://keep.example/' }]);
  });

  it('rejects oversized and unsupported bookmark import files', async () => {
    const { store } = await createStore();
    await expect(store.importBookmarksJson('x'.repeat(1024 * 1024 + 1))).rejects.toThrow(/1 MiB/);
    await expect(store.importBookmarksJson(JSON.stringify({ version: 99, bookmarks: [] }))).rejects.toThrow(/unsupported/);
  });

  it('edits bookmark title and URL while preserving ID and creation time', async () => {
    const { store, file } = await createStore();
    const created = await store.addBookmark('Original', 'https://example.com/old');
    const original = created[0];
    const updated = await store.updateBookmark(original.id, 'Updated title', 'https://example.com/new');
    expect(updated).toMatchObject([{
      id: original.id,
      title: 'Updated title',
      url: 'https://example.com/new',
      createdAt: original.createdAt,
    }]);
    expect(Date.parse(updated[0].updatedAt)).toBeGreaterThanOrEqual(Date.parse(original.updatedAt));
    expect(await new BrowserDataStore(file).listBookmarks()).toMatchObject([{ id: original.id, url: 'https://example.com/new' }]);
  });

  it('rejects duplicate URLs and unsafe edits without changing the bookmark', async () => {
    const { store } = await createStore();
    const first = (await store.addBookmark('First', 'https://example.com/one'))[0];
    await store.addBookmark('Second', 'https://example.com/two');
    await expect(store.updateBookmark(first.id, 'Changed', 'https://example.com/two')).rejects.toThrow(/already uses this URL/);
    await expect(store.updateBookmark(first.id, 'Changed', 'javascript:alert(1)')).rejects.toThrow(/HTTP and HTTPS/);
    expect((await store.listBookmarks()).find((item) => item.id === first.id)).toMatchObject({ id: first.id, title: 'First', url: 'https://example.com/one' });
  });

  it('rejects edits for missing bookmark IDs', async () => {
    const { store } = await createStore();
    await expect(store.updateBookmark('missing', 'Title', 'https://example.com/')).rejects.toThrow(/no longer exists/);
  });

  it('persists bookmarks across store instances and deduplicates URLs', async () => {
    const { store, file } = await createStore();
    const first = await store.addBookmark('Example', 'https://example.com');
    expect(first).toHaveLength(1);
    const updated = await store.addBookmark('Example updated', 'https://example.com/');
    expect(updated).toHaveLength(1);
    expect(updated[0].title).toBe('Example updated');
    expect((await new BrowserDataStore(file).listBookmarks())[0].title).toBe('Example updated');
  });

  it('records visit metadata and clears history durably', async () => {
    const { store, file } = await createStore();
    await store.recordVisit('https://example.com/', 'Example');
    expect(await store.listHistory()).toHaveLength(1);
    await store.clearHistory();
    expect(await new BrowserDataStore(file).listHistory()).toEqual([]);
  });

  it('deletes one history entry and preserves other entries across restart', async () => {
    const { store, file } = await createStore();
    await store.recordVisit('https://example.com/one', 'One');
    await store.recordVisit('https://example.org/two', 'Two');
    const before = await store.listHistory();
    expect(before).toHaveLength(2);

    const remaining = await store.removeHistory(before[0].id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(before[1].id);
    expect(await new BrowserDataStore(file).listHistory()).toMatchObject([
      { id: before[1].id, url: 'https://example.com/one' },
    ]);
  });

  it('deletes multiple selected history entries in one durable update', async () => {
    const { store, file } = await createStore();
    await store.recordVisit('https://example.com/one', 'One');
    await store.recordVisit('https://example.com/two', 'Two');
    await store.recordVisit('https://example.com/three', 'Three');
    const before = await store.listHistory();
    const removeIds = before.filter((entry) => entry.title !== 'Two').map((entry) => entry.id);

    const remaining = await store.removeHistoryEntries(removeIds);
    expect(remaining.map((entry) => entry.title)).toEqual(['Two']);
    expect(await new BrowserDataStore(file).listHistory()).toMatchObject([{ title: 'Two' }]);
  });

  it('rejects invalid or duplicate multi-delete IDs without changing history', async () => {
    const { store } = await createStore();
    await store.recordVisit('https://example.com/keep', 'Keep');
    const before = await store.listHistory();
    await expect(store.removeHistoryEntries(['', before[0].id])).rejects.toThrow(/Invalid history entry selection/);
    await expect(store.removeHistoryEntries([before[0].id, before[0].id])).rejects.toThrow(/Invalid history entry selection/);
    expect(await store.listHistory()).toEqual(before);
  });

  it('deletes only history visits within an inclusive date-time range', async () => {
    const { store, file } = await createStore();
    await store.recordVisit('https://example.com/before', 'Before');
    await store.recordVisit('https://example.com/inside-start', 'Inside start');
    await store.recordVisit('https://example.com/inside-end', 'Inside end');
    await store.recordVisit('https://example.com/after', 'After');
    const before = await store.listHistory();
    const records = new Map(before.map((item) => [item.title, item]));
    const start = records.get('Inside start')!.visitedAt;
    const end = records.get('Inside end')!.visitedAt;

    const remaining = await store.removeHistoryRange(start, end);
    expect(remaining.map((item) => item.title).sort()).toEqual(['After', 'Before']);
    expect(await new BrowserDataStore(file).listHistory()).toMatchObject([
      { title: 'After' },
      { title: 'Before' },
    ]);
  });

  it('rejects invalid or reversed history ranges without changing data', async () => {
    const { store } = await createStore();
    await store.recordVisit('https://example.com/keep', 'Keep');
    const before = await store.listHistory();
    await expect(store.removeHistoryRange('not-a-date', '2026-10-10T23:59:59.999Z')).rejects.toThrow(/Invalid history date range/);
    await expect(store.removeHistoryRange('2026-02-30T00:00:00.000Z', '2026-10-10T23:59:59.999Z')).rejects.toThrow(/Invalid history date range/);
    await expect(store.removeHistoryRange('2026-10-11T00:00:00.000Z', '2026-10-10T00:00:00.000Z')).rejects.toThrow(/Invalid history date range/);
    expect(await store.listHistory()).toEqual(before);
  });

  it('does not save unsupported schemes or URLs with embedded credentials', async () => {
    const { store } = await createStore();
    await expect(store.addBookmark('Unsafe', 'javascript:alert(1)')).rejects.toThrow(/HTTP and HTTPS/);
    await expect(store.addBookmark('Credentials', 'https://user:secret@example.com')).rejects.toThrow(/credentials/);
    await store.recordVisit('file:///private.txt', 'Private');
    expect(await store.listHistory()).toEqual([]);
  });

  it('rejects oversized profile files without loading or overwriting them', async () => {
    const { store, file } = await createStore();
    const oversized = Buffer.alloc(4 * 1024 * 1024 + 1, 0x20);
    await writeFile(file, oversized);
    await expect(store.listHistory()).rejects.toThrow(/too large|byte limit/i);
    expect((await readFile(file)).byteLength).toBe(oversized.byteLength);
  });

  it('preserves malformed existing data instead of silently resetting it', async () => {
    const { store, file } = await createStore();
    await writeFile(file, '{broken json', 'utf8');
    await expect(store.listBookmarks()).rejects.toThrow(/original data was preserved/);
    expect(await readFile(file, 'utf8')).toBe('{broken json');
  });

  it('rejects unsupported schema versions without overwriting the source', async () => {
    const { store, file } = await createStore();
    const raw = JSON.stringify({ version: 99, bookmarks: [], history: [] });
    await writeFile(file, raw, 'utf8');
    await expect(store.listHistory()).rejects.toThrow(/unsupported/);
    expect(await readFile(file, 'utf8')).toBe(raw);
  });
  it('redacts query strings and fragments from new history visits while preserving bookmarks', async () => {
    const { store } = await createStore();
    const sensitiveUrl = 'https://example.com/private?token=secret#session';
    await store.recordVisit(sensitiveUrl, 'Private page');
    expect((await store.listHistory())[0].url).toBe('https://example.com/private');
    const bookmarks = await store.addBookmark('Explicit bookmark', sensitiveUrl);
    expect(bookmarks[0].url).toBe(sensitiveUrl);
  });

  it('migrates existing history records to remove query strings and fragments on load', async () => {
    const { store, file } = await createStore();
    const legacy = {
      version: 1,
      bookmarks: [],
      history: [{
        id: 'legacy-history', title: 'Private page',
        url: 'https://example.com/private?access_token=secret#session',
        visitedAt: '2026-10-10T10:00:00.000Z',
      }],
    };
    await writeFile(file, JSON.stringify(legacy), 'utf8');
    expect((await store.listHistory())[0].url).toBe('https://example.com/private');
    const persisted = JSON.parse(await readFile(file, 'utf8'));
    expect(persisted.history[0].url).toBe('https://example.com/private');
    expect(await readFile(file, 'utf8')).not.toContain('access_token=secret');
  });

  it('rejects duplicate history IDs without overwriting the source file', async () => {
    const { store, file } = await createStore();
    const entry = {
      id: 'duplicate-id', title: 'Example', url: 'https://example.com/',
      visitedAt: '2026-10-10T10:00:00.000Z',
    };
    const raw = JSON.stringify({ version: 1, bookmarks: [], history: [entry, { ...entry }] });
    await writeFile(file, raw, 'utf8');
    await expect(store.listHistory()).rejects.toThrow(/duplicate history IDs/);
    expect(await readFile(file, 'utf8')).toBe(raw);
  });

  it('rejects empty persisted record IDs', async () => {
    const { store, file } = await createStore();
    const raw = JSON.stringify({
      version: 1,
      bookmarks: [{ id: '', title: 'Example', url: 'https://example.com/', createdAt: '2026-10-10T10:00:00.000Z', updatedAt: '2026-10-10T10:00:00.000Z' }],
      history: [],
    });
    await writeFile(file, raw, 'utf8');
    await expect(store.listBookmarks()).rejects.toThrow(/invalid record/);
    expect(await readFile(file, 'utf8')).toBe(raw);
  });

});
