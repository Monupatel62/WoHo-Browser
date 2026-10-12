#!/usr/bin/env node
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LICENSE_NAME = /^(?:LICEN[CS]ES?|COPYING|NOTICE|PATENTS|AUTHORS)(?:[._-].*)?$/i;

function declaredLicense(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map(declaredLicense).filter(Boolean).join(' OR ');
  if (value && typeof value === 'object') return declaredLicense(value.type) || declaredLicense(value.name);
  return '';
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function licenseFilesFor(directory, relativePath) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !LICENSE_NAME.test(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    try {
      const info = await stat(filePath);
      if (info.size > 20 * 1024 * 1024) {
        files.push({
          path: path.posix.join(relativePath, entry.name),
          text: null,
          skippedReason: 'File exceeds 20 MiB; review and include it separately before release.',
        });
        continue;
      }
      const buffer = await readFile(filePath);
      if (buffer.includes(0)) {
        files.push({
          path: path.posix.join(relativePath, entry.name),
          text: null,
          skippedReason: 'File appears to be binary; review and include it separately before release.',
        });
        continue;
      }
      files.push({ path: path.posix.join(relativePath, entry.name), text: buffer.toString('utf8') });
    } catch (error) {
      files.push({
        path: path.posix.join(relativePath, entry.name),
        text: null,
        skippedReason: `Read failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function collectInstalledPackages(nodeModulesRoot) {
  const packages = [];
  const visited = new Set();

  async function visitNodeModules(modulesDirectory, relativeModulesDirectory) {
    if (visited.has(modulesDirectory)) return;
    visited.add(modulesDirectory);

    let entries;
    try {
      entries = await readdir(modulesDirectory, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.bin') continue;
      if (entry.name.startsWith('@')) {
        const scopeDirectory = path.join(modulesDirectory, entry.name);
        let scopedEntries = [];
        try {
          scopedEntries = await readdir(scopeDirectory, { withFileTypes: true });
        } catch {
          continue;
        }
        scopedEntries.sort((a, b) => a.name.localeCompare(b.name));
        for (const scopedEntry of scopedEntries) {
          if (!scopedEntry.isDirectory()) continue;
          await visitPackage(
            path.join(scopeDirectory, scopedEntry.name),
            path.posix.join(relativeModulesDirectory, entry.name, scopedEntry.name),
          );
        }
        continue;
      }
      await visitPackage(path.join(modulesDirectory, entry.name), path.posix.join(relativeModulesDirectory, entry.name));
    }
  }

  async function visitPackage(packageDirectory, relativePackageDirectory) {
    const manifest = await readJson(path.join(packageDirectory, 'package.json'));
    if (manifest && typeof manifest.name === 'string') {
      const files = await licenseFilesFor(packageDirectory, relativePackageDirectory);
      // Electron distributes Chromium's third-party notices alongside the Electron binary.
      // Include these legal files in addition to Electron's top-level license.
      if (manifest.name === 'electron') {
        files.push(...await licenseFilesFor(path.join(packageDirectory, 'dist'), path.posix.join(relativePackageDirectory, 'dist')));
        files.sort((a, b) => a.path.localeCompare(b.path));
      }
      packages.push({
        name: manifest.name,
        version: typeof manifest.version === 'string' ? manifest.version : 'unknown',
        path: relativePackageDirectory,
        declaredLicense: declaredLicense(manifest.license),
        dependencies: manifest.dependencies && typeof manifest.dependencies === 'object' ? manifest.dependencies : {},
        optionalDependencies: manifest.optionalDependencies && typeof manifest.optionalDependencies === 'object' ? manifest.optionalDependencies : {},
        licenseFiles: files,
      });
    }
    await visitNodeModules(path.join(packageDirectory, 'node_modules'), path.posix.join(relativePackageDirectory, 'node_modules'));
  }

  await visitNodeModules(nodeModulesRoot, 'node_modules');
  packages.sort((a, b) => a.path.localeCompare(b.path));
  return packages;
}

export function renderNotices(project, packages) {
  const sections = [
    `THIRD-PARTY NOTICES — ${project.name} ${project.version}`,
    '',
    'This file is generated from the installed npm dependency tree. It is a starting point for license review, not a legal opinion or a declaration that every distribution obligation has been satisfied.',
    'Review runtime-package entries in THIRD-PARTY-LICENSE-INVENTORY.json and resolve every missing/unclear shipped license or notice before public distribution. Build-only packages are tracked separately in the inventory.',
    '',
    `Runtime npm/Electron packages inventoried: ${packages.length}`,
    '',
  ];

  for (const item of packages) {
    sections.push('='.repeat(88));
    sections.push(`${item.name}@${item.version}`);
    sections.push(`Installed path: ${item.path}`);
    sections.push(`Declared license: ${item.declaredLicense || 'NOT DECLARED — REVIEW REQUIRED'}`);
    if (item.licenseFiles.length === 0) {
      sections.push('License text: no recognized package-level LICENSE/COPYING/NOTICE file found — REVIEW REQUIRED.');
      sections.push('');
      continue;
    }
    for (const file of item.licenseFiles) {
      sections.push('');
      sections.push(`--- ${file.path} ---`);
      if (file.text !== null) {
        sections.push(file.text.trimEnd());
      } else {
        sections.push(`NOTICE NOT EMBEDDED: ${file.skippedReason}`);
      }
    }
    sections.push('');
  }
  sections.push('='.repeat(88));
  sections.push('END OF GENERATED THIRD-PARTY NOTICES');
  sections.push('');
  return sections.join('\n');
}

export function releaseRelevantPackages(project, installedPackages) {
  const requiredNames = new Set([
    ...Object.keys(project.dependencies || {}),
    // Electron is a build dependency in package.json but its runtime binary ships with the app.
    'electron',
  ]);
  const queue = [...requiredNames];
  while (queue.length > 0) {
    const name = queue.shift();
    for (const item of installedPackages.filter((candidate) => candidate.name === name)) {
      for (const dependencyName of Object.keys({
        ...(item.dependencies || {}),
        ...(item.optionalDependencies || {}),
      })) {
        if (!requiredNames.has(dependencyName)) {
          requiredNames.add(dependencyName);
          queue.push(dependencyName);
        }
      }
    }
  }
  return installedPackages.filter((item) => requiredNames.has(item.name));
}

function reviewPackage(item) {
  const hasEmbeddedText = item.licenseFiles.some((file) => file.text !== null);
  const skippedFiles = item.licenseFiles.filter((file) => file.text === null).map((file) => ({
    path: file.path,
    reason: file.skippedReason,
  }));
  if (item.declaredLicense && hasEmbeddedText && skippedFiles.length === 0) return null;
  return {
    name: item.name,
    version: item.version,
    path: item.path,
    declaredLicense: item.declaredLicense || null,
    licenseFiles: item.licenseFiles.map((file) => file.path),
    missingOrSkippedTextFiles: skippedFiles,
    reviewReason: [
      !item.declaredLicense ? 'No license expression in package.json' : null,
      !hasEmbeddedText ? 'No readable recognized license text file' : null,
      skippedFiles.length > 0 ? 'One or more legal files were not embedded' : null,
    ].filter(Boolean),
  };
}

export function buildInventory(packages, runtimePackages = packages) {
  const allReviews = packages.map(reviewPackage).filter(Boolean);
  const runtimePaths = new Set(runtimePackages.map((item) => item.path));
  const runtimeReviews = allReviews.filter((item) => runtimePaths.has(item.path));
  const electronChromiumNoticeIncluded = Boolean(runtimePackages
    .find((item) => item.name === 'electron')
    ?.licenseFiles.some((file) => /LICENSES?\.chromium\.html$/i.test(file.path) && file.text !== null));
  return {
    format: 'woho-third-party-license-inventory',
    version: 1,
    generatedFrom: 'installed npm manifests; runtime notice scope is the production dependency closure plus the packaged Electron binary',
    generatedAt: new Date().toISOString(),
    packageCount: packages.length,
    runtimePackageCount: runtimePackages.length,
    packagesWithDeclaredLicense: packages.filter((item) => Boolean(item.declaredLicense)).length,
    packagesWithReadableLicenseText: packages.filter((item) => item.licenseFiles.some((file) => file.text !== null)).length,
    packagesRequiringManualReview: runtimeReviews.length,
    unresolved: runtimeReviews,
    toolingPackagesRequiringManualReview: allReviews.filter((item) => !runtimePaths.has(item.path)).length,
    toolingUnresolved: allReviews.filter((item) => !runtimePaths.has(item.path)),
    requiredBundledNotices: {
      electronChromiumHtmlIncluded: electronChromiumNoticeIncluded,
    },
    runtimePackages: runtimePackages.map((item) => ({
      name: item.name,
      version: item.version,
      path: item.path,
      declaredLicense: item.declaredLicense || null,
      licenseFiles: item.licenseFiles.map((file) => file.path),
    })),
    packages: packages.map((item) => ({
      name: item.name,
      version: item.version,
      path: item.path,
      declaredLicense: item.declaredLicense || null,
      licenseFiles: item.licenseFiles.map((file) => file.path),
      dependencies: item.dependencies || {},
      optionalDependencies: item.optionalDependencies || {},
    })),
  };
}

export async function generateNotices(root = rootDir) {
  const project = await readJson(path.join(root, 'package.json'));
  if (!project || typeof project.name !== 'string' || typeof project.version !== 'string') {
    throw new Error('Cannot read the project name/version from package.json.');
  }
  const nodeModulesRoot = path.join(root, 'node_modules');
  const packages = await collectInstalledPackages(nodeModulesRoot);
  if (packages.length === 0) throw new Error('No installed npm packages were found; run npm ci first.');

  const runtimePackages = releaseRelevantPackages(project, packages);
  if (runtimePackages.length === 0) throw new Error('No shipped runtime packages could be resolved from package.json.');
  const notices = renderNotices(project, runtimePackages);
  const inventory = buildInventory(packages, runtimePackages);
  await writeFile(path.join(root, 'THIRD-PARTY-NOTICES.txt'), notices + (notices.endsWith('\n') ? '' : '\n'), 'utf8');
  await writeFile(path.join(root, 'THIRD-PARTY-LICENSE-INVENTORY.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');

  const electron = packages.find((item) => item.name === 'electron');
  const chromiumNotice = electron?.licenseFiles.find((file) => /LICENSES?\.chromium\.html$/i.test(file.path));
  process.stdout.write(`Generated third-party notices for ${packages.length} packages. Manual license review required for ${inventory.packagesRequiringManualReview} package(s).\n`);
  if (chromiumNotice?.text !== null && chromiumNotice?.text !== undefined) {
    process.stdout.write('Electron/Chromium bundled third-party notice file was included.\n');
  } else if (chromiumNotice) {
    process.stdout.write(`WARNING: Electron/Chromium bundled license HTML was found but not embedded: ${chromiumNotice.skippedReason || 'unknown read issue'}.\n`);
  } else {
    process.stdout.write('WARNING: Electron/Chromium bundled license HTML was not found; release must remain blocked until located and reviewed.\n');
  }
  return inventory;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  generateNotices().catch((error) => {
    process.stderr.write(`Third-party notice generation failed: ${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
