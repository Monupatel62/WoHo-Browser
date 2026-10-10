import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isSafeWebUrl } from '../shared/navigation';

export interface BookmarkRecord {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryRecord {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
}

interface PersistedBrowserData {
  version: 1;
  bookmarks: BookmarkRecord[];
  history: HistoryRecord[];
}

const DATA_VERSION = 1 as const;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BOOKMARKS = 500;
const MAX_HISTORY = 500;
const MAX_TITLE_LENGTH = 512;
const MAX_URL_LENGTH = 2048;

function safeTitle(value: string): string {
  return value.trim().slice(0, MAX_TITLE_LENGTH) || 'Untitled';
}

function validateUrl(value: string): string {
  if (value.length > MAX_URL_LENGTH) {
    throw new Error('Only valid HTTP and HTTPS URLs can be saved.');
  }
  let url: URL;
  try { url = new URL(value); } catch {
    throw new Error('Only valid HTTP and HTTPS URLs can be saved.');
  }
  if (url.username || url.password) {
    throw new Error('URLs containing embedded credentials cannot be saved.');
  }
  if (!isSafeWebUrl(value)) throw new Error('Only valid HTTP and HTTPS URLs can be saved.');
  return url.toString();
}

function sanitizeHistoryUrl(value: string): string {
  const url = new URL(value);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRecord<T extends BookmarkRecord | HistoryRecord>(
  value: unknown,
  kind: 'bookmark' | 'history',
): T {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 100 ||
      typeof value.title !== 'string' || value.title.length > MAX_TITLE_LENGTH ||
      typeof value.url !== 'string' || typeof (kind === 'bookmark' ? value.createdAt : value.visitedAt) !== 'string') {
    throw new Error('Browser data file contains an invalid record; original data was preserved.');
  }
  const url = validateUrl(value.url);
  const dateField = kind === 'bookmark' ? 'createdAt' : 'visitedAt';
  const timestamp = value[dateField];
  if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) {
    throw new Error('Browser data file contains an invalid timestamp; original data was preserved.');
  }
  if (kind === 'bookmark') {
    if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) {
      throw new Error('Browser data file contains an invalid bookmark timestamp; original data was preserved.');
    }
    return { id: value.id, title: safeTitle(value.title), url, createdAt: value.createdAt, updatedAt: value.updatedAt } as T;
  }
  return { id: value.id, title: safeTitle(value.title), url: sanitizeHistoryUrl(url), visitedAt: value.visitedAt } as T;
}

function parseData(raw: string): { data: PersistedBrowserData; historyRedacted: boolean } {
  let value: unknown;
  try { value = JSON.parse(raw); } catch {
    throw new Error('Browser data file is unreadable JSON; original data was preserved.');
  }
  if (!isRecord(value) || value.version !== DATA_VERSION || !Array.isArray(value.bookmarks) || !Array.isArray(value.history)) {
    throw new Error('Browser data version or structure is unsupported; original data was preserved.');
  }
  if (value.bookmarks.length > MAX_BOOKMARKS || value.history.length > MAX_HISTORY) {
    throw new Error('Browser data exceeds supported record limits; original data was preserved.');
  }
  const bookmarks = value.bookmarks.map((row) => parseRecord<BookmarkRecord>(row, 'bookmark'));
  const history = value.history.map((row) => parseRecord<HistoryRecord>(row, 'history'));
  const ids = new Set<string>();
  for (const bookmark of bookmarks) {
    if (ids.has(bookmark.id)) throw new Error('Browser data contains duplicate bookmark IDs; original data was preserved.');
    ids.add(bookmark.id);
  }
  const historyIds = new Set<string>();
  for (const entry of history) {
    if (historyIds.has(entry.id)) throw new Error('Browser data contains duplicate history IDs; original data was preserved.');
    historyIds.add(entry.id);
  }
  const historyRedacted = value.history.some((row, index) => isRecord(row) && typeof row.url === 'string' && row.url !== history[index]?.url);
  return { data: { version: DATA_VERSION, bookmarks, history }, historyRedacted };
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
  const tempPath = join(directory, '.' + basename(filePath) + '.' + randomUUID() + '.tmp');
  try {
    await writeFile(tempPath, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

/** Versioned local JSON storage. Corrupt/unknown data is never silently overwritten. */
export class BrowserDataStore {
  private data: PersistedBrowserData = { version: DATA_VERSION, bookmarks: [], history: [] };
  private loaded = false;
  private loading: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loading) {
      this.loading = (async () => {
        let raw: Buffer;
        try {
          const metadata = await stat(this.filePath);
          if (metadata.size > MAX_FILE_BYTES) {
            throw new Error('Browser data file is too large; original data was preserved.');
          }
          raw = await readFile(this.filePath);
        } catch (error) {
          if (isRecord(error) && error.code === 'ENOENT') {
            this.data = { version: DATA_VERSION, bookmarks: [], history: [] };
            this.loaded = true;
            return;
          }
          throw error;
        }
        if (raw.byteLength > MAX_FILE_BYTES) {
          throw new Error('Browser data file is too large; original data was preserved.');
        }
        const parsed = parseData(raw.toString('utf8'));
        this.data = parsed.data;
        if (parsed.historyRedacted) {
          // Keep migration writes outside the missing-source-file catch: a failed
          // migration must reject loading instead of silently looking like no data.
          await atomicWrite(this.filePath, JSON.stringify(this.data, null, 2) + '\n');
        }
        this.loaded = true;
      })();
    }
    try {
      await this.loading;
    } catch (error) {
      this.loading = null;
      throw error;
    }
  }

  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data, null, 2) + '\n';
    const pendingWrite = this.writeQueue.catch(() => undefined).then(() => atomicWrite(this.filePath, snapshot));
    this.writeQueue = pendingWrite;
    return pendingWrite;
  }

  async listBookmarks(): Promise<BookmarkRecord[]> {
    await this.ensureLoaded();
    return this.data.bookmarks.map((item) => ({ ...item }));
  }

  async addBookmark(title: string, rawUrl: string): Promise<BookmarkRecord[]> {
    await this.ensureLoaded();
    const url = validateUrl(rawUrl);
    const now = new Date().toISOString();
    const existing = this.data.bookmarks.find((item) => item.url === url);
    if (existing) {
      existing.title = safeTitle(title);
      existing.updatedAt = now;
    } else {
      if (this.data.bookmarks.length >= MAX_BOOKMARKS) throw new Error('Bookmark limit reached.');
      this.data.bookmarks.unshift({ id: randomUUID(), title: safeTitle(title), url, createdAt: now, updatedAt: now });
    }
    await this.persist();
    return this.listBookmarks();
  }

  async removeBookmark(id: string): Promise<BookmarkRecord[]> {
    await this.ensureLoaded();
    this.data.bookmarks = this.data.bookmarks.filter((item) => item.id !== id);
    await this.persist();
    return this.listBookmarks();
  }

  async listHistory(): Promise<HistoryRecord[]> {
    await this.ensureLoaded();
    return this.data.history.map((item) => ({ ...item }));
  }

  async recordVisit(rawUrl: string, title: string): Promise<void> {
    await this.ensureLoaded();
    let url: string;
    try { url = sanitizeHistoryUrl(validateUrl(rawUrl)); } catch { return; }
    const last = this.data.history[0];
    if (last?.url === url && Date.now() - Date.parse(last.visitedAt) < 1500) return;
    this.data.history.unshift({ id: randomUUID(), title: safeTitle(title), url, visitedAt: new Date().toISOString() });
    this.data.history = this.data.history.slice(0, MAX_HISTORY);
    await this.persist();
  }

  async removeHistory(id: string): Promise<HistoryRecord[]> {
    await this.ensureLoaded();
    this.data.history = this.data.history.filter((item) => item.id !== id);
    await this.persist();
    return this.listHistory();
  }

  async clearHistory(): Promise<void> {
    await this.ensureLoaded();
    this.data.history = [];
    await this.persist();
  }
}
