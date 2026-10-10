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
    await expect(store.load()).resolves.toEqual({ searchProvider: 'google', homePageUrl: 'https://www.google.com/', restoreSession: false });
  });

  it('persists validated settings across store instances', async () => {
    const { store, file } = await createStore();
    await store.update({ searchProvider: 'duckduckgo', homePageUrl: 'https://example.com/start', restoreSession: true });
    await expect(new BrowserSettingsStore(file).load()).resolves.toEqual({
      searchProvider: 'duckduckgo', homePageUrl: 'https://example.com/start', restoreSession: true,
    });
  });

  it('rejects unsupported providers, unsafe URLs, credentials, and oversized values', async () => {
    const { store } = await createStore();
    await expect(store.update({ searchProvider: 'custom', homePageUrl: 'https://example.com/', restoreSession: false })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'https://example.com/', restoreSession: false, surprise: true } as never)).rejects.toThrow(/unknown keys/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'file:///secret', restoreSession: false })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'https://user:pass@example.com/', restoreSession: false })).rejects.toThrow(/unsupported/);
    await expect(store.update({ searchProvider: 'google', homePageUrl: 'https://example.com/' + 'x'.repeat(2100), restoreSession: false })).rejects.toThrow(/unsupported/);
  });

  it('migrates version 1 settings with session restore disabled by default', async () => {
    const { store, file } = await createStore();
    await writeFile(file, JSON.stringify({
      version: 1,
      settings: { searchProvider: 'bing', homePageUrl: 'https://example.org/' },
    }), 'utf8');
    await expect(store.load()).resolves.toEqual({
      searchProvider: 'bing', homePageUrl: 'https://example.org/', restoreSession: false,
    });
    const persisted = JSON.parse(await readFile(file, 'utf8'));
    expect(persisted.version).toBe(2);
    expect(persisted.settings.restoreSession).toBe(false);
  });

  it('preserves malformed settings instead of silently replacing them', async () => {
    const { store, file } = await createStore();
    await writeFile(file, '{bad json', 'utf8');
    await expect(store.load()).rejects.toThrow(/original data was preserved/);
    expect(await readFile(file, 'utf8')).toBe('{bad json');
  });

  it('reset restores the documented defaults', async () => {
    const { store } = await createStore();
    await store.update({ searchProvider: 'bing', homePageUrl: 'https://example.org/', restoreSession: true });
    await expect(store.reset()).resolves.toEqual({ searchProvider: 'google', homePageUrl: 'https://www.google.com/' });
  });
});
