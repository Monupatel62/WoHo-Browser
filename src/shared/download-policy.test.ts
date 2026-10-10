import { describe, expect, it } from 'vitest';
import { safeDownloadFilename, safeDownloadUrl } from './download-policy';

describe('safeDownloadUrl', () => {
  it('accepts HTTP and HTTPS while removing query strings and fragments', () => {
    expect(safeDownloadUrl('https://example.com/file.zip?token=secret#section')).toBe('https://example.com/file.zip');
    expect(safeDownloadUrl('http://example.com/file.zip')).toBe('http://example.com/file.zip');
  });

  it('rejects non-web schemes and URLs containing credentials', () => {
    expect(safeDownloadUrl('file:///private.txt')).toBeNull();
    expect(safeDownloadUrl('blob:https://example.com/id')).toBeNull();
    expect(safeDownloadUrl('data:text/plain,secret')).toBeNull();
    expect(safeDownloadUrl('https://user:secret@example.com/file')).toBeNull();
    expect(safeDownloadUrl('not a URL')).toBeNull();
  });
});

describe('safeDownloadFilename', () => {
  it('strips path traversal and Windows-invalid characters', () => {
    expect(safeDownloadFilename('../../private?.txt')).toBe('private_.txt');
    expect(safeDownloadFilename('C:\\temp\\report.txt')).toBe('report.txt');
  });

  it('provides a fallback for empty names and bounds long names', () => {
    expect(safeDownloadFilename('...')).toBe('download');
    expect(safeDownloadFilename('x'.repeat(500))).toHaveLength(255);
  });
});
