#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export function evaluateReleaseLegalGates({ licenseExists, noticesExists, inventory, requireChromiumNotice = false }) {
  const errors = [];
  if (!licenseExists) {
    errors.push('Project LICENSE file is missing. The copyright owner must select and add the intended license before a public release.');
  }
  if (!noticesExists) {
    errors.push('THIRD-PARTY-NOTICES.txt is missing; run npm run notices.');
  }
  if (!inventory || inventory.format !== 'woho-third-party-license-inventory' || inventory.version !== 1) {
    errors.push('Third-party license inventory is missing, malformed, or unsupported.');
    return errors;
  }
  if (!Number.isInteger(inventory.packageCount) || inventory.packageCount < 1) {
    errors.push('Third-party license inventory does not contain any packages.');
  }
  if (!Array.isArray(inventory.unresolved) || inventory.packagesRequiringManualReview !== inventory.unresolved.length) {
    errors.push('Third-party license inventory review counts are inconsistent.');
  } else if (inventory.unresolved.length > 0) {
    const examples = inventory.unresolved.slice(0, 10).map((item) => `${item.name || 'unknown'}@${item.version || 'unknown'} (${(item.reviewReason || []).join('; ') || 'manual review required'})`);
    errors.push(`Manual review is still required for ${inventory.unresolved.length} dependency package(s): ${examples.join(', ')}${inventory.unresolved.length > 10 ? ', …' : ''}`);
  }
  if (requireChromiumNotice && inventory.requiredBundledNotices?.electronChromiumHtmlIncluded !== true) {
    errors.push('Electron/Chromium LICENSES.chromium.html was not found and included; locate and review the shipped Chromium notice before release.');
  }
  return errors;
}

export async function verifyReleaseLegalGates(root = rootDir, { requireChromiumNotice = process.argv.includes('--require-chromium') } = {}) {
  const licenseExists = await exists(path.join(root, 'LICENSE'));
  const noticesPath = path.join(root, 'THIRD-PARTY-NOTICES.txt');
  const noticesExists = await exists(noticesPath);
  let noticesText = null;
  if (noticesExists) noticesText = await readFile(noticesPath, 'utf8');
  let inventory = null;
  try {
    inventory = JSON.parse(await readFile(path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json'), 'utf8'));
  } catch {
    // The errors below explain the missing or malformed inventory.
  }
  const errors = evaluateReleaseLegalGates({ licenseExists, noticesExists, inventory, requireChromiumNotice });
  if (requireChromiumNotice && inventory && noticesText !== null) {
    const digest = inventory.requiredBundledNotices?.sha256;
    if (inventory.requiredBundledNotices?.electronChromiumHtmlIncluded !== true ||
        typeof digest !== 'string' || !/^[a-f0-9]{64}$/i.test(digest) ||
        !noticesText.includes('BEGIN ELECTRON/CHROMIUM LICENSES.chromium.html') ||
        !noticesText.includes(`SHA-256: ${digest}`) ||
        !noticesText.includes('END ELECTRON/CHROMIUM LICENSES.chromium.html')) {
      errors.push('Third-party notice bundle is missing the verifiable Chromium-license appendix or matching SHA-256 evidence.');
    }

    const packagedNoticePath = path.join(root, 'release', 'win-unpacked', 'resources', 'THIRD-PARTY-NOTICES.txt');
    try {
      const packagedNotices = await readFile(packagedNoticePath, 'utf8');
      if (noticesText !== packagedNotices) {
        errors.push('Packaged Windows app resource THIRD-PARTY-NOTICES.txt does not exactly match the verified root notice bundle.');
      }
    } catch {
      errors.push('Packaged Windows app resource THIRD-PARTY-NOTICES.txt is missing.');
    }
  }
  if (errors.length > 0) {
    process.stderr.write('Release legal preflight BLOCKED:\n' + errors.map((error) => `- ${error}`).join('\n') + '\n');
    return false;
  }
  process.stdout.write('Release legal preflight passed: project license, dependency license inventory, third-party notices, and Chromium notice are present.\n');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  verifyReleaseLegalGates().then((ok) => {
    if (!ok) process.exitCode = 1;
  }).catch((error) => {
    process.stderr.write(`Release legal preflight failed: ${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
