import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { mergeChromiumNotices } from './merge-electron-chromium-notices.mjs';

const roots = [];
after(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'woho-chromium-notices-'));
  roots.push(root);
  await mkdir(path.join(root, 'release', 'win-unpacked', 'resources'), { recursive: true });
  await writeFile(path.join(root, 'release', 'win-unpacked', 'LICENSES.chromium.html'), '<html>Chromium third-party licenses</html>\n');
  await writeFile(path.join(root, 'THIRD-PARTY-NOTICES.txt'), 'Existing npm dependency notices\n');
  await writeFile(path.join(root, 'release', 'win-unpacked', 'resources', 'THIRD-PARTY-NOTICES.txt'), 'Existing app resource notices\n');
  await writeFile(path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json'), JSON.stringify({
    format: 'woho-third-party-license-inventory',
    version: 1,
    packages: [{ name: 'electron', licenseFiles: ['node_modules/electron/LICENSE'] }],
    requiredBundledNotices: { electronChromiumHtmlIncluded: false },
  }));
  return root;
}

test('merges the exact packaged Chromium notice into the release and app resource', async () => {
  const root = await fixture();
  const result = await mergeChromiumNotices(root);
  const notices = await readFile(path.join(root, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  const appNotices = await readFile(path.join(root, 'release', 'win-unpacked', 'resources', 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  const inventory = JSON.parse(await readFile(path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json'), 'utf8'));
  assert.ok(result.sha256.length === 64);
  assert.match(notices, /Chromium third-party licenses/);
  assert.equal(appNotices, notices);
  assert.equal(inventory.requiredBundledNotices.electronChromiumHtmlIncluded, true);
  assert.equal(inventory.requiredBundledNotices.sha256, result.sha256);
  assert.ok(inventory.packages[0].licenseFiles.includes('release/win-unpacked/LICENSES.chromium.html'));
});

test('refuses to invent Chromium notice content when packaged file is missing', async () => {
  const root = await fixture();
  await rm(path.join(root, 'release', 'win-unpacked', 'LICENSES.chromium.html'));
  await assert.rejects(() => mergeChromiumNotices(root));
});
