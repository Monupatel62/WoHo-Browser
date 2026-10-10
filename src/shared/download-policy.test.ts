import { describe, expect, it } from 'vitest';
import { safeDownloadFilename, safeDownloadUrl } from './download-policy';

describe('safeDownloadUrl', () => {
  it('accepts HTTP and HTTPS while removing query strings and fragments', () => {
    expect(safeDownloadUrl('https://example.com/file.zip?token=secret#section')).toBe('https://example.com/file.zip');
    expect(safeDownloadUrl('http://example.com/file.zip')).toBe('http://example.com/file.zip');
  });

  it('rejects overlong sanitized URLs instead of truncating them', () => {
    expect(safeDownloadUrl('https://example.com/' + 'x'.repeat(4100))).toBeNull();
    // Long query strings are removed before the length check, so a normal
    // resource URL is still retained without its potentially sensitive token.
    expect(safeDownloadUrl('https://example.com/file?token=' + 'x'.repeat(5000))).toBe('https://example.com/file');
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

  it('avoids Windows reserved device names, including names with extensions', () => {
    expect(safeDownloadFilename('CON')).toBe('_CON');
    expect(safeDownloadFilename('nul.txt')).toBe('_nul.txt');
    expect(safeDownloadFilename('CON .txt')).toBe('_CON .txt');
    expect(safeDownloadFilename('COM1.zip')).toBe('_COM1.zip');
    expect(safeDownloadFilename('LPT³.log')).toBe('_LPT³.log');
    expect(safeDownloadFilename('normal-CON.txt')).toBe('normal-CON.txt');
  });

  it('normalizes Unicode and strips bidirectional control characters that can spoof extensions', () => {
    expect(safeDownloadFilename('cafe\u0301.txt')).toBe('café.txt');
    expect(safeDownloadFilename('invoice\u202Egpj.exe')).toBe('invoicegpj.exe');
    expect(safeDownloadFilename('report\u2066fdp\u2069.exe')).toBe('reportfdp.exe');
  });

  it('bounds normalization work for excessively long server-provided names', () => {
    expect(safeDownloadFilename('x'.repeat(100_000))).toHaveLength(255);
  });

  it('provides a fallback for empty names and bounds long names', () => {
    expect(safeDownloadFilename('...')).toBe('download');
    expect(safeDownloadFilename('x'.repeat(500))).toHaveLength(255);
  });
});
