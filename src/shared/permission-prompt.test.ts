import { describe, expect, it, vi } from 'vitest';
import { getOrCreatePermissionPrompt, PermissionPromptEpoch } from './permission-prompt';

describe('getOrCreatePermissionPrompt', () => {
  it('shares one pending prompt and removes it after completion', async () => {
    const pending = new Map<string, Promise<boolean>>();
    let resolvePrompt!: (value: boolean) => void;
    const create = vi.fn(() => new Promise<boolean>((resolve) => { resolvePrompt = resolve; }));
    const first = getOrCreatePermissionPrompt(pending, 'https://example.com::media', create);
    const second = getOrCreatePermissionPrompt(pending, 'https://example.com::media', create);
    expect(create).toHaveBeenCalledTimes(0);
    await Promise.resolve();
    expect(create).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    resolvePrompt(true);
    await expect(first).resolves.toBe(true);
    expect(pending.size).toBe(0);
  });

  it('keeps different permission keys isolated', async () => {
    const pending = new Map<string, Promise<boolean>>();
    const create = vi.fn(async () => true);
    const media = getOrCreatePermissionPrompt(pending, 'https://example.com::media', create);
    const location = getOrCreatePermissionPrompt(pending, 'https://example.com::geolocation', create);
    await expect(Promise.all([media, location])).resolves.toEqual([true, true]);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('allows a fresh prompt after a rejected prompt settles', async () => {
    const pending = new Map<string, Promise<boolean>>();
    await expect(getOrCreatePermissionPrompt(pending, 'key', async () => { throw new Error('dialog failed'); })).rejects.toThrow('dialog failed');
    await expect(getOrCreatePermissionPrompt(pending, 'key', async () => true)).resolves.toBe(true);
    expect(pending.size).toBe(0);
  });
});


describe('PermissionPromptEpoch', () => {
  it('invalidates decisions captured before site data is cleared', () => {
    const epoch = new PermissionPromptEpoch();
    const pendingGeneration = epoch.capture();
    expect(epoch.isCurrent(pendingGeneration)).toBe(true);
    epoch.invalidate();
    expect(epoch.isCurrent(pendingGeneration)).toBe(false);
    expect(epoch.isCurrent(epoch.capture())).toBe(true);
  });

  it('invalidates each earlier generation when cleared repeatedly', () => {
    const epoch = new PermissionPromptEpoch();
    const first = epoch.capture();
    epoch.invalidate();
    const second = epoch.capture();
    epoch.invalidate();
    expect(epoch.isCurrent(first)).toBe(false);
    expect(epoch.isCurrent(second)).toBe(false);
  });
});
