import { describe, expect, it, vi } from 'vitest';
import { clearSiteDataForSession } from './site-data';

describe('clearSiteDataForSession', () => {
  it('invalidates pending prompts and removes grants before clearing session storage', async () => {
    const order: string[] = [];
    const session = {
      clearStorageData: vi.fn(async () => { order.push('storage'); }),
      clearCache: vi.fn(async () => { order.push('cache'); }),
      clearAuthCache: vi.fn(async () => { order.push('auth'); }),
    };
    const decisions = new Map([['https://example.com::media', true]]);
    const epoch = { invalidate: vi.fn(() => { order.push('invalidate'); }) };

    await clearSiteDataForSession(session, decisions, epoch);

    expect(epoch.invalidate).toHaveBeenCalledOnce();
    expect(decisions.size).toBe(0);
    expect(order[0]).toBe('invalidate');
    expect(session.clearStorageData).toHaveBeenCalledOnce();
    expect(session.clearCache).toHaveBeenCalledOnce();
    expect(session.clearAuthCache).toHaveBeenCalledOnce();
    expect(order.slice(1).sort()).toEqual(['auth', 'cache', 'storage']);
  });

  it('keeps permission grants revoked when storage cleanup rejects', async () => {
    const session = {
      clearStorageData: vi.fn(async () => { throw new Error('storage unavailable'); }),
      clearCache: vi.fn(async () => undefined),
      clearAuthCache: vi.fn(async () => undefined),
    };
    const decisions = new Map([['https://example.com::geolocation', true]]);
    const epoch = { invalidate: vi.fn() };

    await expect(clearSiteDataForSession(session, decisions, epoch)).rejects.toThrow('storage unavailable');
    expect(epoch.invalidate).toHaveBeenCalledOnce();
    expect(decisions.size).toBe(0);
  });
});
