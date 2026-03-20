import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  // Configurações recomendadas
  js.configs.recommended,
  prettierConfig, // Desabilita regras conflitantes com Prettier

  // ── Configuração base monorepo ──────────────────────────────
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest', // 2024+
      sourceType: 'module',
      ecmaFeatures: { jsx: true }, // ✅ FIX: Suporte JSX
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        setImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // ✅ FIX: Erros no-undef
        atob: 'readonly',
        URLSearchParams: 'readonly',
        ...globals.node, // Node.js completo
      },
    },
  },

  // ── Arquivos .cjs (CommonJS) ───────────────────────────────
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },

  // ── Frontend React/JSX (apps web-portal & nexus-root) ──────
  {
    files: [
      'apps/web-portal/**/*.{js,jsx,ts,tsx}',
      'apps/nexus-root/**/*.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigator: 'readonly',
      },
    },
  },

  // ── Testes Jest ────────────────────────────────────────────
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },

  // ── Ignores ────────────────────────────────────────────────
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
