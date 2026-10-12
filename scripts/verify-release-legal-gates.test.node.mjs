import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateReleaseLegalGates } from './verify-release-legal-gates.mjs';

const inventory = {
  format: 'woho-third-party-license-inventory',
  version: 1,
  packageCount: 1,
  packagesRequiringManualReview: 0,
  unresolved: [],
  requiredBundledNotices: { electronChromiumHtmlIncluded: true },
};

test('release legal gate passes only when all required evidence is present', () => {
  assert.deepEqual(evaluateReleaseLegalGates({
    licenseExists: true,
    noticesExists: true,
    inventory,
  }), []);
});

test('release legal gate blocks an unlicensed project', () => {
  const errors = evaluateReleaseLegalGates({ licenseExists: false, noticesExists: true, inventory });
  assert.ok(errors.some((error) => error.includes('Project LICENSE file is missing')));
});

test('release legal gate blocks dependencies awaiting manual review', () => {
  const unresolvedInventory = {
    ...inventory,
    packagesRequiringManualReview: 1,
    unresolved: [{ name: 'unknown-package', version: '1.0.0', reviewReason: ['No readable license text'] }],
  };
  const errors = evaluateReleaseLegalGates({ licenseExists: true, noticesExists: true, inventory: unresolvedInventory });
  assert.ok(errors.some((error) => error.includes('unknown-package@1.0.0')));
});

test('release legal gate blocks missing bundled Chromium license notices', () => {
  const errors = evaluateReleaseLegalGates({
    licenseExists: true,
    noticesExists: true,
    inventory: { ...inventory, requiredBundledNotices: { electronChromiumHtmlIncluded: false } },
    requireChromiumNotice: true,
  });
  assert.ok(errors.some((error) => error.includes('LICENSES.chromium.html')));
});

test('release legal gate blocks missing notices and invalid inventory', () => {
  const errors = evaluateReleaseLegalGates({ licenseExists: true, noticesExists: false, inventory: null });
  assert.ok(errors.some((error) => error.includes('THIRD-PARTY-NOTICES.txt is missing')));
  assert.ok(errors.some((error) => error.includes('inventory is missing')));
});

test('platform-neutral legal preflight does not require the Electron-only Chromium file', () => {
  assert.deepEqual(evaluateReleaseLegalGates({
    licenseExists: true,
    noticesExists: true,
    inventory: { ...inventory, requiredBundledNotices: { electronChromiumHtmlIncluded: false } },
  }), []);
});
