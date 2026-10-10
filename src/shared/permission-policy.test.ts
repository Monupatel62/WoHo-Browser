import { describe, expect, it } from 'vitest';
import { createPermissionGrantKey, getPermissionOrigin } from './permission-policy';

describe('site permission policy', () => {
  it('normalizes HTTP(S) origins and rejects unsafe URL schemes', () => {
    expect(getPermissionOrigin('https://example.com/path?q=1')).toBe('https://example.com');
    expect(getPermissionOrigin('http://example.com:8080/page')).toBeNull();
    expect(getPermissionOrigin('file:///private.txt')).toBeNull();
    expect(getPermissionOrigin('https://user:secret@example.com')).toBeNull();
  });

  it('rejects sensitive permissions from insecure HTTP origins but allows HTTPS and loopback', () => {
    expect(getPermissionOrigin('http://example.com/')).toBeNull();
    expect(getPermissionOrigin('http://192.168.1.20/')).toBeNull();
    expect(getPermissionOrigin('https://example.com/')).toBe('https://example.com');
    expect(getPermissionOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(getPermissionOrigin('http://app.localhost/')).toBe('http://app.localhost');
    expect(getPermissionOrigin('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
    expect(getPermissionOrigin('http://[::1]:8080/')).toBe('http://[::1]:8080');
  });

  it('creates grants only for the explicit allowlist and canonical origins', () => {
    expect(createPermissionGrantKey('https://example.com', 'media')).toBe('https://example.com::media');
    expect(createPermissionGrantKey('http://example.com', 'media')).toBeNull();
    expect(createPermissionGrantKey('http://localhost:3000', 'media')).toBe('http://localhost:3000::media');
    expect(createPermissionGrantKey('https://example.com/path', 'media')).toBeNull();
    expect(createPermissionGrantKey('https://example.com', 'unknown-permission')).toBeNull();
    expect(createPermissionGrantKey('file:///private.txt', 'media')).toBeNull();
  });
});
