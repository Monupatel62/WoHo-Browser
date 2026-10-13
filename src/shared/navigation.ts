export const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q=';
const WEB_PROTOCOLS = new Set(['http:', 'https:']);
const SCHEME_PREFIX = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export function isSafeWebUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return WEB_PROTOCOLS.has(parsed.protocol) && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/** Resolve address-bar text; non-web schemes are rejected instead of navigated. */
export function resolveAddressInput(input: string, searchEngine = DEFAULT_SEARCH_ENGINE): string {
  const value = input.trim();
  if (!value) throw new Error('Enter a website address or search query.');
  // A host:port is not a URI scheme. Query and fragment delimiters are valid
  // immediately after the port even when the URL has no path component.
  const isHostWithPort = /^[^/\s:]+:\d+(?:[/?#]|$)/.test(value);
  if (SCHEME_PREFIX.test(value) && !isHostWithPort) {
    if (!isSafeWebUrl(value)) throw new Error('Only HTTP and HTTPS addresses are supported.');
    return new URL(value).toString();
  }
  if (/\s/.test(value)) return searchEngine + encodeURIComponent(value);
  const candidate = 'https://' + value;
  if (isSafeWebUrl(candidate)) return new URL(candidate).toString();
  return searchEngine + encodeURIComponent(value);
}

export function isAllowedNavigationTarget(value: string): boolean {
  return isSafeWebUrl(value);
}

/**
 * Frame navigations may legitimately use inherited-origin about: documents or
 * blob URLs created by a web origin. Reject active local/custom schemes such
 * as file:, data:, javascript:, and application-specific protocols.
 */
export function isAllowedFrameNavigationTarget(value: string): boolean {
  if (isSafeWebUrl(value)) return true;
  try {
    const url = new URL(value);
    if (url.protocol === 'about:' && !url.search && !url.hash &&
        (url.pathname === 'blank' || url.pathname === 'srcdoc')) return true;
    if (url.protocol === 'blob:') return isSafeWebUrl(value.slice('blob:'.length));
    return false;
  } catch {
    return false;
  }
}

/** A context-menu link must be a bounded, safe HTTP(S) destination. */
export function isSafeContextMenuLink(value: string): boolean {
  return value.length <= 4096 && isAllowedNavigationTarget(value);
}
