import { describe, expect, it } from 'vitest';
import { filterSavedEntries } from './saved-entry-search';

const entries = [
  { id: '1', title: 'OpenAI', url: 'https://openai.com/' },
  { id: '2', title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/' },
  { id: '3', title: 'Example page', url: 'https://example.com/account' },
];

describe('filterSavedEntries', () => {
  it('filters by title or URL case-insensitively', () => {
    expect(filterSavedEntries(entries, 'typescript').map((entry) => entry.id)).toEqual(['2']);
    expect(filterSavedEntries(entries, 'EXAMPLE.COM').map((entry) => entry.id)).toEqual(['3']);
  });

  it('returns all entries for blank queries and preserves source order', () => {
    expect(filterSavedEntries(entries, '   ')).toEqual(entries);
  });

  it('caps the query length', () => {
    expect(filterSavedEntries(entries, 'openai' + 'x'.repeat(500))).toEqual([]);
    expect(filterSavedEntries(entries, 'openai' + ' '.repeat(500))).toHaveLength(1);
  });
});
