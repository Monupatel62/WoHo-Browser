export default [
  { ignores: ['out/**', 'release/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: { 'no-debugger': 'error', 'no-constant-condition': 'error' },
  },
];
