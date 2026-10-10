import { describe, expect, it } from 'vitest';
import { isAllowedNavigationTarget, resolveAddressInput } from './navigation';

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
  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'chrome://settings'])(
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
    expect(isAllowedNavigationTarget('file:///tmp/a')).toBe(false);
    expect(isAllowedNavigationTarget('javascript:alert(1)')).toBe(false);
  });
});
