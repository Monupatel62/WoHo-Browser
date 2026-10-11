import { describe, expect, it } from 'vitest';
import { resolveActiveSession } from './session-scope';

describe('resolveActiveSession', () => {
  it('uses the selected tab session, including a private session', () => {
    const normal = { name: 'normal-profile' };
    const privateSession = { name: 'private-session' };
    expect(resolveActiveSession(privateSession, normal)).toBe(privateSession);
  });

  it('falls back to the normal profile when there is no active tab session', () => {
    const normal = { name: 'normal-profile' };
    expect(resolveActiveSession(undefined, normal)).toBe(normal);
    expect(resolveActiveSession(null, normal)).toBe(normal);
  });
});
