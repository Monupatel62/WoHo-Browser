import { describe, expect, it } from 'vitest';
import { getNavigationFailureMessage } from './navigation-error';

describe('getNavigationFailureMessage', () => {
  it('ignores user-cancelled navigation', () => {
    expect(getNavigationFailureMessage(-3, 'ERR_ABORTED')).toBeNull();
  });

  it('provides actionable messages for common network failures', () => {
    expect(getNavigationFailureMessage(-105, 'ERR_NAME_NOT_RESOLVED')).toMatch(/could not find this website/i);
    expect(getNavigationFailureMessage(-106, 'ERR_INTERNET_DISCONNECTED')).toMatch(/offline/i);
    expect(getNavigationFailureMessage(-118, 'ERR_CONNECTION_TIMED_OUT')).toMatch(/too long to respond/i);
    expect(getNavigationFailureMessage(-102, 'ERR_CONNECTION_REFUSED')).toMatch(/refused the connection/i);
  });

  it('never suggests bypassing certificate errors', () => {
    const message = getNavigationFailureMessage(-202, 'ERR_CERT_AUTHORITY_INVALID');
    expect(message).toMatch(/certificate/i);
    expect(message).toMatch(/blocked the connection/i);
    expect(message).not.toMatch(/proceed anyway|ignore/i);
  });

  it('uses a safe generic message for unknown failures', () => {
    expect(getNavigationFailureMessage(-999, 'sensitive URL details')).toBe(
      'This page could not be loaded. Check the address or your connection and try again.',
    );
  });
});
