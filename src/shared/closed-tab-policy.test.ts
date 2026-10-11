import { describe, expect, it } from 'vitest';
import { rememberClosedTab, takeRecentlyClosedTab, MAX_RECENTLY_CLOSED_TABS } from './closed-tab-policy';

describe('recently closed tab policy', () => {
  it('remembers only safe normal HTTP(S) tabs in newest-first order', () => {
    const first = rememberClosedTab([], 'https://example.com/one', false);
    const second = rememberClosedTab(first, 'https://example.com/two', false);
    expect(second).toEqual(['https://example.com/two', 'https://example.com/one']);
  });

  it('never remembers private, non-web, credentialed, or oversized URLs', () => {
    expect(rememberClosedTab([], 'https://private.example/', true)).toEqual([]);
    expect(rememberClosedTab([], 'file:///C:/secret.txt', false)).toEqual([]);
    expect(rememberClosedTab([], 'https://user:pass@example.com/', false)).toEqual([]);
    expect(rememberClosedTab([], 'https://example.com/' + 'a'.repeat(5000), false)).toEqual([]);
  });

  it('moves a reopened duplicate to the top and caps the list', () => {
    let items: string[] = [];
    for (let i = 0; i < MAX_RECENTLY_CLOSED_TABS + 3; i++) {
      items = rememberClosedTab(items, 'https://example.com/' + i, false);
    }
    expect(items).toHaveLength(MAX_RECENTLY_CLOSED_TABS);
    items = rememberClosedTab(items, 'https://example.com/5', false);
    expect(items[0]).toBe('https://example.com/5');
    expect(items).toHaveLength(MAX_RECENTLY_CLOSED_TABS);
  });

  it('pops newest first and returns empty when no tab was closed', () => {
    expect(takeRecentlyClosedTab(['https://example.com/two', 'https://example.com/one'])).toEqual({
      url: 'https://example.com/two', remaining: ['https://example.com/one'],
    });
    expect(takeRecentlyClosedTab([])).toEqual({ url: null, remaining: [] });
  });
});
