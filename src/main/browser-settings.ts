import { stat } from 'node:fs/promises';
import { atomicWriteFile } from './browser-data';
import { readFileBounded } from './bounded-file-read';
import {
  DEFAULT_BROWSER_SETTINGS,
  validateBrowserSettings,
  type BrowserSettings,
} from '../shared/browser-settings';

const SETTINGS_VERSION = 1;
const MAX_SETTINGS_BYTES = 16 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class BrowserSettingsStore {
  private settings: BrowserSettings = { ...DEFAULT_BROWSER_SETTINGS };
  private loaded = false;
  private loading: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async load(): Promise<BrowserSettings> {
    if (this.loaded) return { ...this.settings };
    if (!this.loading) {
      this.loading = (async () => {
        let raw: Buffer;
        try {
          const metadata = await stat(this.filePath);
          if (metadata.size > MAX_SETTINGS_BYTES) {
            throw new Error('Browser settings file exceeds the supported size; original data was preserved.');
          }
          raw = await readFileBounded(this.filePath, MAX_SETTINGS_BYTES);
        } catch (error) {
          if (isRecord(error) && error.code === 'ENOENT') {
            this.settings = { ...DEFAULT_BROWSER_SETTINGS };
            this.loaded = true;
            return;
          }
          throw error;
        }
        let parsed: unknown;
        try { parsed = JSON.parse(raw.toString('utf8')); } catch {
          throw new Error('Browser settings file is unreadable; original data was preserved.');
        }
        if (!isRecord(parsed) || parsed.version !== SETTINGS_VERSION || !isRecord(parsed.settings)) {
          throw new Error('Browser settings structure is unsupported; original data was preserved.');
        }
        this.settings = validateBrowserSettings(parsed.settings);
        this.loaded = true;
      })();
    }
    try {
      await this.loading;
      return { ...this.settings };
    } catch (error) {
      this.loading = null;
      throw error;
    }
  }

  async get(): Promise<BrowserSettings> {
    return this.load();
  }

  async update(candidate: unknown): Promise<BrowserSettings> {
    if (!this.loaded) await this.load();
    const next = validateBrowserSettings(candidate);
    const snapshot = JSON.stringify({ version: SETTINGS_VERSION, settings: next }, null, 2) + '\n';
    const pending = this.writeQueue.catch(() => undefined).then(() => atomicWriteFile(this.filePath, snapshot));
    this.writeQueue = pending;
    await pending;
    this.settings = next;
    return { ...this.settings };
  }

  async reset(): Promise<BrowserSettings> {
    return this.update(DEFAULT_BROWSER_SETTINGS);
  }
}
