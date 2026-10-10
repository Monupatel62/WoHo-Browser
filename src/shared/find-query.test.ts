import { describe, expect, it } from 'vitest';
import { normalizeFindQuery } from './find-query';

describe('normalizeFindQuery', () => {
  it('trims whitespace and keeps internal spaces', () => {
    expect(normalizeFindQuery('  two words  ')).toBe('two words');
  });

  it('allows an empty query so callers can clear a search', () => {
    expect(normalizeFindQuery('   ')).toBe('');
  });

  it('rejects non-text and overlong queries', () => {
    expect(() => normalizeFindQuery(null)).toThrow(/up to 500/);
    expect(() => normalizeFindQuery('x'.repeat(501))).toThrow(/up to 500/);
  });
});
