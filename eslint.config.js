import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettierConfig,

  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
      // ✅ FIX: Ignora React components + imports
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^React$|^Routes$|^Route$|^Navigate$',
          caughtErrors: 'all',
        },
      ],
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.node,
        ...globals.browser,
        atob: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },

  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.commonjs,
    },
  },

  {
    files: ['apps/web-portal/**/*.{js,jsx}', 'apps/nexus-root/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
  },

  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: { globals: globals.jest },
  },

  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.vite/**',
      '**/*.min.js',
    ],
  },
];
