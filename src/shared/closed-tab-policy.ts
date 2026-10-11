import { isSafeWebUrl } from './navigation';

export const MAX_RECENTLY_CLOSED_TABS = 10;

/** Private URLs are never retained; closed-tab recovery is intentionally memory-only. */
export function rememberClosedTab(
  recentlyClosed: readonly string[],
  url: string,
  isPrivate: boolean,
): string[] {
  if (isPrivate || url.length > 4096 || !isSafeWebUrl(url)) return [...recentlyClosed].slice(0, MAX_RECENTLY_CLOSED_TABS);
  let normalized: string;
  try { normalized = new URL(url).toString(); } catch { return [...recentlyClosed].slice(0, MAX_RECENTLY_CLOSED_TABS); }
  return [normalized, ...recentlyClosed.filter((item) => item !== normalized)].slice(0, MAX_RECENTLY_CLOSED_TABS);
}

/** Pops the newest closed normal tab without persisting its URL to disk. */
export function takeRecentlyClosedTab(recentlyClosed: readonly string[]): { url: string | null; remaining: string[] } {
  if (recentlyClosed.length === 0) return { url: null, remaining: [] };
  return { url: recentlyClosed[0], remaining: recentlyClosed.slice(1, MAX_RECENTLY_CLOSED_TABS) };
}
