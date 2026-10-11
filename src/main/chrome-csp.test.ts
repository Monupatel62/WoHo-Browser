import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('trusted chrome renderer Content Security Policy', () => {
  it('restricts executable and embedded content without allowing inline scripts', async () => {
    const html = await readFile(new URL('../renderer/index.html', import.meta.url), 'utf8');
    const match = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
    expect(match, 'trusted renderer must declare a CSP').not.toBeNull();

    const policy = match?.[1] ?? '';
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'self'");
  });
});
