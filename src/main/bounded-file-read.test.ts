import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileBounded } from './bounded-file-read';

const directories: string[] = [];
async function createFile(contents: string) {
  const directory = await mkdtemp(join(tmpdir(), 'woho-bounded-read-'));
  directories.push(directory);
  const file = join(directory, 'input.json');
  await writeFile(file, contents, 'utf8');
  return file;
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('readFileBounded', () => {
  it('reads files at or below the configured byte limit', async () => {
    const file = await createFile('12345');
    await expect(readFileBounded(file, 5)).resolves.toEqual(Buffer.from('12345'));
    await expect(readFileBounded(file, 6)).resolves.toEqual(Buffer.from('12345'));
  });

  it('rejects oversized files before returning their contents', async () => {
    const file = await createFile('123456');
    await expect(readFileBounded(file, 5)).rejects.toThrow(/5-byte limit/);
  });

  it('rejects invalid limits', async () => {
    const file = await createFile('x');
    await expect(readFileBounded(file, -1)).rejects.toThrow(/non-negative safe integer/);
    await expect(readFileBounded(file, 1.5)).rejects.toThrow(/non-negative safe integer/);
    await expect(readFileBounded(file, Number.MAX_SAFE_INTEGER)).rejects.toThrow(/16 MiB/);
  });
});
