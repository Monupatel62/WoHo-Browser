import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BrowserSettingsStore } from './browser-settings';

const directories: string[] = [];
async function createStore() {
  const directory = await mkdtemp(join(tmpdir(), 'woho-settings-'));
  directories.push(directory);
  return { store: new BrowserSettingsStore(join(directory, 'settings.json')), file: join(directory, 'settings.json') };
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('BrowserSettingsStore', () => {
  it('returns safe defaults when no settings file exists', async () => {
    const { store } = await createStore();
    await expect(store.load()).resolves.toEqual({ searchProvider: 'google', homePageUrl: 'https://www.google.com/' });
  });

  it('persists validated settings across store instances', async () => {
    const { store, file } = await createStore();
    await store.update({ searchProvider: 'duckduckgo', homePageUrl: 'https://example.com/start' });
    await expect(new BrowserSettingsStore(file).load()).resolves.toEqual({
      searchProvider: 'duckduckgo', homePageUrl: 'https://example.com/start',
    });
  });

  it('rejects unsupported providers, unsafe URLs, credentials, and oversized values', async () => {
    const { store } = await createStore();
    await expect(store.update({ searchProvider: 'custom', homePageUrl: 'https://example.com/' })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'file:///secret' })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'https://user:pass@example.com/' })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'https://example.com/' + 'x'.repeat(2100) })).rejects.toThrow(/unsupported/);
  });

  it('preserves malformed settings instead of silently replacing them', async () => {
    const { store, file } = await createStore();
    await writeFile(file, '{bad json', 'utf8');
    await expect(store.load()).rejects.toThrow(/original data was preserved/);
    expect(await readFile(file, 'utf8')).toBe('{bad json');
  });

  it('reset restores the documented defaults', async () => {
    const { store } = await createStore();
    await store.update({ searchProvider: 'bing', homePageUrl: 'https://example.org/' });
    await expect(store.reset()).resolves.toEqual({ searchProvider: 'google', homePageUrl: 'https://www.google.com/' });
  });
});
