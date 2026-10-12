import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Accept only the configured dev renderer or the exact packaged renderer file. */
export function isTrustedRendererUrl(value: string, devRendererUrl: string | undefined, expectedFilePath: string): boolean {
  try {
    const actual = new URL(value);
    if (devRendererUrl) {
      const expected = new URL(devRendererUrl);
      return !actual.username && !actual.password && actual.origin === expected.origin &&
        actual.pathname === expected.pathname && actual.search === expected.search && actual.hash === expected.hash;
    }
    if (actual.protocol === 'woho:' && actual.host === 'browser' &&
        !actual.username && !actual.password && actual.pathname === '/index.html' &&
        !actual.search && !actual.hash) return true;
    if (actual.protocol !== 'file:' || actual.search || actual.hash) return false;
    return resolve(fileURLToPath(actual)) === resolve(expectedFilePath);
  } catch {
    return false;
  }
}
