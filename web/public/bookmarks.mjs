export const MAX_IMPORT_BYTES = 1024 * 1024;
export const MAX_BOOKMARKS = 5000;
export const MAX_TITLE_LENGTH = 512;
export const MAX_URL_LENGTH = 4096;

function validWebUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}
function normalizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Each bookmark must be an object.');
  if (typeof record.title !== 'string' || record.title.trim().length === 0 || record.title.length > MAX_TITLE_LENGTH) throw new Error('Bookmark title must be 1–512 characters.');
  if (!validWebUrl(record.url)) throw new Error('Only valid HTTP and HTTPS bookmark URLs are accepted.');
  return { title: record.title.trim(), url: record.url };
}
export function parseBookmarkImport(text) {
  if (typeof text !== 'string') throw new Error('The selected file is not text.');
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new Error('Bookmark file exceeds the 1 MiB limit.');
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('Bookmark file is not valid JSON.'); }
  if (!parsed || parsed.format !== 'woho-bookmarks' || parsed.version !== 1 || !Array.isArray(parsed.bookmarks)) throw new Error('Unsupported bookmark format. Choose a WoHo bookmark JSON export.');
  if (parsed.bookmarks.length > MAX_BOOKMARKS) throw new Error('Bookmark file exceeds the 5,000 entry limit.');
  const seen = new Set();
  return parsed.bookmarks.map(normalizeRecord).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
export function exportBookmarkData(bookmarks) {
  if (!Array.isArray(bookmarks) || bookmarks.length > MAX_BOOKMARKS) throw new Error('Bookmark list exceeds the 5,000 entry limit.');
  return JSON.stringify({ format: 'woho-bookmarks', version: 1, bookmarks: bookmarks.map(normalizeRecord) }, null, 2) + '\n';
}
