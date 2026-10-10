import { describe, expect, it } from 'vitest';
import { shouldOpenNewTabPrivately, shouldPersistBrowsingHistory } from './privacy-policy';

describe('private browsing persistence policy', () => {
  it('persists normal browsing history', () => {
    expect(shouldPersistBrowsingHistory(false)).toBe(true);
  });

  it('never persists private browsing history', () => {
    expect(shouldPersistBrowsingHistory(true)).toBe(false);
  });
});

describe('new tab privacy inheritance', () => {
  it('keeps new tabs private when opened from a private tab', () => {
    expect(shouldOpenNewTabPrivately(true)).toBe(true);
  });

  it('opens normal tabs from normal tabs', () => {
    expect(shouldOpenNewTabPrivately(false)).toBe(false);
  });
});
