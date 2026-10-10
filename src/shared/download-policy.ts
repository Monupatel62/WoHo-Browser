/** Never retain download query strings, which may contain signed URLs or tokens. */
export function safeDownloadUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null;
    url.search = '';
    url.hash = '';
    const sanitized = url.toString();
    // Reject rather than truncate: truncation can persist a different URL or
    // cut through an escaped path segment, making the whole history unreadable.
    return sanitized.length <= 4096 ? sanitized : null;
  } catch {
    return null;
  }
}

/** Strip path components and Windows-invalid characters from a suggested download name. */
export function safeDownloadFilename(value: string): string {
  const lastSeparator = Math.max(value.lastIndexOf('/'), value.lastIndexOf(String.fromCharCode(92)));
  // Keep normalization work bounded. The returned filename is limited to 255
  // code units, so an excessive server-provided suffix is never needed.
  const leaf = value.slice(lastSeparator + 1).slice(0, 1024)
    .normalize('NFC')
    .replace(/[\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]/g, '');
  const forbidden = '<>:' + String.fromCharCode(34) + '/\\|?*';
  let safe = [...leaf]
    .map((character) => character < ' ' || forbidden.includes(character) ? '_' : character)
    .join('')
    .replace(/[. ]+$/g, '')
    .trim();
  const deviceName = (safe.split('.')[0] ?? '').replace(/[. ]+$/g, '').toUpperCase();
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9]|COM[¹²³]|LPT[¹²³])$/.test(deviceName)) safe = '_' + safe;
  return (safe || 'download').slice(0, 255);
}
