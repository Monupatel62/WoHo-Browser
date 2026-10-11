import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BrowserSessionStore } from './browser-session-store';

const directories: string[] = [];
async function createStore() {
  const directory = await mkdtemp(join(tmpdir(), 'woho-session-store-'));
  directories.push(directory);
  return { store: new BrowserSessionStore(join(directory, 'session.json')), file: join(directory, 'session.json') };
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('BrowserSessionStore', () => {
  it('loads empty state when no session file exists', async () => {
    const { store } = await createStore();
    await expect(store.load()).resolves.toEqual([]);
  });

  it('persists ordered safe URLs, including duplicate tabs', async () => {
    const { store, file } = await createStore();
    const urls = ['https://example.com/one', 'https://example.org/', 'https://example.com/one'];
    await expect(store.save(urls)).resolves.toEqual(urls.map((url) => new URL(url).toString()));
    await expect(new BrowserSessionStore(file).load()).resolves.toEqual(urls.map((url) => new URL(url).toString()));
  });

  it('durably clears saved URLs before the clear operation resolves', async () => {
    const { store, file } = await createStore();
    await store.save(['https://example.com/private?token=secret', 'https://example.org/']);
    await expect(store.save([])).resolves.toEqual([]);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ version: 1, urls: [] });
    await expect(new BrowserSessionStore(file).load()).resolves.toEqual([]);
  });

  it('rejects unsafe, credential-bearing, oversized, and excessive URL lists', async () => {
    const { store } = await createStore();
    await expect(store.save(['file:///private.txt'])).rejects.toThrow(/unsafe URL/);
    await expect(store.save(['https://user:pass@example.com/'])).rejects.toThrow(/unsafe URL/);
    await expect(store.save(['https://example.com/' + 'x'.repeat(4100)])).rejects.toThrow(/unsafe URL/);
    await expect(store.save(Array.from({ length: 51 }, (_, i) => `https://example${i}.com/`))).rejects.toThrow(/number of tabs/);
  });

  it('preserves malformed session files', async () => {
    const { store, file } = await createStore();
    await writeFile(file, '{broken', 'utf8');
    await expect(store.load()).rejects.toThrow(/original data was preserved/);
    expect(await readFile(file, 'utf8')).toBe('{broken');
  });
});
