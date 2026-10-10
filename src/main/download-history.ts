import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DownloadRecord, DownloadStatus } from '../shared/browser-types';
import { safeDownloadFilename, safeDownloadUrl } from '../shared/download-policy';

const MAX_RECORDS = 100;
const MAX_FILE_BYTES = 1024 * 1024;
const STATUSES = new Set<DownloadStatus>(['waiting', 'progressing', 'paused', 'completed', 'cancelled', 'interrupted']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDownload(value: unknown): DownloadRecord {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length > 100 ||
      typeof value.filename !== 'string' || value.filename.length > 255 ||
      typeof value.url !== 'string' || typeof value.status !== 'string' || !STATUSES.has(value.status as DownloadStatus) ||
      !Number.isSafeInteger(value.receivedBytes) || (value.receivedBytes as number) < 0 ||
      !Number.isSafeInteger(value.totalBytes) || (value.totalBytes as number) < 0 ||
      typeof value.canResume !== 'boolean' || typeof value.startedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.startedAt)) ||
      (value.savePath !== undefined && (typeof value.savePath !== 'string' || value.savePath.length > 32768))) {
    throw new Error('Download history is invalid; original data was preserved.');
  }
  const url = safeDownloadUrl(value.url);
  if (!url || url !== value.url) throw new Error('Download history contains an unsafe URL; original data was preserved.');
  return {
    id: value.id,
    filename: safeDownloadFilename(value.filename),
    url,
    status: value.status as DownloadStatus,
    receivedBytes: value.receivedBytes as number,
    totalBytes: value.totalBytes as number,
    canResume: value.canResume,
    ...(typeof value.savePath === 'string' ? { savePath: value.savePath } : {}),
    startedAt: value.startedAt,
  };
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = join(directory, '.' + basename(filePath) + '.' + randomUUID() + '.tmp');
  try {
    await writeFile(temporaryPath, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

/** Bounded, local-only normal-profile download history. Private downloads must never be passed here. */
export class DownloadHistoryStore {
  private records: DownloadRecord[] = [];
  private loaded = false;
  private loading: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const metadata = await stat(this.filePath);
          if (metadata.size > MAX_FILE_BYTES) throw new Error('Download history is too large; original data was preserved.');
          const raw = await readFile(this.filePath);
          if (raw.byteLength > MAX_FILE_BYTES) throw new Error('Download history is too large; original data was preserved.');
          let parsed: unknown;
          try { parsed = JSON.parse(raw.toString('utf8')); } catch {
            throw new Error('Download history is unreadable; original data was preserved.');
          }
          if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.downloads) || parsed.downloads.length > MAX_RECORDS) {
            throw new Error('Download history structure is unsupported; original data was preserved.');
          }
          const records = parsed.downloads.map(parseDownload);
          const ids = new Set<string>();
          for (const record of records) {
            if (ids.has(record.id)) throw new Error('Download history contains duplicate IDs; original data was preserved.');
            ids.add(record.id);
          }
          this.records = records;
        } catch (error) {
          if (!isRecord(error) || error.code !== 'ENOENT') throw error;
          this.records = [];
        }
        this.loaded = true;
      })();
    }
    try { await this.loading; } catch (error) { this.loading = null; throw error; }
  }

  private persist(): Promise<void> {
    const snapshot = JSON.stringify({ version: 1, downloads: this.records }, null, 2) + '\n';
    const pending = this.writeQueue.catch(() => undefined).then(() => atomicWrite(this.filePath, snapshot));
    this.writeQueue = pending;
    return pending;
  }

  async list(): Promise<DownloadRecord[]> {
    await this.ensureLoaded();
    let changed = false;
    this.records = this.records.map((record) => {
      if (record.status === 'waiting' || record.status === 'progressing' || record.status === 'paused') {
        changed = true;
        return { ...record, status: 'interrupted', canResume: false };
      }
      return { ...record };
    });
    if (changed) await this.persist();
    return this.records.map((record) => ({ ...record }));
  }

  async upsert(record: DownloadRecord): Promise<void> {
    await this.ensureLoaded();
    const safeRecord = parseDownload(record);
    const existing = this.records.findIndex((item) => item.id === safeRecord.id);
    if (existing >= 0) this.records.splice(existing, 1);
    this.records.unshift({ ...safeRecord });
    this.records = this.records.slice(0, MAX_RECORDS);
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    await this.ensureLoaded();
    const next = this.records.filter((record) => record.id !== id);
    if (next.length === this.records.length) return;
    this.records = next;
    await this.persist();
  }
}
