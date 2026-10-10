import { stat } from 'node:fs/promises';
import { atomicWriteFile } from './browser-data';
import { readFileBounded } from './bounded-file-read';
import { isSafeWebUrl } from '../shared/navigation';

const SESSION_VERSION = 1;
const MAX_SESSION_TABS = 50;
const MAX_SESSION_FILE_BYTES = 256 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateSessionUrls(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_SESSION_TABS) {
    throw new Error('Saved session contains an unsupported number of tabs; original data was preserved.');
  }
  const urls = value.map((item) => {
    if (typeof item !== 'string' || item.length > 4096 || !isSafeWebUrl(item)) {
      throw new Error('Saved session contains an unsafe URL; original data was preserved.');
    }
    return new URL(item).toString();
  });
  return urls;
}

/** Stores only explicit HTTP(S) tab URLs; callers must exclude private tabs. */
export class BrowserSessionStore {
  private urls: string[] = [];
  private loaded = false;
  private loading: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async load(): Promise<string[]> {
    if (this.loaded) return [...this.urls];
    if (!this.loading) {
      this.loading = (async () => {
        let raw: Buffer;
        try {
          const metadata = await stat(this.filePath);
          if (metadata.size > MAX_SESSION_FILE_BYTES) {
            throw new Error('Saved session file exceeds the supported size; original data was preserved.');
          }
          raw = await readFileBounded(this.filePath, MAX_SESSION_FILE_BYTES);
        } catch (error) {
          if (isRecord(error) && error.code === 'ENOENT') {
            this.urls = [];
            this.loaded = true;
            return;
          }
          throw error;
        }
        let parsed: unknown;
        try { parsed = JSON.parse(raw.toString('utf8')); } catch {
          throw new Error('Saved session file is unreadable; original data was preserved.');
        }
        if (!isRecord(parsed) || parsed.version !== SESSION_VERSION) {
          throw new Error('Saved session structure is unsupported; original data was preserved.');
        }
        this.urls = validateSessionUrls(parsed.urls);
        this.loaded = true;
      })();
    }
    try {
      await this.loading;
      return [...this.urls];
    } catch (error) {
      this.loading = null;
      throw error;
    }
  }

  async save(urls: string[]): Promise<string[]> {
    if (!this.loaded) await this.load();
    const next = validateSessionUrls(urls);
    const snapshot = JSON.stringify({ version: SESSION_VERSION, urls: next }, null, 2) + '\n';
    const pending = this.writeQueue.catch(() => undefined).then(() => atomicWriteFile(this.filePath, snapshot));
    this.writeQueue = pending;
    await pending;
    this.urls = next;
    this.loaded = true;
    return [...this.urls];
  }
}
