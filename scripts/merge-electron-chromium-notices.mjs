#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = 'BEGIN ELECTRON/CHROMIUM LICENSES.chromium.html';
const MAX_NOTICE_BYTES = 50 * 1024 * 1024;

export async function mergeChromiumNotices(root = rootDir) {
  const distributionPath = path.join(root, 'release', 'win-unpacked', 'LICENSES.chromium.html');
  const resourceNoticesPath = path.join(root, 'release', 'win-unpacked', 'resources', 'THIRD-PARTY-NOTICES.txt');
  const noticePath = path.join(root, 'THIRD-PARTY-NOTICES.txt');
  const inventoryPath = path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json');

  const chromiumBytes = await readFile(distributionPath);
  if (chromiumBytes.length === 0 || chromiumBytes.length > MAX_NOTICE_BYTES || chromiumBytes.includes(0)) {
    throw new Error('The packaged Electron/Chromium license HTML is empty, oversized, or appears to be binary.');
  }
  const chromiumText = chromiumBytes.toString('utf8');
  const sha256 = createHash('sha256').update(chromiumBytes).digest('hex');

  let notices = await readFile(noticePath, 'utf8');
  const existingMarkerIndex = notices.indexOf(MARKER);
  if (existingMarkerIndex >= 0) notices = notices.slice(0, existingMarkerIndex).trimEnd();
  const appendix = [
    '',
    '='.repeat(88),
    MARKER,
    'Source: release/win-unpacked/LICENSES.chromium.html (from the exact Electron binary packaged for Windows).',
    `SHA-256: ${sha256}`,
    '',
    chromiumText.trimEnd(),
    '',
    'END ELECTRON/CHROMIUM LICENSES.chromium.html',
    '='.repeat(88),
    '',
  ].join('\n');
  notices = notices.trimEnd() + '\n' + appendix;
  await writeFile(noticePath, notices, 'utf8');
  // Make the already-staged app directory carry the same notice text before NSIS packaging.
  await writeFile(resourceNoticesPath, notices, 'utf8');

  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  if (inventory.format !== 'woho-third-party-license-inventory' || !Array.isArray(inventory.packages)) {
    throw new Error('The generated third-party license inventory is invalid.');
  }
  inventory.requiredBundledNotices = {
    electronChromiumHtmlIncluded: true,
    sourcePath: 'release/win-unpacked/LICENSES.chromium.html',
    sha256,
  };
  const electron = inventory.packages.find((item) => item.name === 'electron');
  if (electron) {
    const paths = Array.isArray(electron.licenseFiles) ? electron.licenseFiles : [];
    if (!paths.includes('release/win-unpacked/LICENSES.chromium.html')) {
      paths.push('release/win-unpacked/LICENSES.chromium.html');
    }
    electron.licenseFiles = paths;
  }
  await writeFile(inventoryPath, JSON.stringify(inventory, null, 2) + '\n', 'utf8');

  process.stdout.write(`Embedded the exact packaged Electron/Chromium license notice (SHA-256 ${sha256}).\n`);
  return { sha256, byteLength: chromiumBytes.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  mergeChromiumNotices().catch((error) => {
    process.stderr.write(`Could not merge the packaged Chromium license notice: ${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
