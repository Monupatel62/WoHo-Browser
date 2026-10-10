export interface SearchableSavedEntry {
  title: string;
  url: string;
}

/** Case-insensitive substring search over a saved entry's title and URL. */
export function filterSavedEntries<T extends SearchableSavedEntry>(entries: readonly T[], rawQuery: string): T[] {
  const query = rawQuery.trim().slice(0, 200).toLowerCase();
  if (!query) return [...entries];
  return entries.filter((entry) =>
    entry.title.toLowerCase().includes(query) || entry.url.toLowerCase().includes(query));
}
