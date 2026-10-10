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
