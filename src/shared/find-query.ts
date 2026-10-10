const MAX_FIND_QUERY_LENGTH = 500;

export function normalizeFindQuery(value: unknown): string {
  if (typeof value !== 'string' || value.length > MAX_FIND_QUERY_LENGTH) {
    throw new Error('Find query must be text up to 500 characters.');
  }
  return value.trim();
}
