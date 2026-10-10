import { isSafeWebUrl } from './navigation';

export interface SessionTabCandidate {
  url: string;
  isPrivate: boolean;
}

export const MAX_RESTORED_TABS = 50;

/** Keep only safe normal-profile URLs and retain the most recently ordered tabs. */
export function selectRestorableTabUrls(tabs: readonly SessionTabCandidate[]): string[] {
  return tabs
    .filter((tab) => !tab.isPrivate && tab.url.length <= 4096 && isSafeWebUrl(tab.url))
    .slice(-MAX_RESTORED_TABS)
    .map((tab) => new URL(tab.url).toString());
}
