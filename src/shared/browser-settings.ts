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
}

export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  searchProvider: 'google',
  homePageUrl: 'https://www.google.com/',
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
  if (Object.keys(candidate).some((key) => key !== 'searchProvider' && key !== 'homePageUrl')) {
    throw new Error('Browser settings contain unknown keys.');
  }
  if (!isSearchProviderId(candidate.searchProvider) ||
      typeof candidate.homePageUrl !== 'string' ||
      candidate.homePageUrl.length > 2048 ||
      !isSafeWebUrl(candidate.homePageUrl)) {
    throw new Error('Browser settings contain an unsupported search provider or invalid HTTP(S) home page URL.');
  }
  const home = new URL(candidate.homePageUrl);
  if (home.username || home.password) {
    throw new Error('Home page URLs cannot contain embedded credentials.');
  }
  return { searchProvider: candidate.searchProvider, homePageUrl: home.toString() };
}
