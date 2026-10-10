export const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q=';
const WEB_PROTOCOLS = new Set(['http:', 'https:']);
const SCHEME_PREFIX = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export function isSafeWebUrl(value: string): boolean {
  try { const parsed = new URL(value); return WEB_PROTOCOLS.has(parsed.protocol) && Boolean(parsed.hostname); }
  catch { return false; }
}

/** Resolve address-bar text; non-web schemes are rejected instead of navigated. */
export function resolveAddressInput(input: string, searchEngine = DEFAULT_SEARCH_ENGINE): string {
  const value = input.trim();
  if (!value) throw new Error('Enter a website address or search query.');
  const isHostWithPort = /^[^/\\s:]+:\\d+(?:\\/|$)/.test(value);\n  if (SCHEME_PREFIX.test(value) && !isHostWithPort) {
    if (!isSafeWebUrl(value)) throw new Error('Only HTTP and HTTPS addresses are supported.');
    return new URL(value).toString();
  }
  if (/\s/.test(value)) return searchEngine + encodeURIComponent(value);
  const candidate = 'https://' + value;
  if (isSafeWebUrl(candidate)) return new URL(candidate).toString();
  return searchEngine + encodeURIComponent(value);
}

export function isAllowedNavigationTarget(value: string): boolean { return isSafeWebUrl(value); }
