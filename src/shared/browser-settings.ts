import { isSafeWebUrl } from './navigation';

export const SEARCH_PROVIDERS = {
  google: { label: 'Google', searchPrefix: 'https://www.google.com/search?q=' },
  bing: { label: 'Bing', searchPrefix: 'https://www.bing.com/search?q=' },
  duckduckgo: { label: 'DuckDuckGo', searchPrefix: 'https://duckduckgo.com/?q=' },
} as const;

export type SearchProviderId = keyof typeof SEARCH_PROVIDERS;

export interface BrowserSettings {
  searchProvider: SearchProviderId;
  homePageUrl: string;
  restoreSession: boolean;
}

export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  searchProvider: 'google',
  homePageUrl: 'https://www.google.com/',
  restoreSession: false,
};

export function isSearchProviderId(value: unknown): value is SearchProviderId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SEARCH_PROVIDERS, value);
}

export function getSearchEnginePrefix(provider: SearchProviderId): string {
  return SEARCH_PROVIDERS[provider].searchPrefix;
}

export function validateBrowserSettings(value: unknown): BrowserSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Browser settings are invalid.');
  }
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).some((key) => key !== 'searchProvider' && key !== 'homePageUrl' && key !== 'restoreSession')) {
    throw new Error('Browser settings contain unknown keys.');
  }
  if (!isSearchProviderId(candidate.searchProvider) ||
      typeof candidate.homePageUrl !== 'string' ||
      candidate.homePageUrl.length > 2048 ||
      !isSafeWebUrl(candidate.homePageUrl) || typeof candidate.restoreSession !== 'boolean') {
    throw new Error('Browser settings contain an unsupported search provider or invalid HTTP(S) home page URL.');
  }
  const home = new URL(candidate.homePageUrl);
  if (home.username || home.password) {
    throw new Error('Home page URLs cannot contain embedded credentials.');
  }
  return { searchProvider: candidate.searchProvider, homePageUrl: home.toString(), restoreSession: candidate.restoreSession };
}

export const MAX_SETTINGS_IMPORT_BYTES = 16 * 1024;

/** Parse a bounded settings export, including the previous schema version. */
export function parseBrowserSettingsImport(raw: string): BrowserSettings {
  if (new TextEncoder().encode(raw).byteLength > MAX_SETTINGS_IMPORT_BYTES) {
    throw new Error('Settings import exceeds the 16 KiB limit.');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch {
    throw new Error('Settings import is not valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Settings import structure is unsupported.');
  }
  const document = parsed as Record<string, unknown>;
  if (Object.keys(document).some((key) => key !== 'version' && key !== 'settings') ||
      !isSearchProviderId('google') ||
      (document.version !== 1 && document.version !== 2) ||
      typeof document.settings !== 'object' || document.settings === null || Array.isArray(document.settings)) {
    throw new Error('Settings import structure or version is unsupported.');
  }
  const candidate = document.version === 1
    ? { ...(document.settings as Record<string, unknown>), restoreSession: false }
    : document.settings;
  return validateBrowserSettings(candidate);
}
