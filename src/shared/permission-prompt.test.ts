import { describe, expect, it, vi } from 'vitest';
import { getOrCreatePermissionPrompt, PermissionPromptEpoch, runPermissionPromptForEpoch } from './permission-prompt';

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


describe('runPermissionPromptForEpoch', () => {
  it('denies a late Allow result after site data clear invalidates the prompt', async () => {
    const epoch = new PermissionPromptEpoch();
    const captured = epoch.capture();
    let resolveDialog!: (allowed: boolean) => void;
    const dialog = vi.fn(() => new Promise<boolean>((resolve) => { resolveDialog = resolve; }));
    const pending = runPermissionPromptForEpoch(epoch, captured, dialog);
    expect(dialog).toHaveBeenCalledTimes(1);
    epoch.invalidate();
    resolveDialog(true);
    await expect(pending).resolves.toBe(false);
  });

  it('does not open a dialog when its captured generation is already stale', async () => {
    const epoch = new PermissionPromptEpoch();
    const captured = epoch.capture();
    epoch.invalidate();
    const dialog = vi.fn(async () => true);
    await expect(runPermissionPromptForEpoch(epoch, captured, dialog)).resolves.toBe(false);
    expect(dialog).not.toHaveBeenCalled();
  });
});
