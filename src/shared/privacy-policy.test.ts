import { describe, expect, it } from 'vitest';
import { shouldPersistBrowsingHistory } from './privacy-policy';

describe('private browsing persistence policy', () => {
  it('persists normal browsing history', () => {
    expect(shouldPersistBrowsingHistory(false)).toBe(true);
  });

  it('never persists private browsing history', () => {
    expect(shouldPersistBrowsingHistory(true)).toBe(false);
  });
});
