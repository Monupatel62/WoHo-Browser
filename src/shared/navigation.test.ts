import { describe, expect, it } from 'vitest';
import { isAllowedFrameNavigationTarget, isAllowedNavigationTarget, isSafeContextMenuLink, resolveAddressInput } from './navigation';

describe('resolveAddressInput', () => {
  it('uses HTTPS for a bare hostname', () => {
    expect(resolveAddressInput('example.com')).toBe('https://example.com/');
  });
  it('preserves explicit HTTP URLs', () => {
    expect(resolveAddressInput('http://example.com')).toBe('http://example.com/');
  });
  it('supports localhost and hostnames with ports', () => {
    expect(resolveAddressInput('localhost:5173')).toBe('https://localhost:5173/');
    expect(resolveAddressInput('example.com:8443/path')).toBe('https://example.com:8443/path');
  });
  it('turns text into a search query', () => {
    expect(resolveAddressInput('hello world')).toBe('https://www.google.com/search?q=hello%20world');
  });
  it('uses the configured search provider prefix without changing URL navigation', () => {
    expect(resolveAddressInput('hello world', 'https://www.bing.com/search?q=')).toBe('https://www.bing.com/search?q=hello%20world');
    expect(resolveAddressInput('cats & dogs', 'https://duckduckgo.com/?q=')).toBe('https://duckduckgo.com/?q=cats%20%26%20dogs');
    expect(resolveAddressInput('https://example.com/path', 'https://www.bing.com/search?q=')).toBe('https://example.com/path');
  });
  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'chrome://settings', 'https://user:secret@example.com'])(
    'blocks unsafe scheme: %s',
    (value) => expect(() => resolveAddressInput(value)).toThrow(),
  );
  it('rejects unsupported schemes', () => {
    expect(() => resolveAddressInput('ftp://example.com')).toThrow(/HTTP and HTTPS/);
  });
  it('rejects empty input', () => {
    expect(() => resolveAddressInput('  ')).toThrow(/Enter a website address/);
  });
});

describe('isAllowedNavigationTarget', () => {
  it('allows only HTTP and HTTPS', () => {
    expect(isAllowedNavigationTarget('https://example.com')).toBe(true);
    expect(isAllowedNavigationTarget('http://example.com')).toBe(true);
    expect(isAllowedNavigationTarget('https://user:secret@example.com')).toBe(false);
    expect(isAllowedNavigationTarget('file:///tmp/a')).toBe(false);
    expect(isAllowedNavigationTarget('javascript:alert(1)')).toBe(false);
  });
});


describe('isSafeContextMenuLink', () => {
  it('allows bounded HTTP(S) links only', () => {
    expect(isSafeContextMenuLink('https://example.com/path')).toBe(true);
    expect(isSafeContextMenuLink('http://example.com/path')).toBe(true);
    expect(isSafeContextMenuLink('javascript:alert(1)')).toBe(false);
    expect(isSafeContextMenuLink('https://user:secret@example.com/')).toBe(false);
    expect(isSafeContextMenuLink('https://example.com/' + 'x'.repeat(4100))).toBe(false);
  });
});

describe('isAllowedFrameNavigationTarget', () => {
  it('allows web URLs and inherited-origin frame documents', () => {
    expect(isAllowedFrameNavigationTarget('https://example.com/frame')).toBe(true);
    expect(isAllowedFrameNavigationTarget('http://example.com/frame')).toBe(true);
    expect(isAllowedFrameNavigationTarget('about:blank')).toBe(true);
    expect(isAllowedFrameNavigationTarget('about:srcdoc')).toBe(true);
    expect(isAllowedFrameNavigationTarget('blob:https://example.com/1234')).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///C:/Windows/win.ini',
    'ftp://example.com/file',
    'blob:file:///private.txt',
    'about:blank?unexpected=1',
  ])('blocks unsafe frame URL: %s', (url) => {
    expect(isAllowedFrameNavigationTarget(url)).toBe(false);
  });
});
