import { isAbsolute, relative, resolve, sep } from 'node:path';

/** Resolve only a decoded, in-root renderer asset path. Invalid/traversal paths return null. */
export function resolveRendererAssetPath(rendererRoot: string, rawPathname: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith('/') || pathname.includes(String.fromCharCode(92)) || pathname.includes(String.fromCharCode(0))) return null;
  if (pathname === '/') pathname = '/index.html';

  const root = resolve(rendererRoot);
  const target = resolve(root, '.' + pathname);
  const relativePath = relative(root, target);
  if (relativePath === '..' || relativePath.startsWith('..' + sep) || isAbsolute(relativePath)) return null;
  return target;
}
