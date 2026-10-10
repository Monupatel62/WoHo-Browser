import { BrowserSessionStore } from './browser-session-store';

export type SessionRecoveryWarning = (title: string, message: string, detail: string) => Promise<void>;

/** Preserve corrupt session files and use a separate store for future snapshots. */
export async function openRecoverableBrowserSessionStore(
  primaryPath: string,
  recoveryPath: string,
  uniqueRecoveryPath: () => string,
  warn: SessionRecoveryWarning,
): Promise<BrowserSessionStore> {
  const primary = new BrowserSessionStore(primaryPath);
  try {
    await primary.load();
    return primary;
  } catch (error) {
    await warn(
      'Saved tabs could not be loaded',
      'WoHo Browser will not restore from the unreadable session file. The original file has not been overwritten.',
      error instanceof Error ? error.message : 'Unknown session error.',
    );
  }

  const recovery = new BrowserSessionStore(recoveryPath);
  try {
    await recovery.load();
    return recovery;
  } catch (error) {
    await warn(
      'Recovery session unavailable',
      'The recovery session file is also unreadable. WoHo Browser will start without restored tabs and preserve both files.',
      error instanceof Error ? error.message : 'Unknown recovery session error.',
    );
  }

  const fallback = new BrowserSessionStore(uniqueRecoveryPath());
  await fallback.load();
  return fallback;
}
