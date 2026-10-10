import { BrowserDataStore } from './browser-data';

export type RecoveryWarning = (title: string, message: string, detail: string) => Promise<void>;

/**
 * Load the primary profile data without overwriting a corrupt source file.
 * If it cannot be read, warn the user and use a separate recovery file.
 */
export async function openRecoverableBrowserDataStore(
  primaryPath: string,
  recoveryPath: string,
  uniqueRecoveryPath: () => string,
  warn: RecoveryWarning,
): Promise<BrowserDataStore> {
  const primary = new BrowserDataStore(primaryPath);
  try {
    await primary.listBookmarks();
    return primary;
  } catch (error) {
    await warn(
      'Browser data could not be loaded',
      'WoHo Browser will use a separate recovery data file. The original browser data file has not been overwritten.',
      error instanceof Error ? error.message : 'Unknown browser data error.',
    );
  }

  const recovery = new BrowserDataStore(recoveryPath);
  try {
    await recovery.listBookmarks();
    return recovery;
  } catch (error) {
    await warn(
      'Recovery browser data unavailable',
      'The recovery data file is also unreadable. WoHo Browser will start with a new, separate data file; existing files will be preserved.',
      error instanceof Error ? error.message : 'Unknown recovery data error.',
    );
  }

  const fallback = new BrowserDataStore(uniqueRecoveryPath());
  await fallback.listBookmarks();
  return fallback;
}
