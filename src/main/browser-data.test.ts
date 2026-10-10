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

  it('does not save unsupported schemes or URLs with embedded credentials', async () => {
    const { store } = await createStore();
    await expect(store.addBookmark('Unsafe', 'javascript:alert(1)')).rejects.toThrow(/HTTP and HTTPS/);
    await expect(store.addBookmark('Credentials', 'https://user:secret@example.com')).rejects.toThrow(/credentials/);
    await store.recordVisit('file:///private.txt', 'Private');
    expect(await store.listHistory()).toEqual([]);
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
});
