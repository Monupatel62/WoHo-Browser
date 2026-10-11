export type ZoomAction = 'in' | 'out' | 'reset';

export const MIN_ZOOM_LEVEL = -5;
export const MAX_ZOOM_LEVEL = 5;
export const ZOOM_STEP = 1;

/** Electron zoom levels use multiplicative steps; keep controls within a usable bounded range. */
export function getNextZoomLevel(current: number, action: ZoomAction): number {
  if (action === 'reset') return 0;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const base = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, safeCurrent));
  if (action === 'in') return Math.min(MAX_ZOOM_LEVEL, base + ZOOM_STEP);
  return Math.max(MIN_ZOOM_LEVEL, base - ZOOM_STEP);
}
