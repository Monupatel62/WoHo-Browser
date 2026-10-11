import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isTrustedRendererUrl } from './trusted-renderer';

describe('isTrustedRendererUrl', () => {
  const expectedPath = resolve('/app/out/renderer/index.html');
  const expectedUrl = pathToFileURL(expectedPath).href;

  it('accepts only the exact packaged renderer file', () => {
    expect(isTrustedRendererUrl(expectedUrl, undefined, expectedPath)).toBe(true);
    expect(isTrustedRendererUrl(pathToFileURL('/attacker/out/renderer/index.html').href, undefined, expectedPath)).toBe(false);
    expect(isTrustedRendererUrl(expectedUrl + '?unexpected=1', undefined, expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('https://example.com/out/renderer/index.html', undefined, expectedPath)).toBe(false);
  });

  it('accepts only the bundled custom-protocol entry point', () => {
    expect(isTrustedRendererUrl('woho://browser/index.html', undefined, expectedPath)).toBe(true);
    expect(isTrustedRendererUrl('woho://browser/other.html', undefined, expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('woho://attacker/index.html', undefined, expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('woho://browser/index.html?x=1', undefined, expectedPath)).toBe(false);
  });

  it('requires the configured dev origin and path', () => {
    expect(isTrustedRendererUrl('http://localhost:5173/', 'http://localhost:5173/', expectedPath)).toBe(true);
    expect(isTrustedRendererUrl('http://evil.test/', 'http://localhost:5173/', expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('http://localhost:5173/other', 'http://localhost:5173/', expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('http://localhost:5173/?unexpected=1', 'http://localhost:5173/', expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('http://localhost:5173/#unexpected', 'http://localhost:5173/', expectedPath)).toBe(false);
    expect(isTrustedRendererUrl('http://user@localhost:5173/', 'http://localhost:5173/', expectedPath)).toBe(false);
  });
});
