import { describe, expect, it } from 'vitest';
import { createPermissionGrantKey, getPermissionOrigin } from './permission-policy';

describe('site permission policy', () => {
  it('normalizes HTTP(S) origins and rejects unsafe URL schemes', () => {
    expect(getPermissionOrigin('https://example.com/path?q=1')).toBe('https://example.com');
    expect(getPermissionOrigin('http://example.com:8080/page')).toBe('http://example.com:8080');
    expect(getPermissionOrigin('file:///private.txt')).toBeNull();
    expect(getPermissionOrigin('https://user:secret@example.com')).toBeNull();
  });

  it('creates grants only for the explicit allowlist and canonical origins', () => {
    expect(createPermissionGrantKey('https://example.com', 'media')).toBe('https://example.com::media');
    expect(createPermissionGrantKey('https://example.com/path', 'media')).toBeNull();
    expect(createPermissionGrantKey('https://example.com', 'unknown-permission')).toBeNull();
    expect(createPermissionGrantKey('file:///private.txt', 'media')).toBeNull();
  });
});
