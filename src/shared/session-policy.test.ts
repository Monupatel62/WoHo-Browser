import { describe, expect, it } from 'vitest';
import { selectRestorableTabUrls } from './session-policy';

describe('selectRestorableTabUrls', () => {
  it('excludes private tabs, unsupported schemes, credentials, and empty URLs', () => {
    expect(selectRestorableTabUrls([
      { url: 'https://normal.example/path', isPrivate: false },
      { url: 'https://private.example/', isPrivate: true },
      { url: 'file:///private.txt', isPrivate: false },
      { url: 'https://user:secret@example.com/', isPrivate: false },
      { url: '', isPrivate: false },
    ])).toEqual(['https://normal.example/path']);
  });

  it('keeps the most recent 50 safe normal tabs in their existing order', () => {
    const tabs = Array.from({ length: 55 }, (_, index) => ({
      url: `https://example${index}.com/`, isPrivate: false,
    }));
    const urls = selectRestorableTabUrls(tabs);
    expect(urls).toHaveLength(50);
    expect(urls[0]).toBe('https://example5.com/');
    expect(urls[49]).toBe('https://example54.com/');
  });
});
