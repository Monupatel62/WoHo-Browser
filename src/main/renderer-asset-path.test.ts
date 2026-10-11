import { describe, expect, it } from 'vitest';
import { join, resolve } from 'node:path';
import { resolveRendererAssetPath } from './renderer-asset-path';

describe('resolveRendererAssetPath', () => {
  const root = resolve('/app/out/renderer');

  it('resolves the entry point and nested assets inside the renderer root', () => {
    expect(resolveRendererAssetPath(root, '/')).toBe(join(root, 'index.html'));
    expect(resolveRendererAssetPath(root, '/index.html')).toBe(join(root, 'index.html'));
    expect(resolveRendererAssetPath(root, '/assets/app.js')).toBe(join(root, 'assets', 'app.js'));
  });

  it('rejects encoded traversal, backslashes, null bytes, and malformed escapes', () => {
    expect(resolveRendererAssetPath(root, '/../../main/index.js')).toBeNull();
    expect(resolveRendererAssetPath(root, '/assets/%2e%2e/%2e%2e/main/index.js')).toBeNull();
    expect(resolveRendererAssetPath(root, '/assets/%5c..%5c..%5cmain.js')).toBeNull();
    expect(resolveRendererAssetPath(root, '/assets/%00.js')).toBeNull();
    expect(resolveRendererAssetPath(root, '/assets/%ZZ.js')).toBeNull();
  });
});
