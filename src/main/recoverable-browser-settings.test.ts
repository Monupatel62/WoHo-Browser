import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRecoverableBrowserSettingsStore } from './recoverable-browser-settings';

const directories: string[] = [];
async function createDirectory() {
  const path = await mkdtemp(join(tmpdir(), 'woho-settings-recovery-'));
  directories.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('openRecoverableBrowserSettingsStore', () => {
  it('preserves corrupt primary settings and selects a separate recovery file', async () => {
    const directory = await createDirectory();
    const primary = join(directory, 'settings.json');
    const recovery = join(directory, 'settings-recovery.json');
    await writeFile(primary, '{bad primary', 'utf8');
    const warn = vi.fn(async () => undefined);
    const store = await openRecoverableBrowserSettingsStore(primary, recovery, () => join(directory, 'settings-unique.json'), warn);
    expect(await store.get()).toMatchObject({ searchProvider: 'google' });
    expect(await readFile(primary, 'utf8')).toBe('{bad primary');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('preserves both invalid files and uses a unique fallback', async () => {
    const directory = await createDirectory();
    const primary = join(directory, 'settings.json');
    const recovery = join(directory, 'settings-recovery.json');
    const fallback = join(directory, 'settings-unique.json');
    await writeFile(primary, '{bad primary', 'utf8');
    await writeFile(recovery, '{bad recovery', 'utf8');
    const warn = vi.fn(async () => undefined);
    const store = await openRecoverableBrowserSettingsStore(primary, recovery, () => fallback, warn);
    await store.update({ searchProvider: 'bing', homePageUrl: 'https://example.com/', restoreSession: false });
    expect(await readFile(primary, 'utf8')).toBe('{bad primary');
    expect(await readFile(recovery, 'utf8')).toBe('{bad recovery');
    expect(JSON.parse(await readFile(fallback, 'utf8')).settings.searchProvider).toBe('bing');
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
