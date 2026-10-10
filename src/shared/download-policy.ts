/** Never retain download query strings, which may contain signed URLs or tokens. */
export function safeDownloadUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null;
    url.search = '';
    url.hash = '';
    return url.toString().slice(0, 4096);
  } catch {
    return null;
  }
}

/** Strip path components and Windows-invalid characters from a suggested download name. */
export function safeDownloadFilename(value: string): string {
  const leaf = value.split('/').pop()?.split(String.fromCharCode(92)).pop() ?? '';
  const forbidden = '<>:' + String.fromCharCode(34) + '/\\|?*';
  const safe = [...leaf]
    .map((character) => character < ' ' || forbidden.includes(character) ? '_' : character)
    .join('')
    .replace(/[. ]+$/g, '')
    .trim();
  return (safe || 'download').slice(0, 255);
}
