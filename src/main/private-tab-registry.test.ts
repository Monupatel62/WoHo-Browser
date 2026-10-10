import { describe, expect, it } from 'vitest';
import { PrivateTabRegistry } from './private-tab-registry';
import { shouldPersistBrowsingHistory } from '../shared/privacy-policy';

describe('PrivateTabRegistry', () => {
  it('keeps a closing tab private until its WebContents is destroyed', () => {
    const registry = new PrivateTabRegistry();
    registry.add('private-tab');

    // Session cleanup can start before WebContents finishes closing.
    expect(shouldPersistBrowsingHistory(registry.has('private-tab'))).toBe(false);
    expect(registry.has('private-tab')).toBe(true);

    registry.onDestroyed('private-tab');
    expect(registry.has('private-tab')).toBe(false);
  });

  it('does not classify normal tabs as private', () => {
    const registry = new PrivateTabRegistry();
    expect(registry.has('normal-tab')).toBe(false);
    expect(shouldPersistBrowsingHistory(registry.has('normal-tab'))).toBe(true);
  });
});
