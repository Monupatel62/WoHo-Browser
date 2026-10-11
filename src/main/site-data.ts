export interface ClearableSiteDataSession {
  clearStorageData(): Promise<void>;
  clearCache(): Promise<void>;
  clearAuthCache(): Promise<void>;
}

export interface InvalidatablePermissionPrompts {
  invalidate(): void;
}

/** Revoke session grants before awaiting storage deletion, so late prompts cannot restore them. */
export async function clearSiteDataForSession(
  targetSession: ClearableSiteDataSession,
  decisions: Map<string, boolean>,
  promptEpoch: InvalidatablePermissionPrompts,
): Promise<void> {
  promptEpoch.invalidate();
  decisions.clear();
  await Promise.all([
    targetSession.clearStorageData(),
    targetSession.clearCache(),
    targetSession.clearAuthCache(),
  ]);
}
