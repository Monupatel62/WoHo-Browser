import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');

test('companion CSP restricts script and embedded content', () => {
  const policy = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  assert.ok(policy.includes("default-src 'self'"));
  assert.ok(policy.includes("script-src 'self'"));
  assert.ok(policy.includes("object-src 'none'"));
  assert.ok(policy.includes("base-uri 'none'"));
  assert.ok(policy.includes("form-action 'self'"));
  assert.ok(!policy.includes("'unsafe-inline'"));
});

test('bookmark rendering uses text nodes and performs no network upload', () => {
  assert.ok(app.includes('link.textContent = bookmark.title'));
  assert.ok(app.includes('url.textContent = bookmark.url'));
  assert.doesNotMatch(app, /innerHTML|outerHTML|eval\s*\(|new Function\s*\(/);
  assert.doesNotMatch(app, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});

test('responsive styles respect reduced-motion preferences', () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
