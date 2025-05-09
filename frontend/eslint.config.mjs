import eslint from '@eslint/js';
// @ts-expect-error TS7016 -- types package does not exist for eslint-plugin-import
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @type {import("typescript-eslint").ConfigArray}
 */
const config = tseslint.config(
  {
    ignores: [
      '**/.react-router/', //
      '**/build/',
      '**/coverage/',
      '**/playwright-report/',
      '**/tmp/',
    ],
  },
  {
    //
    // base config
    //
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    //
    // non-typescript
    //
    files: ['**/*.{js,cjs,mjs}'],
    extends: [
      eslint.configs['recommended'], //
    ],
  },
  {
    //
    // typescript
    //
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslint.configs['recommended'],
      importPlugin.flatConfigs['recommended'],
      ...tseslint.configs['strict'],
      ...tseslint.configs['stylisticTypeChecked'],
    ],
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/require-await': 'error',
      'eqeqeq': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'no-param-reassign': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router',
              importNames: ['SessionData'],
              message: "Please use the SessionData import from 'express-session' instead.",
            },
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    //
    // react
    //
    files: ['**/*.tsx'],
    extends: [
      jsxA11yPlugin.flatConfigs['recommended'],
      reactHooksPlugin.configs['recommended-latest'],
      // @ts-expect-error TS2322 -- see https://github.com/jsx-eslint/eslint-plugin-react/issues/3878
      reactPlugin.configs.flat['recommended'],
      // @ts-expect-error TS2322 -- see https://github.com/jsx-eslint/eslint-plugin-react/issues/3878
      reactPlugin.configs.flat['jsx-runtime'],
    ],
    rules: {
      'react/no-unknown-property': ['error', { ignore: ['property', 'resource', 'typeof', 'vocab'] }],
      'react/prop-types': 'off',
    },
    settings: {
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
      react: {
        version: 'detect',
      },
    },
  },
);

export default config;
