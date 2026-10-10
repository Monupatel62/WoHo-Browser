import { describe, expect, it } from 'vitest';
import { TabCrashRegistry } from './tab-crash-registry';

describe('TabCrashRegistry', () => {
  it('tracks crashes independently per tab', () => {
    const registry = new TabCrashRegistry();
    registry.markCrashed('tab-a');
    expect(registry.has('tab-a')).toBe(true);
    expect(registry.has('tab-b')).toBe(false);
  });

  it('clears crash state when reload starts or the tab is destroyed', () => {
    const registry = new TabCrashRegistry();
    registry.markCrashed('reload-tab');
    registry.markReloading('reload-tab');
    expect(registry.has('reload-tab')).toBe(false);
    registry.markCrashed('closed-tab');
    registry.remove('closed-tab');
    expect(registry.has('closed-tab')).toBe(false);
  });
});
