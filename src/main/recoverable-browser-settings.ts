import { BrowserSettingsStore } from './browser-settings';
import type { BrowserSettings } from '../shared/browser-settings';

export type SettingsRecoveryWarning = (title: string, message: string, detail: string) => Promise<void>;

/** Preserve corrupt settings files and use a separate file for future settings writes. */
export async function openRecoverableBrowserSettingsStore(
  primaryPath: string,
  recoveryPath: string,
  uniqueRecoveryPath: () => string,
  warn: SettingsRecoveryWarning,
): Promise<BrowserSettingsStore> {
  const primary = new BrowserSettingsStore(primaryPath);
  try {
    await primary.load();
    return primary;
  } catch (error) {
    await warn(
      'Browser settings could not be loaded',
      'WoHo Browser will use a separate settings file. The original settings file has not been overwritten.',
      error instanceof Error ? error.message : 'Unknown settings error.',
    );
  }

  const recovery = new BrowserSettingsStore(recoveryPath);
  try {
    await recovery.load();
    return recovery;
  } catch (error) {
    await warn(
      'Recovery settings unavailable',
      'The recovery settings file is also unreadable. WoHo Browser will use a new separate settings file; both existing files will be preserved.',
      error instanceof Error ? error.message : 'Unknown recovery settings error.',
    );
  }

  const fallback = new BrowserSettingsStore(uniqueRecoveryPath());
  await fallback.load();
  return fallback;
}

export async function readSettingsOrDefault(store: BrowserSettingsStore): Promise<BrowserSettings> {
  return store.get();
}
