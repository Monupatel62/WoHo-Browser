import { open } from 'node:fs/promises';

const MAX_SUPPORTED_READ_BYTES = 16 * 1024 * 1024;

/**
 * Read a user-selected file without trusting a prior stat result. Reads at most
 * maxBytes + 1 bytes, so a file that grows during the read cannot cause an
 * unbounded allocation.
 */
export async function readFileBounded(filePath: string, maxBytes: number): Promise<Buffer> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > MAX_SUPPORTED_READ_BYTES) {
    throw new Error('Maximum file size must be a non-negative safe integer no greater than 16 MiB.');
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
