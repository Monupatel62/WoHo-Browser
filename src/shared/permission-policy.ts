export const ALLOWED_SITE_PERMISSIONS = new Set([
  'media',
  'geolocation',
  'notifications',
  'clipboard-read',
]);

export function getPermissionOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname || url.username || url.password) return null;
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
