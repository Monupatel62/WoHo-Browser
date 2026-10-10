import { open } from 'node:fs/promises';

/**
 * Read a user-selected file without trusting a prior stat result. Reads at most
 * maxBytes + 1 bytes, so a file that grows during the read cannot cause an
 * unbounded allocation.
 */
export async function readFileBounded(filePath: string, maxBytes: number): Promise<Buffer> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new Error('Maximum file size must be a non-negative safe integer.');
  }
  const handle = await open(filePath, 'r');
  try {
    const metadata = await handle.stat();
    if (metadata.size > maxBytes) throw new Error(`File exceeds the ${maxBytes}-byte limit.`);
    const buffer = Buffer.alloc(maxBytes + 1);
    let offset = 0;
    while (offset < buffer.byteLength) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.byteLength - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > maxBytes) throw new Error(`File exceeds the ${maxBytes}-byte limit.`);
    return buffer.subarray(0, offset);
  } finally {
    await handle.close();
  }
}
