/** Ensure sensitive saved tab URLs are durably cleared before persisting restoreSession=false. */
export async function saveSettingsAfterSessionPolicy<T extends { restoreSession: boolean }>(
  next: T,
  clearSavedSession: () => Promise<unknown>,
  saveSettings: () => Promise<T>,
): Promise<T> {
  if (!next.restoreSession) await clearSavedSession();
  return saveSettings();
}
