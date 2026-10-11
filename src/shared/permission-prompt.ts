/** Reuse one in-flight permission prompt per session/origin/capability key. */
export function getOrCreatePermissionPrompt<T>(
  pending: Map<string, Promise<T>>,
  key: string,
  create: () => Promise<T>,
): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing;
  const prompt = Promise.resolve()
    .then(create)
    .finally(() => {
      if (pending.get(key) === prompt) pending.delete(key);
    });
  pending.set(key, prompt);
  return prompt;
}


/** Invalidates in-flight permission decisions when the user clears site data. */
export class PermissionPromptEpoch {
  private generation = 0;

  capture(): number {
    return this.generation;
  }

  invalidate(): void {
    this.generation += 1;
  }

  isCurrent(capturedGeneration: number): boolean {
    return capturedGeneration === this.generation;
  }
}

/** Return false when a native prompt resolves after its session generation changed. */
export async function runPermissionPromptForEpoch(
  epoch: PermissionPromptEpoch,
  capturedGeneration: number,
  create: () => Promise<boolean>,
): Promise<boolean> {
  if (!epoch.isCurrent(capturedGeneration)) return false;
  const allowed = await create();
  return epoch.isCurrent(capturedGeneration) ? allowed : false;
}
