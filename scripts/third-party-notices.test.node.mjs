import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { buildInventory, collectInstalledPackages, generateNotices, releaseRelevantPackages, renderNotices } from './generate-third-party-notices.mjs';

const temporaryRoots = [];
after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'woho-third-party-notices-'));
  temporaryRoots.push(root);
  await mkdir(path.join(root, 'node_modules', '@scope', 'alpha', 'node_modules', 'beta'), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture-app', version: '1.2.3', dependencies: { '@scope/alpha': '2.0.0' } }));
  await writeFile(path.join(root, 'node_modules', '@scope', 'alpha', 'package.json'), JSON.stringify({
    name: '@scope/alpha', version: '2.0.0', license: 'MIT', dependencies: { beta: '3.0.0' },
  }));
  await writeFile(path.join(root, 'node_modules', '@scope', 'alpha', 'LICENSE.txt'), 'Alpha MIT terms.\n');
  await writeFile(path.join(root, 'node_modules', '@scope', 'alpha', 'node_modules', 'beta', 'package.json'), JSON.stringify({
    name: 'beta', version: '3.0.0',
  }));
  await writeFile(path.join(root, 'node_modules', '@scope', 'alpha', 'node_modules', 'beta', 'NOTICE'), 'Beta notice text.\n');
  await mkdir(path.join(root, 'node_modules', 'build-tool'), { recursive: true });
  await writeFile(path.join(root, 'node_modules', 'build-tool', 'package.json'), JSON.stringify({ name: 'build-tool', version: '9.0.0' }));
  return root;
}

test('collects scoped and nested packages with license files', async () => {
  const root = await fixture();
  const packages = await collectInstalledPackages(path.join(root, 'node_modules'));
  assert.deepEqual(packages.map((item) => item.path), [
    'node_modules/@scope/alpha',
    'node_modules/@scope/alpha/node_modules/beta',
    'node_modules/build-tool',
  ]);
  assert.equal(packages[0].declaredLicense, 'MIT');
  assert.equal(packages[0].licenseFiles[0].text.trim(), 'Alpha MIT terms.');
  assert.equal(packages[1].declaredLicense, '');
  assert.equal(packages[1].licenseFiles[0].text.trim(), 'Beta notice text.');
});

test('notice and inventory disclose packages needing manual license review', async () => {
  const root = await fixture();
  const packages = await collectInstalledPackages(path.join(root, 'node_modules'));
  const project = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const runtimePackages = releaseRelevantPackages(project, packages);
  const notices = renderNotices(project, runtimePackages);
  const inventory = buildInventory(packages, runtimePackages);
  assert.match(notices, /fixture-app 1\.2\.3/);
  assert.match(notices, /Alpha MIT terms\./);
  assert.match(notices, /Beta notice text\./);
  assert.match(notices, /NOT DECLARED — REVIEW REQUIRED/);
  assert.equal(inventory.packageCount, 3);
  assert.equal(inventory.runtimePackageCount, 2);
  assert.equal(inventory.packagesRequiringManualReview, 1);
  assert.equal(inventory.toolingPackagesRequiringManualReview, 1);
  assert.doesNotMatch(notices, /build-tool/);
  assert.deepEqual(inventory.requiredBundledNotices, { electronChromiumHtmlIncluded: false });
  assert.equal(inventory.unresolved[0].name, 'beta');
});

test('generation writes notices and a machine-readable inventory', async () => {
  const root = await fixture();
  await generateNotices(root);
  const notices = await readFile(path.join(root, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  const inventory = JSON.parse(await readFile(path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json'), 'utf8'));
  assert.match(notices, /Alpha MIT terms\./);
  assert.equal(inventory.format, 'woho-third-party-license-inventory');
  assert.equal(inventory.packageCount, 3);
  assert.equal(inventory.runtimePackageCount, 2);
  assert.doesNotMatch(notices, /build-tool/);
});
