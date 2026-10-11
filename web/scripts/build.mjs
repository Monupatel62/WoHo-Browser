import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public');
const output = path.resolve(root, '../dist/web');
const required = ['index.html', 'styles.css', 'app.js', 'bookmarks.mjs'];
for (const file of required) {
  const content = await readFile(path.join(source, file), 'utf8');
  if (!content.trim()) throw new Error('Required web asset is empty: ' + file);
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
for (const asset of ['./styles.css', './app.js']) if (!html.includes(asset)) throw new Error('Web entry point does not reference ' + asset);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
console.log('Verified and staged Web companion assets: ' + (await readdir(output)).sort().join(', '));
