import { describe, expect, it } from 'vitest';
import { getNextZoomLevel, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from './zoom-policy';

describe('browser zoom policy', () => {
  it('increments and decrements in bounded steps', () => {
    expect(getNextZoomLevel(0, 'in')).toBe(1);
    expect(getNextZoomLevel(2, 'out')).toBe(1);
    expect(getNextZoomLevel(MAX_ZOOM_LEVEL, 'in')).toBe(MAX_ZOOM_LEVEL);
    expect(getNextZoomLevel(MIN_ZOOM_LEVEL, 'out')).toBe(MIN_ZOOM_LEVEL);
  });

  it('resets to the default zoom and handles invalid current values safely', () => {
    expect(getNextZoomLevel(4, 'reset')).toBe(0);
    expect(getNextZoomLevel(Number.NaN, 'in')).toBe(1);
    expect(getNextZoomLevel(Number.POSITIVE_INFINITY, 'out')).toBe(-1);
  });

  it('clamps out-of-range current levels before applying a step', () => {
    expect(getNextZoomLevel(100, 'out')).toBe(4);
    expect(getNextZoomLevel(-100, 'in')).toBe(-4);
  });
});
