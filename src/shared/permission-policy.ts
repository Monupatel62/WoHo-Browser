export const ALLOWED_SITE_PERMISSIONS = new Set([
  'media',
  'geolocation',
  'notifications',
  'clipboard-read',
]);

function isSecurePermissionUrl(url: URL): boolean {
  if (url.protocol === 'https:') return true;
  if (url.protocol !== 'http:') return false;
  const host = url.hostname.toLowerCase();
  // Preserve HTTP permissions for local development only; arbitrary HTTP
  // origins do not provide a trustworthy context for sensitive capabilities.
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
    host.endsWith('.localhost');
}

export function getPermissionOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!url.hostname || url.username || url.password || !isSecurePermissionUrl(url)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function createPermissionGrantKey(origin: string, permission: string): string | null {
  if (!ALLOWED_SITE_PERMISSIONS.has(permission)) return null;
  const safeOrigin = getPermissionOrigin(origin);
  if (!safeOrigin || safeOrigin !== origin) return null;
  return safeOrigin + '::' + permission;
}
