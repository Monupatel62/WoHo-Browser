import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRecoverableBrowserDataStore } from './recoverable-browser-data';

const directories: string[] = [];
async function createDirectory() {
  const path = await mkdtemp(join(tmpdir(), 'woho-recovery-'));
  directories.push(path);
  return path;
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('openRecoverableBrowserDataStore', () => {
  it('preserves corrupt primary data and uses a separate recovery file', async () => {
    const directory = await createDirectory();
    const primaryPath = join(directory, 'browser-data.json');
    const recoveryPath = join(directory, 'browser-data-recovery.json');
    await writeFile(primaryPath, '{corrupt primary', 'utf8');
    const warn = vi.fn(async () => undefined);

    const store = await openRecoverableBrowserDataStore(
      primaryPath, recoveryPath, () => join(directory, 'browser-data-' + 'unique.json'), warn,
    );

    expect(await store.listBookmarks()).toEqual([]);
    expect(await readFile(primaryPath, 'utf8')).toBe('{corrupt primary');
    expect(await readFile(recoveryPath, 'utf8').catch(() => '')).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('preserves both bad files and selects a unique empty fallback when recovery is corrupt', async () => {
    const directory = await createDirectory();
    const primaryPath = join(directory, 'browser-data.json');
    const recoveryPath = join(directory, 'browser-data-recovery.json');
    const uniquePath = join(directory, 'browser-data-unique.json');
    await writeFile(primaryPath, '{corrupt primary', 'utf8');
    await writeFile(recoveryPath, '{corrupt recovery', 'utf8');
    const warn = vi.fn(async () => undefined);

    const store = await openRecoverableBrowserDataStore(
      primaryPath, recoveryPath, () => uniquePath, warn,
    );

    expect(await store.listHistory()).toEqual([]);
    expect(await readFile(primaryPath, 'utf8')).toBe('{corrupt primary');
    expect(await readFile(recoveryPath, 'utf8')).toBe('{corrupt recovery');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('uses the primary profile without warnings when it is valid or missing', async () => {
    const directory = await createDirectory();
    const warn = vi.fn(async () => undefined);
    const store = await openRecoverableBrowserDataStore(
      join(directory, 'browser-data.json'),
      join(directory, 'browser-data-recovery.json'),
      () => join(directory, 'browser-data-unique.json'),
      warn,
    );
    expect(await store.listBookmarks()).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
