import test from 'node:test';
import assert from 'node:assert/strict';
import { exportBookmarkData, parseBookmarkImport, MAX_BOOKMARKS } from '../public/bookmarks.mjs';
const wrap = (bookmarks) => JSON.stringify({ format: 'woho-bookmarks', version: 1, bookmarks });

test('round-trips valid HTTP and HTTPS bookmarks', () => {
  const bookmarks = [{ title: 'Example', url: 'https://example.com/' }, { title: 'Docs', url: 'http://docs.example.com/path' }];
  assert.deepEqual(parseBookmarkImport(exportBookmarkData(bookmarks)), bookmarks);
});
test('rejects malformed JSON and unknown formats', () => {
  assert.throws(() => parseBookmarkImport('{'), /valid JSON/);
  assert.throws(() => parseBookmarkImport(JSON.stringify({ format: 'other', version: 1, bookmarks: [] })), /Unsupported bookmark format/);
});
test('rejects script, file, credential-bearing, and malformed URLs', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'https://user:pass@example.com/', 'not a url']) {
    assert.throws(() => parseBookmarkImport(wrap([{ title: 'bad', url }])), /HTTP and HTTPS/);
  }
});
test('bounds file bytes, entry count, title, and URL length', () => {
  assert.throws(() => parseBookmarkImport(' '.repeat(1024 * 1024 + 1)), /1 MiB/);
  const tooMany = Array.from({ length: MAX_BOOKMARKS + 1 }, (_, i) => ({ title: String(i), url: 'https://e' + i + '.example' }));
  assert.throws(() => parseBookmarkImport(wrap(tooMany)), /5,000/);
  assert.throws(() => parseBookmarkImport(wrap([{ title: 'x'.repeat(513), url: 'https://example.com' }])), /title/);
  assert.throws(() => parseBookmarkImport(wrap([{ title: 'x', url: 'https://example.com/' + 'a'.repeat(4100) }])), /HTTP and HTTPS/);
});
test('deduplicates exact URLs and treats titles as plain text', () => {
  const items = parseBookmarkImport(wrap([{ title: '<img src=x onerror=alert(1)>', url: 'https://example.com/' }, { title: 'duplicate', url: 'https://example.com/' }]));
  assert.equal(items.length, 1);
  assert.equal(items[0].title, '<img src=x onerror=alert(1)>');
});
