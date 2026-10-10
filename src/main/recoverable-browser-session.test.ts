import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRecoverableBrowserSessionStore } from './recoverable-browser-session';

const directories: string[] = [];
async function createDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'woho-session-recovery-'));
  directories.push(directory);
  return directory;
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('openRecoverableBrowserSessionStore', () => {
  it('preserves corrupt primary session state and uses a separate recovery file', async () => {
    const directory = await createDirectory();
    const primary = join(directory, 'session.json');
    const recovery = join(directory, 'session-recovery.json');
    await writeFile(primary, '{corrupt', 'utf8');
    const warn = vi.fn(async () => undefined);
    const store = await openRecoverableBrowserSessionStore(primary, recovery, () => join(directory, 'session-unique.json'), warn);
    expect(await store.load()).toEqual([]);
    expect(await readFile(primary, 'utf8')).toBe('{corrupt');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
