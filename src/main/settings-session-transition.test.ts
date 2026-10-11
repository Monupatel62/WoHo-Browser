import { describe, expect, it, vi } from 'vitest';
import { saveSettingsAfterSessionPolicy } from './settings-session-transition';

describe('saveSettingsAfterSessionPolicy', () => {
  it('clears persisted tab URLs before saving restoreSession=false', async () => {
    const order: string[] = [];
    const next = { restoreSession: false, theme: 'dark' };
    const clear = vi.fn(async () => { order.push('clear'); });
    const save = vi.fn(async () => { order.push('save'); return next; });

    await expect(saveSettingsAfterSessionPolicy(next, clear, save)).resolves.toEqual(next);
    expect(order).toEqual(['clear', 'save']);
  });

  it('does not persist disabled settings if sensitive session clearing fails', async () => {
    const next = { restoreSession: false };
    const clear = vi.fn(async () => { throw new Error('disk write failed'); });
    const save = vi.fn(async () => next);

    await expect(saveSettingsAfterSessionPolicy(next, clear, save)).rejects.toThrow('disk write failed');
    expect(save).not.toHaveBeenCalled();
  });

  it('does not clear session URLs when restore remains enabled', async () => {
    const next = { restoreSession: true };
    const clear = vi.fn(async () => undefined);
    const save = vi.fn(async () => next);

    await expect(saveSettingsAfterSessionPolicy(next, clear, save)).resolves.toEqual(next);
    expect(clear).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledOnce();
  });
});
