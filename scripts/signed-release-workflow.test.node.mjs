import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const workflowPath = new URL('../.github/workflows/signed-release.yml', import.meta.url);
const workflow = (await readFile(workflowPath, 'utf8')).replace(/\r\n/g, '\n');

test('signed release workflow defaults to read-only permissions', () => {
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /draft-release:\n[\s\S]*?permissions:\n      actions: read\n      contents: write/);
});

test('release tag sets the same package version for Windows, Android, and legal evidence', () => {
  assert.equal((workflow.match(/name: Set package version from release tag/g) || []).length, 3);
  assert.match(workflow, /npm version "\$\{GITHUB_REF_NAME#v\}" --no-git-tag-version --allow-same-version --ignore-scripts/);
  assert.match(workflow, /npm version "\$version" --no-git-tag-version --allow-same-version --ignore-scripts/);
});

test('signing secrets are scoped to the exact steps that need them', () => {
  assert.doesNotMatch(workflow, /windows:\n[\s\S]*?runs-on: windows-latest\n    env:/);
  assert.doesNotMatch(workflow, /android:\n[\s\S]*?runs-on: ubuntu-latest\n    env:/);
  assert.match(workflow, /Sign and stage Windows application\n        shell: pwsh\n        env:\n          WIN_CSC_LINK:/);
  assert.match(workflow, /Build signed NSIS installer from verified application image\n        shell: pwsh\n        env:\n          WIN_CSC_LINK:/);
  assert.match(workflow, /Require Android signing secrets and create temporary keystore\n        shell: bash\n        env:\n          ANDROID_KEYSTORE_BASE64:/);
  assert.match(workflow, /Build signed Android release APK and AAB\n        shell: bash\n        env:\n          ANDROID_KEYSTORE_PASSWORD:/);
  assert.match(workflow, /Run Android unit tests without signing credentials\n        run: gradle -p android clean testDebugUnitTest/);
});

test('Windows release verifies staged notice resources before and after installer packaging', () => {
  assert.match(workflow, /Merge exact packaged Chromium notices\n        run: node scripts\/merge-electron-chromium-notices\.mjs/);
  assert.equal((workflow.match(/npm run verify:release-legal -- --require-chromium/g) || []).length, 2);
  assert.match(workflow, /electron-builder --win nsis --prepackaged release\/win-unpacked --publish never/);
  assert.match(workflow, /Verify packaged Electron fuses/);
  assert.match(workflow, /Verify Windows Authenticode signatures/);
});
