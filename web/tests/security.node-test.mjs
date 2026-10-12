const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
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

test('bookmark import resets the file input after success or failure', () => {
  assert.match(app, /catch \(error\)[\s\S]*finally \{[\s\S]*fileInput\.value = ''/);
});

test('bookmark export keeps its blob URL alive until the download can start', () => {
  assert.match(app, /anchor\.click\(\);[\s\S]*setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 1000\)/);
  assert.doesNotMatch(app, /anchor\.click\(\);\s*URL\.revokeObjectURL\(url\);/);
});

test('responsive styles respect reduced-motion preferences', () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('static host response headers block framing and unnecessary device permissions', () => {
  assert.match(headers, /Content-Security-Policy:.*frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.match(headers, /Cross-Origin-Opener-Policy: same-origin/);
});
