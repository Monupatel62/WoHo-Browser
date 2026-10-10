import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isTrustedIpcSender } from './ipc-security';

describe('isTrustedIpcSender', () => {
  const expectedRendererPath = resolve('/app/out/renderer/index.html');
  const sender = {};
  const mainFrame = {};
  const subFrame = {};
  const trusted = {
    expectedSender: sender,
    sender,
    senderFrame: mainFrame,
    mainFrame,
    senderUrl: pathToFileURL(expectedRendererPath).href,
    expectedRendererPath,
  };

  it('accepts the trusted chrome main frame only', () => {
    expect(isTrustedIpcSender(trusted)).toBe(true);
  });

  it('rejects another WebContents even when its URL looks trusted', () => {
    expect(isTrustedIpcSender({ ...trusted, sender: {} })).toBe(false);
  });

  it('rejects subframes and detached frame references', () => {
    expect(isTrustedIpcSender({ ...trusted, senderFrame: subFrame })).toBe(false);
    expect(isTrustedIpcSender({ ...trusted, senderFrame: null })).toBe(false);
  });

  it('rejects missing expected sender and untrusted renderer URLs', () => {
    expect(isTrustedIpcSender({ ...trusted, expectedSender: null })).toBe(false);
    expect(isTrustedIpcSender({ ...trusted, senderUrl: 'https://evil.example/' })).toBe(false);
  });

  it('accepts only the configured development renderer path', () => {
    expect(isTrustedIpcSender({
      ...trusted,
      senderUrl: 'http://localhost:5173/',
      devRendererUrl: 'http://localhost:5173/',
    })).toBe(true);
    expect(isTrustedIpcSender({
      ...trusted,
      senderUrl: 'http://localhost:5173/attacker',
      devRendererUrl: 'http://localhost:5173/',
    })).toBe(false);
  });
});
